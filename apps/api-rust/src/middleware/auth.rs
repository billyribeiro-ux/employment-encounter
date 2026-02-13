use axum::{
    extract::{Request, State},
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
        }
    }

    #[test]
    fn test_role_hierarchy() {
        assert!(role_to_level("partner") > role_to_level("admin"));
        assert!(role_to_level("admin") > role_to_level("manager"));
        assert!(role_to_level("manager") > role_to_level("senior_accountant"));
        assert!(role_to_level("senior_accountant") > role_to_level("staff_accountant"));
        assert!(role_to_level("staff_accountant") > role_to_level("client"));
    }

    #[test]
    fn test_unknown_role_defaults_to_zero() {
        assert_eq!(role_to_level("unknown"), 0);
        assert_eq!(role_to_level(""), 0);
    }

    #[test]
    fn test_require_role_partner_can_do_anything() {
        let claims = make_claims("partner");
        assert!(require_role(&claims, "client").is_ok());
        assert!(require_role(&claims, "staff_accountant").is_ok());
        assert!(require_role(&claims, "admin").is_ok());
        assert!(require_role(&claims, "partner").is_ok());
    }

    #[test]
    fn test_require_role_admin_cannot_access_partner() {
        let claims = make_claims("admin");
        assert!(require_role(&claims, "admin").is_ok());
        assert!(require_role(&claims, "manager").is_ok());
        assert!(require_role(&claims, "partner").is_err());
    }

    #[test]
    fn test_require_role_staff_accountant_limited() {
        let claims = make_claims("staff_accountant");
        assert!(require_role(&claims, "staff_accountant").is_ok());
        assert!(require_role(&claims, "client").is_ok());
        assert!(require_role(&claims, "senior_accountant").is_err());
        assert!(require_role(&claims, "manager").is_err());
        assert!(require_role(&claims, "admin").is_err());
    }

    #[test]
    fn test_require_role_client_most_restricted() {
        let claims = make_claims("client");
        assert!(require_role(&claims, "client").is_ok());
        assert!(require_role(&claims, "staff_accountant").is_err());
    }
}
