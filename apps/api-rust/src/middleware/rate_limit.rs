use axum::{
    extract::{ConnectInfo, Request, State},
    middleware::Next,
    response::Response,
};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

use crate::error::AppError;
use crate::AppState;

/// Hybrid rate limiter: tries Redis first, falls back to in-memory.
/// In production with multiple instances, Redis ensures distributed limiting.
#[derive(Clone)]
pub struct RateLimiter {
    /// In-memory fallback: Map of IP -> (request_count, window_start)
    windows: Arc<Mutex<HashMap<String, (u32, Instant)>>>,
    max_requests: u32,
    window_secs: u64,
    window_duration: Duration,
    redis: Option<Arc<fred::clients::RedisClient>>,
}

impl RateLimiter {
    pub fn new(max_requests: u32, window_secs: u64) -> Self {
        Self {
            windows: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window_secs,
            window_duration: Duration::from_secs(window_secs),
            redis: None,
        }
    }

    pub fn with_redis(mut self, client: Arc<fred::clients::RedisClient>) -> Self {
        self.redis = Some(client);
        self
    }

    async fn check(&self, key: &str) -> bool {
        // Try Redis first
        if let Some(ref redis) = self.redis {
            if let Ok(allowed) = self.check_redis(redis, key).await {
                return allowed;
            }
            // Redis failed — fall through to in-memory
        }

        // In-memory fallback
        self.check_memory(key).await
    }

    async fn check_redis(&self, redis: &fred::clients::RedisClient, key: &str) -> Result<bool, fred::error::RedisError> {
        use fred::interfaces::KeysInterface;

        let redis_key = format!("rate_limit:{}", key);
        let count: i64 = redis.incr(&redis_key).await?;

        if count == 1 {
            // First request in window — set expiry
            let _: () = redis.expire(&redis_key, self.window_secs as i64).await?;
        }

        Ok(count <= self.max_requests as i64)
    }

    /// Spawn a background task that periodically cleans up expired rate limit entries.
    pub fn spawn_cleanup_task(&self) {
        let windows = self.windows.clone();
        let window_duration = self.window_duration;
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(300)); // every 5 minutes
            loop {
                interval.tick().await;
                let mut map = windows.lock().await;
                let now = Instant::now();
                map.retain(|_, (_, start)| now.duration_since(*start) <= window_duration);
                let remaining = map.len();
                if remaining > 0 {
                    tracing::debug!("Rate limiter cleanup: {} entries remaining", remaining);
                }
            }
        });
    }

    async fn check_memory(&self, key: &str) -> bool {
        let mut windows = self.windows.lock().await;
        let now = Instant::now();

        let entry = windows.entry(key.to_string()).or_insert((0, now));

        // Reset window if expired
        if now.duration_since(entry.1) > self.window_duration {
            entry.0 = 0;
            entry.1 = now;
        }

        entry.0 += 1;
        entry.0 <= self.max_requests
    }
}

/// Rate limit middleware: 100 requests per 60 seconds per IP.
pub async fn rate_limit(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Extract client IP from headers or connection
    let ip = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string())
        .or_else(|| {
            req.extensions()
                .get::<ConnectInfo<SocketAddr>>()
                .map(|ci| ci.0.ip().to_string())
        })
        .unwrap_or_else(|| "unknown".to_string());

    if !state.rate_limiter.check(&ip).await {
        return Err(AppError::RateLimited);
    }

    Ok(next.run(req).await)
}
