use axum::{
    body::Body,
    extract::Request,
    http::{HeaderMap, Method, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use sqlx::PgPool;
use uuid::Uuid;

use crate::AppState;

const IDEMPOTENCY_HEADER: &str = "idempotency-key";

pub async fn idempotency_check(
    axum::extract::State(state): axum::extract::State<AppState>,
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Response {
    // Only apply to mutating methods
    let method = request.method().clone();
    if !matches!(method, Method::POST | Method::PUT | Method::PATCH) {
        return next.run(request).await;
    }

    // Check for idempotency key header
    let key = match headers
        .get(IDEMPOTENCY_HEADER)
        .and_then(|v| v.to_str().ok())
    {
        Some(k) => k.to_string(),
        None => return next.run(request).await, // No key, proceed normally
    };

    let fingerprint = format!("{}:{}", method.as_str(), request.uri().path());

    // Check if key already exists
    let existing: Option<(String, Option<i32>, Option<String>)> = sqlx::query_as(
        "SELECT fingerprint, response_status, response_body \
         FROM idempotency_keys \
         WHERE key = $1 AND expires_at > NOW()",
    )
    .bind(&key)
    .fetch_optional(&state.db)
    .await
    .unwrap_or(None);

    if let Some((stored_fingerprint, status, body)) = existing {
        // Key exists - check fingerprint match
        if stored_fingerprint != fingerprint {
            return (
                StatusCode::CONFLICT,
                "Idempotency key already used with a different request",
            )
                .into_response();
        }

        // Return cached response if available
        if let (Some(status_code), Some(response_body)) = (status, body) {
            let status = StatusCode::from_u16(status_code as u16).unwrap_or(StatusCode::OK);
            return (status, response_body).into_response();
        }

        // Key exists but no response yet (concurrent request) - proceed
        return next.run(request).await;
    }

    // Insert new idempotency key
    let _ = sqlx::query(
        "INSERT INTO idempotency_keys (key, fingerprint, expires_at) \
         VALUES ($1, $2, NOW() + INTERVAL '24 hours') \
         ON CONFLICT (key) DO NOTHING",
    )
    .bind(&key)
    .bind(&fingerprint)
    .execute(&state.db)
    .await;

    // Proceed with request
    let response = next.run(request).await;

    // Cache response status (we can't easily cache the body without consuming it)
    let status_code = response.status().as_u16() as i32;
    let _ = sqlx::query(
        "UPDATE idempotency_keys SET response_status = $2, locked_at = NOW() \
         WHERE key = $1",
    )
    .bind(&key)
    .bind(status_code)
    .execute(&state.db)
    .await;

    response
}
