use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, TokenData, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,       // user_id
    pub tid: Uuid,       // tenant_id
    pub role: String,    // user role
    pub exp: i64,        // expiry
    pub iat: i64,        // issued at
    #[serde(default)]
    pub jti: Option<Uuid>, // unique token ID for refresh token rotation
}

/// Claims for a short-lived MFA verification token.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MfaClaims {
    pub sub: Uuid,       // user_id
    pub tid: Uuid,       // tenant_id
    pub role: String,    // user role
    pub exp: i64,        // expiry (5 minutes)
    pub iat: i64,        // issued at
    pub purpose: String, // "mfa_verification"
}

/// Create an access token (15 minute expiry).
pub fn create_access_token(
    user_id: Uuid,
    tenant_id: Uuid,
    role: &str,
    secret: &str,
) -> AppResult<String> {
    let now = Utc::now();
    let claims = Claims {
        sub: user_id,
        tid: tenant_id,
        role: role.to_string(),
        exp: (now + Duration::minutes(15)).timestamp(),
        iat: now.timestamp(),
        jti: None,
    };

    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("JWT encoding failed: {}", e)))
}

/// Create a refresh token (7 day expiry) with a unique token ID for rotation.
/// Returns (token_string, jti) so the caller can store the jti for revocation.
pub fn create_refresh_token(
    user_id: Uuid,
    tenant_id: Uuid,
    role: &str,
    secret: &str,
) -> AppResult<(String, Uuid)> {
    let now = Utc::now();
    let jti = Uuid::new_v4();
    let claims = Claims {
        sub: user_id,
        tid: tenant_id,
        role: role.to_string(),
        exp: (now + Duration::days(7)).timestamp(),
        iat: now.timestamp(),
        jti: Some(jti),
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("JWT encoding failed: {}", e)))?;

    Ok((token, jti))
}

/// Create a short-lived MFA verification token (5 minute expiry).
pub fn create_mfa_token(
    user_id: Uuid,
    tenant_id: Uuid,
    role: &str,
    secret: &str,
) -> AppResult<String> {
    let now = Utc::now();
    let claims = MfaClaims {
        sub: user_id,
        tid: tenant_id,
        role: role.to_string(),
        exp: (now + Duration::minutes(5)).timestamp(),
        iat: now.timestamp(),
        purpose: "mfa_verification".to_string(),
    };

    encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| AppError::Internal(format!("JWT encoding failed: {}", e)))
}

/// Validate and decode a JWT token. Pinned to HS256 algorithm only.
pub fn validate_token(token: &str, secret: &str) -> AppResult<TokenData<Claims>> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.algorithms = vec![Algorithm::HS256];
    validation.set_required_spec_claims(&["sub", "tid", "role", "exp", "iat"]);

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
            AppError::Unauthorized("Token expired".to_string())
        }
        jsonwebtoken::errors::ErrorKind::InvalidAlgorithm => {
            AppError::Unauthorized("Invalid token algorithm".to_string())
        }
        _ => AppError::Unauthorized(format!("Invalid token: {}", e)),
    })
}

/// Validate and decode an MFA verification token. Pinned to HS256 algorithm only.
pub fn validate_mfa_token(token: &str, secret: &str) -> AppResult<TokenData<MfaClaims>> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.algorithms = vec![Algorithm::HS256];
    validation.set_required_spec_claims(&["sub", "tid", "role", "exp", "iat", "purpose"]);

    let token_data = decode::<MfaClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map_err(|e| match e.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
            AppError::Unauthorized("MFA token expired".to_string())
        }
        _ => AppError::Unauthorized(format!("Invalid MFA token: {}", e)),
    })?;

    // Verify the token purpose
    if token_data.claims.purpose != "mfa_verification" {
        return Err(AppError::Unauthorized("Invalid token purpose".to_string()));
    }

    Ok(token_data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_validate_token() {
        let user_id = Uuid::new_v4();
        let tenant_id = Uuid::new_v4();
        let secret = "test_secret_that_is_long_enough_for_hmac";

        let token = create_access_token(user_id, tenant_id, "admin", secret).unwrap();
        let decoded = validate_token(&token, secret).unwrap();

        assert_eq!(decoded.claims.sub, user_id);
        assert_eq!(decoded.claims.tid, tenant_id);
        assert_eq!(decoded.claims.role, "admin");
    }

    #[test]
    fn test_invalid_secret_fails() {
        let user_id = Uuid::new_v4();
        let tenant_id = Uuid::new_v4();

        let token =
            create_access_token(user_id, tenant_id, "admin", "secret_one_long_enough").unwrap();
        let result = validate_token(&token, "secret_two_long_enough");

        assert!(result.is_err());
    }

    #[test]
    fn test_refresh_token_has_jti() {
        let user_id = Uuid::new_v4();
        let tenant_id = Uuid::new_v4();
        let secret = "test_secret_that_is_long_enough_for_hmac";

        let (token, jti) = create_refresh_token(user_id, tenant_id, "admin", secret).unwrap();
        let decoded = validate_token(&token, secret).unwrap();

        assert_eq!(decoded.claims.sub, user_id);
        assert_eq!(decoded.claims.jti, Some(jti));
    }

    #[test]
    fn test_mfa_token_validate() {
        let user_id = Uuid::new_v4();
        let tenant_id = Uuid::new_v4();
        let secret = "test_secret_that_is_long_enough_for_hmac";

        let token = create_mfa_token(user_id, tenant_id, "admin", secret).unwrap();
        let decoded = validate_mfa_token(&token, secret).unwrap();

        assert_eq!(decoded.claims.sub, user_id);
        assert_eq!(decoded.claims.purpose, "mfa_verification");
    }

    #[test]
    fn test_algorithm_pinning() {
        let user_id = Uuid::new_v4();
        let tenant_id = Uuid::new_v4();
        let secret = "test_secret_that_is_long_enough_for_hmac";

        // Create token with HS256 (default)
        let token = create_access_token(user_id, tenant_id, "admin", secret).unwrap();

        // Validation should succeed with HS256
        assert!(validate_token(&token, secret).is_ok());

        // Verify the header uses HS256
        let header = jsonwebtoken::decode_header(&token).unwrap();
        assert_eq!(header.alg, Algorithm::HS256);
    }
}
