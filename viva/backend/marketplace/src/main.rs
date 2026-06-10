use actix_web::{web, App, HttpServer, middleware};
use actix_web::middleware::Logger;
use std::env;

mod handlers;
mod models;
mod repository;
mod escrow;
mod search;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();

    let pg_pool = repository::connect_postgres(&env::var("DATABASE_URL").expect("DATABASE_URL")).await;
    let redis = repository::connect_redis(&env::var("REDIS_URL").unwrap_or("redis://localhost".into()));
    let es_client = search::ElasticClient::new(&env::var("ELASTICSEARCH_URL").unwrap_or("http://localhost:9200".into()));

    let port = env::var("PORT").unwrap_or("3003".into());

    log::info!("Marketplace service starting on :{}", port);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pg_pool.clone()))
            .app_data(web::Data::new(redis.clone()))
            .app_data(web::Data::new(es_client.clone()))
            .wrap(Logger::default())
            .wrap(middleware::Compress::default())
            // Listings
            .service(web::scope("/v1/marketplace")
                .route("/listings", web::get().to(handlers::list_listings))
                .route("/listings", web::post().to(handlers::create_listing))
                .route("/listings/{id}", web::get().to(handlers::get_listing))
                .route("/listings/{id}", web::put().to(handlers::update_listing))
                .route("/listings/{id}", web::delete().to(handlers::delete_listing))
                .route("/listings/search", web::get().to(handlers::search_listings))
                // Orders
                .route("/orders", web::post().to(handlers::create_order))
                .route("/orders/{id}", web::get().to(handlers::get_order))
                .route("/orders/{id}/confirm", web::post().to(handlers::confirm_order))
                .route("/orders/{id}/ship", web::post().to(handlers::mark_shipped))
                .route("/orders/{id}/complete", web::post().to(handlers::complete_order))
                .route("/orders/{id}/dispute", web::post().to(handlers::open_dispute))
                // Escrow (smart contract interactions)
                .route("/escrow/{orderId}/fund", web::post().to(escrow::fund_escrow))
                .route("/escrow/{orderId}/release", web::post().to(escrow::release_escrow))
                .route("/escrow/{orderId}/refund", web::post().to(escrow::refund_escrow))
                // Ad Marketplace
                .route("/ads/slots", web::get().to(handlers::list_ad_slots))
                .route("/ads/slots/{postId}", web::post().to(handlers::purchase_ad_slot))
                .route("/ads/slots/{postId}/approve", web::post().to(handlers::approve_ad))
                .route("/ads/slots/{postId}/reject", web::post().to(handlers::reject_ad))
                // Reviews
                .route("/listings/{id}/reviews", web::post().to(handlers::create_review))
                .route("/listings/{id}/reviews", web::get().to(handlers::list_reviews))
            )
            .route("/health", web::get().to(|| async { "OK" }))
    })
    .bind(format!("0.0.0.0:{}", port))?
    .workers(num_cpus::get())
    .run()
    .await
}
