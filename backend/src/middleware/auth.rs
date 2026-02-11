use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use crate::auth::jwt::{validate_token, Claims};
use crate::error::AppError;
use crate::AppState;

/// Extract JWT claims from the Authorization header and inject into request extensions.
pub async fn require_auth(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".to_string()))?;

    let token_data = validate_token(token, &state.config.jwt_secret)?;

    // Set tenant context for RLS
    let tenant_id = token_data.claims.tid.to_string();
    sqlx::query(&format!(
        "SET LOCAL app.current_tenant = '{}'",
        tenant_id
    ))
    .execute(&state.db)
    .await
    .map_err(|e| AppError::Internal(format!("Failed to set tenant context: {}", e)))?;

    // Inject claims into request extensions
    req.extensions_mut().insert(token_data.claims);

    Ok(next.run(req).await)
}

/// Require a minimum role level.
pub fn require_role(claims: &Claims, min_role: &str) -> Result<(), AppError> {
    let role_level = role_to_level(&claims.role);
    let min_level = role_to_level(min_role);

    if role_level < min_level {
        return Err(AppError::Forbidden(
            "Insufficient permissions".to_string(),
        ));
    }

    Ok(())
}

fn role_to_level(role: &str) -> u8 {
    match role {
        "client" => 0,
        "staff_accountant" => 1,
        "senior_accountant" => 2,
        "manager" => 3,
        "admin" => 4,
        "partner" => 5,
        _ => 0,
    }
}
