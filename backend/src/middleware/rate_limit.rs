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

/// Differentiated rate limit tiers for different endpoint categories.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum RateLimitTier {
    /// Login endpoint: 5 requests per minute per IP
    Login,
    /// Token refresh: 10 requests per minute per IP
    TokenRefresh,
    /// MFA verification: 5 requests per minute per IP
    MfaVerification,
    /// General API: 100 requests per minute per IP
    General,
}

impl RateLimitTier {
    /// Returns (max_requests, window_seconds) for each tier.
    pub fn limits(&self) -> (u32, u64) {
        match self {
            RateLimitTier::Login => (5, 60),
            RateLimitTier::TokenRefresh => (10, 60),
            RateLimitTier::MfaVerification => (5, 60),
            RateLimitTier::General => (100, 60),
        }
    }

    /// Returns a prefix for rate limit keys to separate tiers in storage.
    pub fn key_prefix(&self) -> &'static str {
        match self {
            RateLimitTier::Login => "login",
            RateLimitTier::TokenRefresh => "refresh",
            RateLimitTier::MfaVerification => "mfa",
            RateLimitTier::General => "general",
        }
    }
}

/// Determine the rate limit tier based on request path and method.
fn classify_request(path: &str) -> RateLimitTier {
    if path.ends_with("/auth/login") {
        RateLimitTier::Login
    } else if path.ends_with("/auth/refresh") {
        RateLimitTier::TokenRefresh
    } else if path.contains("/auth/mfa/verify-login") || path.contains("/auth/mfa/verify") {
        RateLimitTier::MfaVerification
    } else {
        RateLimitTier::General
    }
}

/// Hybrid rate limiter: tries Redis first, falls back to in-memory.
/// In production with multiple instances, Redis ensures distributed limiting.
/// Supports per-tier rate limits for different endpoint categories.
#[derive(Clone)]
pub struct RateLimiter {
    /// In-memory fallback: Map of (tier_prefix:IP) -> (request_count, window_start)
    windows: Arc<Mutex<HashMap<String, (u32, Instant)>>>,
    redis: Option<Arc<fred::clients::RedisClient>>,
}

impl RateLimiter {
    pub fn new(_max_requests: u32, _window_secs: u64) -> Self {
        Self {
            windows: Arc::new(Mutex::new(HashMap::new())),
            redis: None,
        }
    }

    pub fn with_redis(mut self, client: Arc<fred::clients::RedisClient>) -> Self {
        self.redis = Some(client);
        self
    }

    /// Check rate limit for a given key and tier.
    pub async fn check_with_tier(&self, ip: &str, tier: RateLimitTier) -> bool {
        let (max_requests, window_secs) = tier.limits();
        let key = format!("{}:{}", tier.key_prefix(), ip);

        // Try Redis first
        if let Some(ref redis) = self.redis {
            if let Ok(allowed) = self.check_redis(redis, &key, max_requests, window_secs).await {
                return allowed;
            }
            // Redis failed -- fall through to in-memory
        }

        // In-memory fallback
        self.check_memory(&key, max_requests, window_secs).await
    }

    /// Legacy check method for backward compatibility (uses General tier).
    pub async fn check(&self, key: &str) -> bool {
        self.check_with_tier(key, RateLimitTier::General).await
    }

    async fn check_redis(
        &self,
        redis: &fred::clients::RedisClient,
        key: &str,
        max_requests: u32,
        window_secs: u64,
    ) -> Result<bool, fred::error::RedisError> {
        use fred::interfaces::KeysInterface;

        let redis_key = format!("rate_limit:{}", key);
        let count: i64 = redis.incr(&redis_key).await?;

        if count == 1 {
            // First request in window -- set expiry
            let _: () = redis.expire(&redis_key, window_secs as i64).await?;
        }

        Ok(count <= max_requests as i64)
    }

    async fn check_memory(&self, key: &str, max_requests: u32, window_secs: u64) -> bool {
        let mut windows = self.windows.lock().await;
        let now = Instant::now();
        let window_duration = Duration::from_secs(window_secs);

        let entry = windows.entry(key.to_string()).or_insert((0, now));

        // Reset window if expired
        if now.duration_since(entry.1) > window_duration {
            entry.0 = 0;
            entry.1 = now;
        }

        entry.0 += 1;
        entry.0 <= max_requests
    }
}

/// Rate limit middleware with per-endpoint tier classification.
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

    // Classify the request to determine its rate limit tier
    let tier = classify_request(req.uri().path());

    if !state.rate_limiter.check_with_tier(&ip, tier).await {
        tracing::warn!(
            ip = %ip,
            tier = ?tier,
            "Rate limit exceeded for tier {:?}", tier
        );
        return Err(AppError::RateLimited);
    }

    Ok(next.run(req).await)
}
