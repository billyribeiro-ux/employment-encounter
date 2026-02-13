use axum::{
    extract::{Extension, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use totp_rs::{Algorithm, Secret, TOTP};

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct MfaSetupResponse {
    pub secret: String,
    pub otpauth_url: String,
    pub qr_code_base64: String,
}

#[derive(Debug, Deserialize)]
pub struct MfaVerifyRequest {
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct MfaEnableRequest {
    pub code: String,
    pub secret: String,
}

fn build_totp(secret_bytes: Vec<u8>, account: &str) -> Result<TOTP, AppError> {
    TOTP::new(
        Algorithm::SHA1,
        6,
        1,
        30,
        secret_bytes,
        Some("CPA Platform".to_string()),
        account.to_string(),
    )
    .map_err(|e| AppError::Internal(format!("TOTP creation failed: {}", e)))
}

pub async fn setup_mfa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<MfaSetupResponse>> {
    let (mfa_enabled,): (bool,) =
        sqlx::query_as("SELECT mfa_enabled FROM users WHERE id = $1 AND tenant_id = $2")
            .bind(claims.sub)
            .bind(claims.tid)
            .fetch_one(&state.db)
            .await?;

    if mfa_enabled {
        return Err(AppError::Conflict("MFA is already enabled".to_string()));
    }

    let (email,): (String,) =
        sqlx::query_as("SELECT email FROM users WHERE id = $1 AND tenant_id = $2")
            .bind(claims.sub)
            .bind(claims.tid)
            .fetch_one(&state.db)
            .await?;

    let secret = Secret::generate_secret();
    let totp = build_totp(secret.to_bytes().unwrap(), &email)?;

    let otpauth_url = totp.get_url();
    let qr_code = totp
        .get_qr_base64()
        .map_err(|e| AppError::Internal(format!("QR code generation failed: {}", e)))?;

    Ok(Json(MfaSetupResponse {
        secret: secret.to_encoded().to_string(),
        otpauth_url,
        qr_code_base64: qr_code,
    }))
}

pub async fn enable_mfa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<MfaEnableRequest>,
) -> AppResult<StatusCode> {
    let secret = Secret::Encoded(payload.secret.clone())
        .to_bytes()
        .map_err(|_| AppError::Validation("Invalid TOTP secret".to_string()))?;

    let totp = build_totp(secret.clone(), "user")?;

    let valid = totp
        .check_current(&payload.code)
        .map_err(|e| AppError::Internal(format!("TOTP check failed: {}", e)))?;

    if !valid {
        return Err(AppError::Validation("Invalid MFA code".to_string()));
    }

    sqlx::query(
        "UPDATE users SET mfa_enabled = TRUE, mfa_secret_encrypted = $3, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .bind(secret.as_slice())
    .execute(&state.db)
    .await?;

    Ok(StatusCode::OK)
}

pub async fn verify_mfa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<MfaVerifyRequest>,
) -> AppResult<StatusCode> {
    let (mfa_secret,): (Option<Vec<u8>>,) = sqlx::query_as(
        "SELECT mfa_secret_encrypted FROM users WHERE id = $1 AND tenant_id = $2 AND mfa_enabled = TRUE"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("MFA not enabled".to_string()))?;

    let secret =
        mfa_secret.ok_or_else(|| AppError::Internal("MFA secret not found".to_string()))?;
    let totp = build_totp(secret, "user")?;

    let valid = totp
        .check_current(&payload.code)
        .map_err(|e| AppError::Internal(format!("TOTP check failed: {}", e)))?;

    if !valid {
        return Err(AppError::Unauthorized("Invalid MFA code".to_string()));
    }

    Ok(StatusCode::OK)
}

pub async fn disable_mfa(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<MfaVerifyRequest>,
) -> AppResult<StatusCode> {
    let (mfa_secret,): (Option<Vec<u8>>,) = sqlx::query_as(
        "SELECT mfa_secret_encrypted FROM users WHERE id = $1 AND tenant_id = $2 AND mfa_enabled = TRUE"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("MFA not enabled".to_string()))?;

    let secret =
        mfa_secret.ok_or_else(|| AppError::Internal("MFA secret not found".to_string()))?;
    let totp = build_totp(secret, "user")?;

    let valid = totp
        .check_current(&payload.code)
        .map_err(|e| AppError::Internal(format!("TOTP check failed: {}", e)))?;

    if !valid {
        return Err(AppError::Unauthorized(
            "Invalid MFA code — cannot disable".to_string(),
        ));
    }

    sqlx::query(
        "UPDATE users SET mfa_enabled = FALSE, mfa_secret_encrypted = NULL, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::OK)
}
