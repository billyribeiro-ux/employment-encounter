use axum::{
    extract::Request,
    http::{header, Method},
    middleware::Next,
    response::Response,
};
use rand::Rng;

use crate::error::AppError;

const CSRF_COOKIE_NAME: &str = "csrf_token";
const CSRF_HEADER_NAME: &str = "x-csrf-token";
const CSRF_TOKEN_LENGTH: usize = 32;

/// Generate a cryptographically random CSRF token.
fn generate_csrf_token() -> String {
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..CSRF_TOKEN_LENGTH).map(|_| rng.gen()).collect();
    hex::encode(bytes)
}

/// Check if the request path should skip CSRF validation.
/// - Webhook endpoints (verified by their own signature)
/// - Paths that use Bearer token auth (API routes with Authorization header)
fn should_skip_csrf(req: &Request) -> bool {
    let path = req.uri().path();

    // Skip CSRF for webhook endpoints (they use signature-based verification)
    if path.contains("/webhooks/") {
        return true;
    }

    // Skip CSRF for requests with Bearer token auth (not vulnerable to CSRF
    // because the browser doesn't auto-attach Authorization headers)
    if let Some(auth_header) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(value) = auth_header.to_str() {
            if value.starts_with("Bearer ") {
                return true;
            }
        }
    }

    false
}

/// Double-submit cookie CSRF protection middleware.
///
/// On GET/HEAD/OPTIONS requests: sets a CSRF token cookie if not already present.
/// On state-changing requests (POST, PUT, PATCH, DELETE): validates that the
/// `X-CSRF-Token` header matches the `csrf_token` cookie value.
///
/// Requests using Bearer token authentication are exempt (browser-based CSRF
/// attacks cannot set custom Authorization headers).
pub async fn csrf_protection(req: Request, next: Next) -> Result<Response, AppError> {
    let method = req.method().clone();

    // Skip CSRF for exempt routes
    if should_skip_csrf(&req) {
        return Ok(next.run(req).await);
    }

    let is_state_changing = matches!(
        method,
        Method::POST | Method::PUT | Method::PATCH | Method::DELETE
    );

    if is_state_changing {
        // Validate CSRF: X-CSRF-Token header must match csrf_token cookie
        let cookie_token = extract_cookie_token(&req);
        let header_token = req
            .headers()
            .get(CSRF_HEADER_NAME)
            .and_then(|v| v.to_str().ok())
            .map(|s| s.to_string());

        match (cookie_token, header_token) {
            (Some(cookie_val), Some(header_val)) if !cookie_val.is_empty() => {
                // Constant-time comparison to prevent timing attacks
                if !constant_time_eq(cookie_val.as_bytes(), header_val.as_bytes()) {
                    tracing::warn!("CSRF token mismatch");
                    return Err(AppError::Forbidden("CSRF token mismatch".to_string()));
                }
            }
            _ => {
                tracing::warn!("Missing CSRF token");
                return Err(AppError::Forbidden("Missing CSRF token".to_string()));
            }
        }

        Ok(next.run(req).await)
    } else {
        // For GET/HEAD/OPTIONS: set CSRF cookie if not present
        let existing_token = extract_cookie_token(&req);
        let mut response = next.run(req).await;

        if existing_token.is_none() {
            let token = generate_csrf_token();
            let cookie_value = format!(
                "{}={}; Path=/; HttpOnly=false; SameSite=Strict; Secure",
                CSRF_COOKIE_NAME, token
            );
            if let Ok(header_value) = cookie_value.parse() {
                response
                    .headers_mut()
                    .insert(header::SET_COOKIE, header_value);
            }
        }

        Ok(response)
    }
}

/// Extract the csrf_token value from the Cookie header.
fn extract_cookie_token(req: &Request) -> Option<String> {
    req.headers()
        .get(header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|cookies| {
            cookies.split(';').find_map(|cookie| {
                let cookie = cookie.trim();
                if let Some(value) = cookie.strip_prefix(&format!("{}=", CSRF_COOKIE_NAME)) {
                    Some(value.to_string())
                } else {
                    None
                }
            })
        })
}

/// Constant-time byte comparison to mitigate timing side-channel attacks.
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut result: u8 = 0;
    for (x, y) in a.iter().zip(b.iter()) {
        result |= x ^ y;
    }
    result == 0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constant_time_eq() {
        assert!(constant_time_eq(b"hello", b"hello"));
        assert!(!constant_time_eq(b"hello", b"world"));
        assert!(!constant_time_eq(b"hello", b"hell"));
        assert!(!constant_time_eq(b"", b"a"));
        assert!(constant_time_eq(b"", b""));
    }

    #[test]
    fn test_generate_csrf_token() {
        let token1 = generate_csrf_token();
        let token2 = generate_csrf_token();
        assert_eq!(token1.len(), CSRF_TOKEN_LENGTH * 2); // hex encoding doubles length
        assert_ne!(token1, token2); // should be random
    }
}
