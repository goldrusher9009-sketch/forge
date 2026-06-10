use actix_web::{web, App, HttpServer, middleware};
use actix_web::middleware::Logger;
use std::env;

mod handlers;
mod models;
mod repository;
mod blockchain;
mod youtoken;
mod predictions;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let pg_pool = repository::connect_postgres(&env::var("DATABASE_URL").expect("DATABASE_URL")).await;
    let redis = repository::connect_redis(&env::var("REDIS_URL").unwrap_or("redis://localhost".into()));
    let rpc_url = env::var("BASE_RPC_URL").expect("BASE_RPC_URL required");
    let chain = blockchain::BaseChainClient::new(&rpc_url).await;

    let port = env::var("PORT").unwrap_or("3004".into());

    log::info!("Finance service starting on :{}", port);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pg_pool.clone()))
            .app_data(web::Data::new(redis.clone()))
            .app_data(web::Data::new(chain.clone()))
            .wrap(Logger::default())
            .wrap(middleware::Compress::default())
            .service(web::scope("/v1/wallet")
                // Balances
                .route("/balance", web::get().to(handlers::get_balance))
                .route("/balance/history", web::get().to(handlers::balance_history))

                // Transactions
                .route("/transactions", web::get().to(handlers::list_transactions))
                .route("/send", web::post().to(handlers::send_viva))
                .route("/stake", web::post().to(handlers::stake_viva))
                .route("/unstake", web::post().to(handlers::unstake_viva))

                // Earn Events
                .route("/earn/log", web::post().to(handlers::log_earn_event))
                .route("/earn/today", web::get().to(handlers::earned_today))

                // YouToken (bonding curve)
                .route("/youtoken/price/{userId}", web::get().to(youtoken::get_price))
                .route("/youtoken/buy/{userId}", web::post().to(youtoken::buy_tokens))
                .route("/youtoken/sell/{userId}", web::post().to(youtoken::sell_tokens))
                .route("/youtoken/holdings", web::get().to(youtoken::get_holdings))

                // Embedded Wallet
                .route("/wallet/create", web::post().to(handlers::create_embedded_wallet))
                .route("/wallet/export", web::post().to(handlers::export_wallet_keys))

                // Value Drop / Referral
                .route("/referral/claim", web::post().to(handlers::claim_referral_reward))
                .route("/referral/stats", web::get().to(handlers::referral_stats))

                // Revenue Share
                .route("/revenue/ads", web::get().to(handlers::ad_revenue_share))
                .route("/revenue/creator", web::get().to(handlers::creator_revenue))
            )
            .service(web::scope("/v1/predictions")
                .route("/markets", web::get().to(predictions::list_markets))
                .route("/markets", web::post().to(predictions::create_market))
                .route("/markets/{id}", web::get().to(predictions::get_market))
                .route("/markets/{id}/bet", web::post().to(predictions::place_bet))
                .route("/markets/{id}/resolve", web::post().to(predictions::resolve_market))
                .route("/markets/{id}/claim", web::post().to(predictions::claim_winnings))
                .route("/my/bets", web::get().to(predictions::my_bets))
            )
            .route("/health", web::get().to(|| async { "OK" }))
    })
    .bind(format!("0.0.0.0:{}", port))?
    .workers(num_cpus::get())
    .run()
    .await
}
