use actix_web::{web, App, HttpServer, middleware};
use actix_web::middleware::Logger;
use std::env;

mod auth;
mod proxy;
mod rate_limit;
mod vscore_inject;
mod ws;
mod config;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let redis_url = env::var("REDIS_URL").expect("REDIS_URL required");
    let redis_client = redis::Client::open(redis_url).expect("Redis connect failed");

    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_addr = format!("0.0.0.0:{}", port);

    log::info!("VIVA API Gateway starting on {}", bind_addr);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(redis_client.clone()))
            .wrap(Logger::default())
            .wrap(middleware::Compress::default())
            .wrap(auth::JwtMiddleware)
            .wrap(rate_limit::RateLimitMiddleware::new(redis_client.clone()))
            .wrap(vscore_inject::VScoreInjectMiddleware)
            // Proxy routes to microservices
            .configure(proxy::configure_routes)
            // WebSocket upgrade
            .route("/ws", web::get().to(ws::ws_handler))
            // Health check
            .route("/health", web::get().to(|| async { "OK" }))
    })
    .bind(&bind_addr)?
    .workers(num_cpus::get())
    .run()
    .await
}
