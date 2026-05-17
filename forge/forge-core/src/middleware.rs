/// Middleware module for request/response processing

pub mod logging {
    use axum::{
        body::Body,
        extract::Request,
        middleware::Next,
        response::Response,
    };
    use tracing::info;

    /// Logging middleware
    pub async fn log_requests(request: Request, next: Next) -> Response {
        let method = request.method().clone();
        let uri = request.uri().clone();

        info!("{} {}", method, uri);

        next.run(request).await
    }
}

pub mod auth {
    use axum::{
        extract::Request,
        middleware::Next,
        response::Response,
        http::StatusCode,
    };

    /// Basic auth middleware (placeholder)
    pub async fn require_auth(request: Request, next: Next) -> Result<Response, StatusCode> {
        // TODO: Implement actual auth validation
        Ok(next.run(request).await)
    }
}

pub mod timing {
    use axum::{
        extract::Request,
        middleware::Next,
        response::Response,
    };
    use std::time::Instant;
    use tracing::debug;

    /// Request timing middleware
    pub async fn track_timing(request: Request, next: Next) -> Response {
        let start = Instant::now();
        let response = next.run(request).await;
        let elapsed = start.elapsed();

        debug!("Request took {:?}", elapsed);

        response
    }
}
