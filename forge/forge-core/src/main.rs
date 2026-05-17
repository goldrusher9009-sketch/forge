mod router;     // HTTP router for Axum endpoints
mod llm_router; // LLM routing module for complexity-based model selection
mod agents;
mod executor;
mod models;
mod error;
mod middleware;
mod config;
mod worker;     // Background worker for task execution

use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber;
use tokio::signal;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("forge_core=info".parse().unwrap()),
        )
        .init();

    // Load configuration
    let config = config::Config::load().expect("Failed to load config");
    tracing::info!("Starting Forge Core v{}", env!("CARGO_PKG_VERSION"));
    tracing::info!("Environment: {}", config.environment);
    tracing::info!("Listening on {}:{}", config.host, config.port);

    // Build router with all routes (async operation for DB initialization)
    let app = match router::build_router().await {
        Ok(router) => {
            tracing::info!("Router initialized successfully");
            router
        }
        Err(e) => {
            tracing::error!("Failed to initialize router: {}", e);
            std::process::exit(1);
        }
    };

    // Bind server address
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(listener) => {
            tracing::info!("Server listening on {}", addr);
            listener
        }
        Err(e) => {
            tracing::error!("Failed to bind to {}: {}", addr, e);
            std::process::exit(1);
        }
    };

    // Start background worker for task execution
    let worker_config = config.clone();
    let worker_handle = tokio::spawn(async move {
        if let Err(e) = worker::start_worker(worker_config).await {
            tracing::error!("Worker error: {}", e);
        }
    });

    // Create server
    let server = axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal());

    tracing::info!("Forge Core startup complete");

    // Run server
    if let Err(e) = server.await {
        tracing::error!("Server error: {}", e);
        std::process::exit(1);
    }

    // Graceful shutdown
    tracing::info!("Server shutting down...");
    worker_handle.abort();
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("Failed to install CTRL+C signal handler");
    };

    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install SIGTERM signal handler")
            .recv()
            .await;
    };

    tokio::select! {
        _ = ctrl_c => {
            tracing::info!("CTRL+C signal received");
        }
        _ = terminate => {
            tracing::info!("SIGTERM signal received");
        }
    }
}
