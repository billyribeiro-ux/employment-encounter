use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

use crate::auth::jwt::{validate_token, Claims};
use crate::error::AppError;
use crate::AppState;

/// Extract JWT claims from either the `Authorization: Bearer <token>` header
/// (used by mobile/SDK clients) or the `access_token` HttpOnly cookie
/// (used by the browser). Bearer wins if both are present — that lets a
/// browser-based test/admin tool override the cookie without logging out.
pub async fn require_auth(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let bearer_token = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(|s| s.to_string());

    let token = bearer_token
        .or_else(|| crate::auth::cookies::extract_access_cookie(req.headers()))
        .ok_or_else(|| AppError::Unauthorized("Missing authentication".to_string()))?;

    let token_data = validate_token(&token, &state.config.jwt_secret)?;

    // Set tenant context for RLS — parameterized to prevent SQL injection
    sqlx::query("SELECT set_config('app.current_tenant', $1, true)")
        .bind(token_data.claims.tid.to_string())
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
        return Err(AppError::Forbidden("Insufficient permissions".to_string()));
    }

    Ok(())
}

/// Hiring-domain role hierarchy. `candidate` is intentionally outside
/// the hierarchy (it falls through to 0) — candidate access is gated by
/// explicit `claims.role == "candidate"` checks at the route boundary,
/// not by `require_role`.
fn role_to_level(role: &str) -> u8 {
    match role {
        "viewer" => 1,
        "recruiter" => 2,
        "hiring_manager" => 3,
        "admin" => 4,
        _ => 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn make_claims(role: &str) -> Claims {
        Claims {
            sub: Uuid::new_v4(),
            tid: Uuid::new_v4(),
            role: role.to_string(),
            exp: 0,
            iat: 0,
            jti: None,
        }
    }

    #[test]
    fn test_role_hierarchy() {
        assert!(role_to_level("admin") > role_to_level("hiring_manager"));
        assert!(role_to_level("hiring_manager") > role_to_level("recruiter"));
        assert!(role_to_level("recruiter") > role_to_level("viewer"));
    }

    #[test]
    fn test_unknown_role_defaults_to_zero() {
        assert_eq!(role_to_level("unknown"), 0);
        assert_eq!(role_to_level(""), 0);
        assert_eq!(role_to_level("candidate"), 0);
    }

    #[test]
    fn test_admin_can_do_anything() {
        let claims = make_claims("admin");
        assert!(require_role(&claims, "viewer").is_ok());
        assert!(require_role(&claims, "recruiter").is_ok());
        assert!(require_role(&claims, "hiring_manager").is_ok());
        assert!(require_role(&claims, "admin").is_ok());
    }

    #[test]
    fn test_hiring_manager_cannot_admin() {
        let claims = make_claims("hiring_manager");
        assert!(require_role(&claims, "recruiter").is_ok());
        assert!(require_role(&claims, "hiring_manager").is_ok());
        assert!(require_role(&claims, "admin").is_err());
    }

    #[test]
    fn test_viewer_most_restricted() {
        let claims = make_claims("viewer");
        assert!(require_role(&claims, "viewer").is_ok());
        assert!(require_role(&claims, "recruiter").is_err());
    }

    #[test]
    fn test_candidate_outside_hierarchy() {
        let claims = make_claims("candidate");
        // candidate has no level in the staff hierarchy
        assert!(require_role(&claims, "viewer").is_err());
    }
}
