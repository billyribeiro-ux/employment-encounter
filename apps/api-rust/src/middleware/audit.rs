use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use serde_json::json;

use crate::auth::jwt::Claims;
use crate::AppState;

/// Audit log middleware that records mutating API calls (POST, PUT, PATCH, DELETE).
pub async fn audit_log(State(state): State<AppState>, req: Request, next: Next) -> Response {
    let method = req.method().clone();
    let uri = req.uri().path().to_string();

    // Only log mutating operations
    let should_log = matches!(method.as_str(), "POST" | "PUT" | "PATCH" | "DELETE");

    // Extract claims if present (injected by require_auth)
    let claims = req.extensions().get::<Claims>().cloned();

    // Extract IP address from headers
    let ip_address = req
        .headers()
        .get("x-forwarded-for")
        .or_else(|| req.headers().get("x-real-ip"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string());

    let user_agent = req
        .headers()
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let response = next.run(req).await;

    // Log after the response to capture the status code
    if should_log {
        let status = response.status().as_u16();

        if let Some(ref claims) = claims {
            // Determine resource type and action from the URI
            let parts: Vec<&str> = uri.trim_start_matches("/api/v1/").split('/').collect();
            let resource_type = parts.first().unwrap_or(&"unknown").to_string();
            let action = format!("{}:{}", method.as_str(), uri);

            // Fire and forget — don't block the response on audit logging
            let db = state.db.clone();
            let tenant_id = claims.tid;
            let user_id = claims.sub;
            let ip = ip_address.clone();
            let ua = user_agent.clone();

            tokio::spawn(async move {
                let details = json!({
                    "status": status,
                    "method": method.as_str(),
                    "path": uri,
                });

                let result = sqlx::query(
                    "INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, details, ip_address, user_agent) \
                     VALUES ($1, $2, $3, $4, $5, $6::INET, $7)"
                )
                .bind(tenant_id)
                .bind(user_id)
                .bind(&action)
                .bind(&resource_type)
                .bind(&details)
                .bind(ip.as_deref())
                .bind(ua.as_deref())
                .execute(&db)
                .await;

                if let Err(e) = result {
                    tracing::warn!("Failed to write audit log: {}", e);
                }
            });
        }
    }

    response
}
