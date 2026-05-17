use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub environment: String,
    pub log_level: String,
    pub database_url: Option<String>,
    pub redis_url: Option<String>,
    pub max_queue_size: usize,
    pub worker_threads: usize,
    pub request_timeout_seconds: u32,
}

impl Config {
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config = Self {
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()?,
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            database_url: env::var("DATABASE_URL").ok(),
            redis_url: env::var("REDIS_URL").ok(),
            max_queue_size: env::var("MAX_QUEUE_SIZE")
                .unwrap_or_else(|_| "10000".to_string())
                .parse()?,
            worker_threads: env::var("WORKER_THREADS")
                .unwrap_or_else(|_| "4".to_string())
                .parse()?,
            request_timeout_seconds: env::var("REQUEST_TIMEOUT_SECONDS")
                .unwrap_or_else(|_| "30".to_string())
                .parse()?,
        };

        Ok(config)
    }

    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }

    pub fn is_development(&self) -> bool {
        self.environment == "development"
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: "0.0.0.0".to_string(),
            port: 3000,
            environment: "development".to_string(),
            log_level: "info".to_string(),
            database_url: None,
            redis_url: None,
            max_queue_size: 10000,
            worker_threads: 4,
            request_timeout_seconds: 30,
        }
    }
}
