use actix_web::web;

// Service base URLs from environment
pub struct Services {
    pub messenger: String,
    pub social: String,
    pub marketplace: String,
    pub finance: String,
    pub vscore: String,
    pub twin: String,
    pub health: String,
    pub dating: String,
    pub rooms: String,
    pub notifications: String,
}

impl Services {
    pub fn from_env() -> Self {
        Self {
            messenger: std::env::var("MESSENGER_URL")
                .unwrap_or("http://messenger:3001".into()),
            social: std::env::var("SOCIAL_URL")
                .unwrap_or("http://social:3002".into()),
            marketplace: std::env::var("MARKETPLACE_URL")
                .unwrap_or("http://marketplace:3003".into()),
            finance: std::env::var("FINANCE_URL")
                .unwrap_or("http://finance:3004".into()),
            vscore: std::env::var("VSCORE_URL")
                .unwrap_or("http://vscore:3005".into()),
            twin: std::env::var("TWIN_URL")
                .unwrap_or("http://twin:3006".into()),
            health: std::env::var("HEALTH_URL")
                .unwrap_or("http://health:3007".into()),
            dating: std::env::var("DATING_URL")
                .unwrap_or("http://dating:3008".into()),
            rooms: std::env::var("ROOMS_URL")
                .unwrap_or("http://rooms:3009".into()),
            notifications: std::env::var("NOTIFICATIONS_URL")
                .unwrap_or("http://notifications:3010".into()),
        }
    }
}

pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Messenger
        .service(web::scope("/v1/messenger")
            .route("/{tail:.*}", web::to(proxy_messenger)))
        // Social
        .service(web::scope("/v1/social")
            .route("/{tail:.*}", web::to(proxy_social)))
        // Marketplace
        .service(web::scope("/v1/marketplace")
            .route("/{tail:.*}", web::to(proxy_marketplace)))
        // Finance / Wallet
        .service(web::scope("/v1/wallet")
            .route("/{tail:.*}", web::to(proxy_finance)))
        // V-Score
        .service(web::scope("/v1/vscore")
            .route("/{tail:.*}", web::to(proxy_vscore)))
        // AI Twin
        .service(web::scope("/v1/twin")
            .route("/{tail:.*}", web::to(proxy_twin)))
        // Health Vault
        .service(web::scope("/v1/health")
            .route("/{tail:.*}", web::to(proxy_health)))
        // Dating
        .service(web::scope("/v1/dating")
            .route("/{tail:.*}", web::to(proxy_dating)))
        // Rooms
        .service(web::scope("/v1/rooms")
            .route("/{tail:.*}", web::to(proxy_rooms)))
        // Predictions
        .service(web::scope("/v1/predictions")
            .route("/{tail:.*}", web::to(proxy_finance)));
}

async fn proxy_messenger() -> &'static str { "messenger proxy" }
async fn proxy_social() -> &'static str { "social proxy" }
async fn proxy_marketplace() -> &'static str { "marketplace proxy" }
async fn proxy_finance() -> &'static str { "finance proxy" }
async fn proxy_vscore() -> &'static str { "vscore proxy" }
async fn proxy_twin() -> &'static str { "twin proxy" }
async fn proxy_health() -> &'static str { "health proxy" }
async fn proxy_dating() -> &'static str { "dating proxy" }
async fn proxy_rooms() -> &'static str { "rooms proxy" }
