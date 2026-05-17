use axum::{
    extract::{Path, State, Json},
    routing::{get, post},
    Router, http::StatusCode,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use stripe::{Client, Event, EventObject};
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct BillingState {
    pub pool: PgPool,
    pub stripe_client: Arc<Client>,
}

// ==================== ROUTES ====================

pub fn billing_routes(pool: PgPool, stripe_client: Arc<Client>) -> Router {
    let state = BillingState { pool, stripe_client };

    Router::new()
        // POST /api/v1/billing/subscribe - Create/upgrade subscription
        .route("/subscribe", post(create_subscription))

        // POST /api/v1/billing/webhook - Stripe webhook handler
        .route("/webhook", post(handle_stripe_webhook))

        // GET /api/v1/billing/subscription/:user_id - Get user subscription
        .route("/subscription/:user_id", get(get_subscription))

        // POST /api/v1/billing/usage - Record usage (API calls, storage, concurrent users)
        .route("/usage", post(record_usage))

        // GET /api/v1/billing/invoices/:user_id - Get user invoices
        .route("/invoices/:user_id", get(get_invoices))

        // POST /api/v1/billing/usage/calculate - Calculate and charge overages
        .route("/usage/calculate", post(calculate_and_charge_overages))

        .with_state(state)
}

// ==================== TYPES ====================

#[derive(Debug, Serialize, Deserialize)]
pub struct SubscribeRequest {
    pub user_id: String,
    pub plan: String, // "free", "pro", "enterprise"
    pub stripe_customer_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubscriptionResponse {
    pub user_id: String,
    pub plan: String,
    pub status: String,
    pub current_period_start: String,
    pub current_period_end: String,
    pub stripe_subscription_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UsageRecord {
    pub user_id: String,
    pub metric_type: String, // "api_calls", "storage", "concurrent_users"
    pub amount: i64,
    pub timestamp: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InvoiceResponse {
    pub id: String,
    pub user_id: String,
    pub amount: f64,
    pub status: String,
    pub created_at: String,
    pub due_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WebhookPayload {
    pub id: String,
    pub object: String,
    pub api_version: String,
    pub created: i64,
    pub data: serde_json::Value,
    pub request: Option<serde_json::Value>,
    pub type_field: String,
}

// ==================== HANDLERS ====================

/// POST /api/v1/billing/subscribe
/// Create or upgrade a subscription
pub async fn create_subscription(
    State(state): State<BillingState>,
    Json(req): Json<SubscribeRequest>,
) -> Result<(StatusCode, Json<SubscriptionResponse>), (StatusCode, String)> {
    // 1. Check if user already has subscription
    let existing = sqlx::query!(
        "SELECT stripe_subscription_id, plan FROM subscriptions WHERE user_id = $1",
        req.user_id
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Get or create Stripe customer
    let stripe_customer_id = if let Some(cid) = req.stripe_customer_id {
        cid
    } else {
        // Create new customer in Stripe
        let customer = stripe::Customer::create(&state.stripe_client, Default::default())
            .await
            .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
        customer.id.to_string()
    };

    // 3. Get price ID for plan
    let price_id = match req.plan.as_str() {
        "free" => "price_free",
        "pro" => "price_pro_monthly",
        "enterprise" => "price_enterprise_custom",
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid plan".to_string())),
    };

    // 4. Create/update subscription in Stripe
    let stripe_sub = if let Some(existing_sub) = existing {
        // Update existing subscription
        if let Some(sub_id) = existing_sub.stripe_subscription_id {
            stripe::Subscription::retrieve(&state.stripe_client, &sub_id, Default::default())
                .await
                .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
        } else {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, "No subscription found".to_string()));
        }
    } else {
        // Create new subscription
        let mut params = stripe::CreateSubscription::new(stripe_customer_id.clone());
        params.items = Some(vec![stripe::CreateSubscriptionItems {
            price: Some(price_id.to_string()),
            ..Default::default()
        }]);

        stripe::Subscription::create(&state.stripe_client, params)
            .await
            .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
    };

    // 5. Store subscription in database
    let now = chrono::Utc::now();
    sqlx::query!(
        "INSERT INTO subscriptions (user_id, plan, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET plan = $2, stripe_subscription_id = $4, status = $5",
        req.user_id,
        req.plan,
        stripe_customer_id,
        stripe_sub.id.to_string(),
        "active",
        now,
        now + chrono::Duration::days(30),
        now
    )
    .execute(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok((
        StatusCode::CREATED,
        Json(SubscriptionResponse {
            user_id: req.user_id,
            plan: req.plan,
            status: "active".to_string(),
            current_period_start: now.to_rfc3339(),
            current_period_end: (now + chrono::Duration::days(30)).to_rfc3339(),
            stripe_subscription_id: Some(stripe_sub.id.to_string()),
        }),
    ))
}

/// POST /api/v1/billing/webhook
/// Handle Stripe webhook events
pub async fn handle_stripe_webhook(
    State(state): State<BillingState>,
    Json(event): Json<WebhookPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    tracing::info!("Stripe webhook received: {}", event.type_field);

    match event.type_field.as_str() {
        "customer.created" => {
            // Log customer creation
            tracing::info!("Customer created: {:?}", event.data);
            Ok(StatusCode::OK)
        }
        "payment_intent.succeeded" => {
            // Update invoice as paid
            let payment_intent = event
                .data
                .get("object")
                .and_then(|o| o.get("id"))
                .and_then(|id| id.as_str());

            if let Some(payment_id) = payment_intent {
                sqlx::query!(
                    "UPDATE invoices SET status = 'paid' WHERE stripe_payment_intent_id = $1",
                    payment_id
                )
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }

            Ok(StatusCode::OK)
        }
        "invoice.payment_failed" => {
            // Mark invoice as failed
            let invoice_id = event
                .data
                .get("object")
                .and_then(|o| o.get("id"))
                .and_then(|id| id.as_str());

            if let Some(inv_id) = invoice_id {
                sqlx::query!(
                    "UPDATE invoices SET status = 'failed' WHERE stripe_invoice_id = $1",
                    inv_id
                )
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            }

            Ok(StatusCode::OK)
        }
        "charge.refunded" => {
            // Handle refund
            tracing::info!("Refund processed: {:?}", event.data);
            Ok(StatusCode::OK)
        }
        _ => {
            tracing::warn!("Unhandled webhook type: {}", event.type_field);
            Ok(StatusCode::OK)
        }
    }
}

/// GET /api/v1/billing/subscription/:user_id
/// Get user's current subscription
pub async fn get_subscription(
    State(state): State<BillingState>,
    Path(user_id): Path<String>,
) -> Result<Json<SubscriptionResponse>, (StatusCode, String)> {
    let sub = sqlx::query!(
        "SELECT plan, status, current_period_start, current_period_end, stripe_subscription_id FROM subscriptions WHERE user_id = $1",
        user_id
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Subscription not found".to_string()))?;

    Ok(Json(SubscriptionResponse {
        user_id,
        plan: sub.plan,
        status: sub.status,
        current_period_start: sub.current_period_start.to_rfc3339(),
        current_period_end: sub.current_period_end.to_rfc3339(),
        stripe_subscription_id: sub.stripe_subscription_id,
    }))
}

/// POST /api/v1/billing/usage
/// Record usage metrics (API calls, storage, concurrent users)
pub async fn record_usage(
    State(state): State<BillingState>,
    Json(record): Json<UsageRecord>,
) -> Result<StatusCode, (StatusCode, String)> {
    let now = chrono::Utc::now();
    let timestamp = record
        .timestamp
        .as_ref()
        .and_then(|t| chrono::DateTime::parse_from_rfc3339(t).ok())
        .map(|dt| dt.with_timezone(&chrono::Utc))
        .unwrap_or(now);

    match record.metric_type.as_str() {
        "api_calls" => {
            sqlx::query!(
                "INSERT INTO usage_metrics (user_id, api_calls, timestamp) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, DATE(timestamp)) DO UPDATE SET api_calls = usage_metrics.api_calls + $2",
                record.user_id,
                record.amount,
                timestamp
            )
            .execute(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
        "storage" => {
            sqlx::query!(
                "INSERT INTO storage_metrics (user_id, storage_bytes, timestamp) VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, DATE(timestamp)) DO UPDATE SET storage_bytes = $2",
                record.user_id,
                record.amount,
                timestamp
            )
            .execute(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
        "concurrent_users" => {
            sqlx::query!(
                "INSERT INTO monthly_usage (user_id, concurrent_users, month) VALUES ($1, $2, DATE_TRUNC('month', $3)::date)
                 ON CONFLICT (user_id, month) DO UPDATE SET concurrent_users = $2",
                record.user_id,
                record.amount as i32,
                timestamp
            )
            .execute(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid metric type".to_string())),
    }

    Ok(StatusCode::OK)
}

/// GET /api/v1/billing/invoices/:user_id
/// Get user's invoices
pub async fn get_invoices(
    State(state): State<BillingState>,
    Path(user_id): Path<String>,
) -> Result<Json<Vec<InvoiceResponse>>, (StatusCode, String)> {
    let invoices = sqlx::query!(
        "SELECT id, amount, status, created_at, due_date FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        user_id
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(
        invoices
            .into_iter()
            .map(|inv| InvoiceResponse {
                id: inv.id,
                user_id: user_id.clone(),
                amount: inv.amount,
                status: inv.status,
                created_at: inv.created_at.to_rfc3339(),
                due_date: inv.due_date.map(|d| d.to_rfc3339()),
            })
            .collect(),
    ))
}

/// POST /api/v1/billing/usage/calculate
/// Calculate overages and generate invoices for the current month
pub async fn calculate_and_charge_overages(
    State(state): State<BillingState>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let now = chrono::Utc::now();
    let month_start = now
        .with_day(1)
        .unwrap()
        .with_hour(0)
        .unwrap()
        .with_minute(0)
        .unwrap()
        .with_second(0)
        .unwrap();

    // Get all users with active subscriptions
    let users = sqlx::query!("SELECT user_id FROM subscriptions WHERE status = 'active'")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut charged_count = 0;

    for user in users {
        // Calculate API call overages (free: 10K/month, pro: 100K/month, enterprise: unlimited)
        let api_calls: i64 = sqlx::query_scalar!(
            "SELECT COALESCE(SUM(api_calls), 0) FROM usage_metrics WHERE user_id = $1 AND timestamp >= $2",
            user.user_id,
            month_start
        )
        .fetch_one(&state.pool)
        .await
        .unwrap_or(0);

        // Get subscription tier
        let plan: String = sqlx::query_scalar!(
            "SELECT plan FROM subscriptions WHERE user_id = $1",
            user.user_id
        )
        .fetch_one(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let (free_tier, overage_rate) = match plan.as_str() {
            "free" => (10_000, 0.001), // $0.001 per API call
            "pro" => (100_000, 0.0005),
            "enterprise" => (i64::MAX, 0.0), // No overages
            _ => continue,
        };

        let overage_calls = (api_calls - free_tier).max(0);
        if overage_calls > 0 {
            let overage_charge = (overage_calls as f64) * overage_rate;

            // Create invoice for overage
            if overage_charge > 0.0 {
                sqlx::query!(
                    "INSERT INTO invoices (user_id, amount, status, invoice_type, created_at, due_date)
                     VALUES ($1, $2, $3, $4, $5, $6)",
                    user.user_id,
                    overage_charge,
                    "pending",
                    "overage",
                    now,
                    now + chrono::Duration::days(30)
                )
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

                charged_count += 1;
            }
        }
    }

    Ok(Json(serde_json::json!({
        "message": format!("Calculated overages for {} users", charged_count),
        "charged_count": charged_count
    })))
}
