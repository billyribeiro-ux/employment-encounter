use axum::{
    extract::{Extension, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

use crate::auth::{jwt, password};
use crate::error::{AppError, AppResult};
use crate::middleware::security::{self, SecurityEventType};
use crate::AppState;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 12, max = 128))]
    pub password: String,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    #[validate(length(min = 1, max = 255))]
    pub firm_name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub user: UserResponse,
}

/// Response returned when MFA verification is required before full login.
#[derive(Debug, Serialize)]
pub struct MfaRequiredResponse {
    pub mfa_required: bool,
    pub mfa_token: String,
    pub message: String,
}

/// Unified login response that can be either full auth or MFA challenge.
#[derive(Debug, Serialize)]
#[serde(untagged)]
pub enum LoginResponse {
    Full(AuthResponse),
    MfaChallenge(MfaRequiredResponse),
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: String,
    pub tenant_id: Uuid,
}

#[derive(Debug, FromRow)]
struct UserRow {
    id: Uuid,
    tenant_id: Uuid,
    email: String,
    password_hash: String,
    first_name: String,
    last_name: String,
    role: String,
    status: String,
    failed_login_count: i32,
    locked_until: Option<DateTime<Utc>>,
    mfa_enabled: bool,
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<AuthResponse>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Normalize email to prevent case-sensitivity bypass
    let normalized_email = payload.email.trim().to_lowercase();

    // Check if email already exists (case-insensitive)
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE LOWER(email) = $1")
        .bind(&normalized_email)
        .fetch_one(&state.db)
        .await?;

    if row.0 > 0 {
        return Err(AppError::Conflict("Email already registered".to_string()));
    }

    let password_hash = password::hash_password(&payload.password)?;

    // Create tenant
    let tenant_id = Uuid::new_v4();
    let tenant_slug = slug::slugify(&payload.firm_name);

    sqlx::query(
        "INSERT INTO tenants (id, name, slug, tier, status, kms_key_id) VALUES ($1, $2, $3, 'solo', 'active', 'dev-key')",
    )
    .bind(tenant_id)
    .bind(&payload.firm_name)
    .bind(&tenant_slug)
    .execute(&state.db)
    .await?;

    // Create user as admin of the new tenant
    let user_id = Uuid::new_v4();

    sqlx::query(
        "INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'active')",
    )
    .bind(user_id)
    .bind(tenant_id)
    .bind(&normalized_email)
    .bind(&password_hash)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .execute(&state.db)
    .await?;

    let access_token =
        jwt::create_access_token(user_id, tenant_id, "admin", &state.config.jwt_secret)?;
    let (refresh_token, refresh_jti) =
        jwt::create_refresh_token(user_id, tenant_id, "admin", &state.config.jwt_secret)?;

    // Store refresh token jti for rotation tracking
    store_refresh_token_jti(&state, user_id, refresh_jti).await;

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            access_token,
            refresh_token,
            user: UserResponse {
                id: user_id,
                email: normalized_email,
                first_name: payload.first_name,
                last_name: payload.last_name,
                role: "admin".to_string(),
                tenant_id,
            },
        }),
    ))
}

pub async fn login(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<LoginRequest>,
) -> AppResult<Json<LoginResponse>> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let normalized_email = payload.email.trim().to_lowercase();
    let ip = security::extract_ip(&headers);
    let ua = security::extract_user_agent(&headers);

    // Find user by email (case-insensitive, also fetching mfa_enabled)
    let user: UserRow = sqlx::query_as(
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until, mfa_enabled FROM users WHERE LOWER(email) = $1",
    )
    .bind(&normalized_email)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    // Check if account is locked
    if let Some(locked_until) = user.locked_until {
        if locked_until > chrono::Utc::now() {
            security::log_security_event(
                state.db.clone(),
                Some(user.tenant_id),
                Some(user.id),
                SecurityEventType::LoginLocked,
                format!("Login attempt on locked account: {}", payload.email),
                ip.clone(),
                ua.clone(),
                None,
            );
            return Err(AppError::Unauthorized(
                "Account is temporarily locked. Try again later.".to_string(),
            ));
        }
    }

    // Check if account is active
    if user.status != "active" {
        return Err(AppError::Unauthorized("Account is not active".to_string()));
    }

    // Verify password
    let valid = password::verify_password(&payload.password, &user.password_hash)?;
    if !valid {
        // Increment failed login count
        let new_count = user.failed_login_count + 1;
        let locked_until = if new_count >= 5 {
            Some(chrono::Utc::now() + chrono::Duration::minutes(15))
        } else {
            None
        };

        sqlx::query("UPDATE users SET failed_login_count = $1, locked_until = $2 WHERE id = $3")
            .bind(new_count)
            .bind(locked_until)
            .bind(user.id)
            .execute(&state.db)
            .await?;

        security::log_security_event(
            state.db.clone(),
            Some(user.tenant_id),
            Some(user.id),
            SecurityEventType::LoginFailed,
            format!("Failed login attempt #{} for: {}", new_count, payload.email),
            ip.clone(),
            ua.clone(),
            None,
        );
        return Err(AppError::Unauthorized(
            "Invalid email or password".to_string(),
        ));
    }

    // Reset failed login count on successful password verification
    sqlx::query("UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await?;

    // If MFA is enabled, return a partial auth response requiring MFA verification
    if user.mfa_enabled {
        let mfa_token = jwt::create_mfa_token(
            user.id,
            user.tenant_id,
            &user.role,
            &state.config.jwt_secret,
        )?;

        // Store MFA attempt counter (limit to 5 attempts per token)
        if let Some(ref redis) = state.redis {
            use fred::interfaces::KeysInterface;
            let mfa_attempts_key = format!("mfa_attempts:{}", user.id);
            let _: () = redis
                .set(
                    &mfa_attempts_key,
                    "0",
                    Some(fred::types::Expiration::EX(300)), // 5 minute TTL matching token
                    None,
                    false,
                )
                .await
                .unwrap_or(());
        }

        security::log_security_event(
            state.db.clone(),
            Some(user.tenant_id),
            Some(user.id),
            SecurityEventType::LoginSuccess,
            format!("Password verified, MFA required: {}", user.email),
            ip,
            ua,
            None,
        );

        return Ok(Json(LoginResponse::MfaChallenge(MfaRequiredResponse {
            mfa_required: true,
            mfa_token,
            message: "MFA verification required. Submit TOTP code to /api/v1/auth/mfa/verify-login"
                .to_string(),
        })));
    }

    security::log_security_event(
        state.db.clone(),
        Some(user.tenant_id),
        Some(user.id),
        SecurityEventType::LoginSuccess,
        format!("Successful login: {}", user.email),
        ip,
        ua,
        None,
    );

    let access_token = jwt::create_access_token(
        user.id,
        user.tenant_id,
        &user.role,
        &state.config.jwt_secret,
    )?;
    let (refresh_token, refresh_jti) = jwt::create_refresh_token(
        user.id,
        user.tenant_id,
        &user.role,
        &state.config.jwt_secret,
    )?;

    // Store refresh token jti for rotation tracking
    store_refresh_token_jti(&state, user.id, refresh_jti).await;

    Ok(Json(LoginResponse::Full(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            tenant_id: user.tenant_id,
        },
    })))
}

// === MFA Login Verification ===

#[derive(Debug, Deserialize)]
pub struct MfaLoginVerifyRequest {
    pub mfa_token: String,
    pub code: String,
}

/// Verify MFA code during login flow.
/// Accepts the short-lived mfa_token from the login response plus the TOTP code.
/// Returns full auth tokens on success.
pub async fn verify_mfa_login(
    State(state): State<AppState>,
    headers: axum::http::HeaderMap,
    Json(payload): Json<MfaLoginVerifyRequest>,
) -> AppResult<Json<AuthResponse>> {
    let ip = security::extract_ip(&headers);
    let ua = security::extract_user_agent(&headers);

    // Validate the MFA token
    let mfa_claims = jwt::validate_mfa_token(&payload.mfa_token, &state.config.jwt_secret)
        .map_err(|_| AppError::Unauthorized("Invalid or expired MFA token".to_string()))?;

    let user_id = mfa_claims.claims.sub;
    let tenant_id = mfa_claims.claims.tid;
    let role = mfa_claims.claims.role.clone();

    // Rate limit MFA verification attempts (5 per token)
    if let Some(ref redis) = state.redis {
        use fred::interfaces::KeysInterface;
        let mfa_attempts_key = format!("mfa_attempts:{}", user_id);
        let attempts: i64 = redis.incr(&mfa_attempts_key).await.unwrap_or(1);
        if attempts > 5 {
            security::log_security_event(
                state.db.clone(),
                Some(tenant_id),
                Some(user_id),
                SecurityEventType::MfaFailed,
                "MFA verification rate limit exceeded".to_string(),
                ip.clone(),
                ua.clone(),
                None,
            );
            return Err(AppError::RateLimited);
        }
    }

    // Fetch MFA secret
    let (mfa_secret,): (Option<Vec<u8>>,) = sqlx::query_as(
        "SELECT mfa_secret_encrypted FROM users WHERE id = $1 AND tenant_id = $2 AND mfa_enabled = TRUE"
    )
    .bind(user_id)
    .bind(tenant_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("MFA not enabled".to_string()))?;

    let secret =
        mfa_secret.ok_or_else(|| AppError::Internal("MFA secret not found".to_string()))?;

    // Verify TOTP code
    let totp = totp_rs::TOTP::new(
        totp_rs::Algorithm::SHA1,
        6,
        1,
        30,
        secret,
        Some("CPA Platform".to_string()),
        "user".to_string(),
    )
    .map_err(|e| AppError::Internal(format!("TOTP creation failed: {}", e)))?;

    let valid = totp
        .check_current(&payload.code)
        .map_err(|e| AppError::Internal(format!("TOTP check failed: {}", e)))?;

    if !valid {
        security::log_security_event(
            state.db.clone(),
            Some(tenant_id),
            Some(user_id),
            SecurityEventType::MfaFailed,
            "Invalid MFA code during login".to_string(),
            ip,
            ua,
            None,
        );
        return Err(AppError::Unauthorized("Invalid MFA code".to_string()));
    }

    // MFA verified -- clear attempts counter
    if let Some(ref redis) = state.redis {
        use fred::interfaces::KeysInterface;
        let mfa_attempts_key = format!("mfa_attempts:{}", user_id);
        let _: () = redis.del(&mfa_attempts_key).await.unwrap_or(());
    }

    security::log_security_event(
        state.db.clone(),
        Some(tenant_id),
        Some(user_id),
        SecurityEventType::MfaVerified,
        "MFA verified during login".to_string(),
        ip,
        ua,
        None,
    );

    // Fetch full user data for response
    let user: UserRow = sqlx::query_as(
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until, mfa_enabled \
         FROM users WHERE id = $1 AND tenant_id = $2"
    )
    .bind(user_id)
    .bind(tenant_id)
    .fetch_one(&state.db)
    .await?;

    // Issue full auth tokens
    let access_token =
        jwt::create_access_token(user.id, user.tenant_id, &role, &state.config.jwt_secret)?;
    let (refresh_token, refresh_jti) =
        jwt::create_refresh_token(user.id, user.tenant_id, &role, &state.config.jwt_secret)?;

    // Store refresh token jti for rotation tracking
    store_refresh_token_jti(&state, user.id, refresh_jti).await;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            tenant_id: user.tenant_id,
        },
    }))
}

pub async fn health() -> StatusCode {
    StatusCode::OK
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(payload): Json<RefreshRequest>,
) -> AppResult<Json<AuthResponse>> {
    // Validate the refresh token
    let token_data = jwt::validate_token(&payload.refresh_token, &state.config.jwt_secret)
        .map_err(|_| AppError::Unauthorized("Invalid or expired refresh token".to_string()))?;

    let claims = token_data.claims;

    // Check if this specific refresh token (by jti) has been revoked
    if let Some(jti) = claims.jti {
        if let Some(ref redis) = state.redis {
            use fred::interfaces::KeysInterface;
            let revoke_key = format!("revoked_refresh_jti:{}", jti);
            let revoked: Option<String> = redis.get(&revoke_key).await.ok().flatten();
            if revoked.is_some() {
                tracing::warn!(
                    user_id = %claims.sub,
                    jti = %jti,
                    "Attempted reuse of revoked refresh token -- possible token theft"
                );
                // Revoke ALL tokens for this user as a security measure (token theft detected)
                let revoke_all_key = format!("revoked_token:{}", claims.sub);
                let _: () = redis
                    .set(
                        &revoke_all_key,
                        "revoked",
                        Some(fred::types::Expiration::EX(7 * 24 * 3600)),
                        None,
                        false,
                    )
                    .await
                    .unwrap_or(());
                return Err(AppError::Unauthorized("Token has been revoked".to_string()));
            }
        }
    }

    // Check if ALL tokens for this user have been revoked (logout)
    if let Some(ref redis) = state.redis {
        use fred::interfaces::KeysInterface;
        let revoke_key = format!("revoked_token:{}", claims.sub);
        let revoked: Option<String> = redis.get(&revoke_key).await.ok().flatten();
        if revoked.is_some() {
            return Err(AppError::Unauthorized("Token has been revoked".to_string()));
        }
    }

    // Verify user still exists and is active
    let user: UserRow = sqlx::query_as(
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until, mfa_enabled \
         FROM users WHERE id = $1 AND tenant_id = $2"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

    if user.status != "active" {
        return Err(AppError::Unauthorized("Account is not active".to_string()));
    }

    // Refresh token rotation: invalidate the old refresh token
    if let Some(jti) = claims.jti {
        if let Some(ref redis) = state.redis {
            use fred::interfaces::KeysInterface;
            let revoke_key = format!("revoked_refresh_jti:{}", jti);
            // Revoke old refresh token with TTL matching its remaining lifetime
            let _: () = redis
                .set(
                    &revoke_key,
                    "rotated",
                    Some(fred::types::Expiration::EX(7 * 24 * 3600)),
                    None,
                    false,
                )
                .await
                .unwrap_or(());
        }
    }

    // Issue new token pair (with new jti for the refresh token)
    let access_token = jwt::create_access_token(
        user.id,
        user.tenant_id,
        &user.role,
        &state.config.jwt_secret,
    )?;
    let (refresh_token, refresh_jti) = jwt::create_refresh_token(
        user.id,
        user.tenant_id,
        &user.role,
        &state.config.jwt_secret,
    )?;

    // Store new refresh token jti
    store_refresh_token_jti(&state, user.id, refresh_jti).await;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            tenant_id: user.tenant_id,
        },
    }))
}

pub async fn get_me(
    State(state): State<AppState>,
    Extension(claims): Extension<jwt::Claims>,
) -> AppResult<Json<UserResponse>> {
    let user: UserRow = sqlx::query_as(
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until, mfa_enabled \
         FROM users WHERE id = $1 AND tenant_id = $2"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        tenant_id: user.tenant_id,
    }))
}

#[derive(Debug, Deserialize, Validate)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 1))]
    pub current_password: String,
    #[validate(length(min = 12, max = 128))]
    pub new_password: String,
}

pub async fn change_password(
    State(state): State<AppState>,
    Extension(claims): Extension<jwt::Claims>,
    Json(payload): Json<ChangePasswordRequest>,
) -> AppResult<StatusCode> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Fetch current hash
    let (current_hash,): (String,) =
        sqlx::query_as("SELECT password_hash FROM users WHERE id = $1 AND tenant_id = $2")
            .bind(claims.sub)
            .bind(claims.tid)
            .fetch_one(&state.db)
            .await?;

    // Verify current password
    if !password::verify_password(&payload.current_password, &current_hash)? {
        return Err(AppError::Unauthorized(
            "Current password is incorrect".to_string(),
        ));
    }

    // Ensure new password is different
    if payload.current_password == payload.new_password {
        return Err(AppError::Validation(
            "New password must be different from current password".to_string(),
        ));
    }

    // Hash and update
    let new_hash = password::hash_password(&payload.new_password)?;
    sqlx::query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3",
    )
    .bind(&new_hash)
    .bind(claims.sub)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::OK)
}

pub async fn logout(
    State(state): State<AppState>,
    Extension(claims): Extension<jwt::Claims>,
) -> AppResult<StatusCode> {
    security::log_security_event(
        state.db.clone(),
        Some(claims.tid),
        Some(claims.sub),
        SecurityEventType::LogoutSuccess,
        "User logged out, tokens revoked".to_string(),
        None,
        None,
        None,
    );

    // Revoke all tokens for this user via Redis
    if let Some(ref redis) = state.redis {
        use fred::interfaces::KeysInterface;
        let revoke_key = format!("revoked_token:{}", claims.sub);
        // Set revocation flag with TTL matching refresh token lifetime (7 days)
        let _: () = redis
            .set(
                &revoke_key,
                "revoked",
                Some(fred::types::Expiration::EX(7 * 24 * 3600)),
                None,
                false,
            )
            .await
            .map_err(|e| AppError::Internal(format!("Failed to revoke token: {}", e)))?;
    }

    // Also revoke in database for persistence
    sqlx::query(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
    )
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

// ── Candidate Self-Registration ──────────────────────────────────────────

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterCandidateRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 12, max = 128))]
    pub password: String,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
}

pub async fn register_candidate(
    State(state): State<AppState>,
    Json(payload): Json<RegisterCandidateRequest>,
) -> AppResult<(StatusCode, Json<AuthResponse>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let normalized_email = payload.email.trim().to_lowercase();

    // Check if email already exists
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE LOWER(email) = $1")
        .bind(&normalized_email)
        .fetch_one(&state.db)
        .await?;

    if row.0 > 0 {
        return Err(AppError::Conflict("Email already registered".to_string()));
    }

    let password_hash = password::hash_password(&payload.password)?;

    // Create a tenant for the candidate (candidates get their own tenant context)
    let tenant_id = Uuid::new_v4();
    let tenant_name = format!("{} {}", &payload.first_name, &payload.last_name);
    let tenant_slug = slug::slugify(&tenant_name);

    sqlx::query(
        "INSERT INTO tenants (id, name, slug, tier, status, kms_key_id) \
         VALUES ($1, $2, $3, 'solo', 'active', 'dev-key')",
    )
    .bind(tenant_id)
    .bind(&tenant_name)
    .bind(&tenant_slug)
    .execute(&state.db)
    .await?;

    // Create user with candidate role
    let user_id = Uuid::new_v4();

    sqlx::query(
        "INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status) \
         VALUES ($1, $2, $3, $4, $5, $6, 'candidate', 'active')"
    )
    .bind(user_id)
    .bind(tenant_id)
    .bind(&normalized_email)
    .bind(&password_hash)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .execute(&state.db)
    .await?;

    // Create candidate_profiles row
    sqlx::query(
        "INSERT INTO candidate_profiles (tenant_id, user_id, headline) \
         VALUES ($1, $2, $3)",
    )
    .bind(tenant_id)
    .bind(user_id)
    .bind(format!("{} {}", &payload.first_name, &payload.last_name))
    .execute(&state.db)
    .await?;

    let access_token =
        jwt::create_access_token(user_id, tenant_id, "candidate", &state.config.jwt_secret)?;
    let (refresh_token, _jti) =
        jwt::create_refresh_token(user_id, tenant_id, "candidate", &state.config.jwt_secret)?;

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            access_token,
            refresh_token,
            user: UserResponse {
                id: user_id,
                email: normalized_email,
                first_name: payload.first_name,
                last_name: payload.last_name,
                role: "candidate".to_string(),
                tenant_id,
            },
        }),
    ))
}

// === Password Reset ===

#[derive(Debug, Deserialize, Validate)]
pub struct ForgotPasswordRequest {
    #[validate(email)]
    pub email: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ResetPasswordRequest {
    pub token: String,
    #[validate(length(min = 12, max = 128))]
    pub new_password: String,
}

pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> AppResult<StatusCode> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Always return OK to prevent email enumeration
    let user: Option<(Uuid, Uuid, String)> = sqlx::query_as(
        "SELECT id, tenant_id, email FROM users WHERE LOWER(email) = $1 AND status = 'active'",
    )
    .bind(&payload.email.trim().to_lowercase())
    .fetch_optional(&state.db)
    .await?;

    if let Some((user_id, tenant_id, _email)) = user {
        let reset_token = Uuid::new_v4().to_string();
        let expires_at = chrono::Utc::now() + chrono::Duration::hours(1);

        sqlx::query(
            "INSERT INTO password_reset_tokens (user_id, tenant_id, token, expires_at) VALUES ($1, $2, $3, $4) \
             ON CONFLICT (user_id) DO UPDATE SET token = $3, expires_at = $4, created_at = NOW()"
        )
        .bind(user_id)
        .bind(tenant_id)
        .bind(&reset_token)
        .bind(expires_at)
        .execute(&state.db)
        .await?;

        // In production: send email via Resend with reset link containing token
        tracing::info!(
            "Password reset requested for user {}, token: {}",
            user_id,
            reset_token
        );
    }

    Ok(StatusCode::OK)
}

pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>,
) -> AppResult<StatusCode> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let record: Option<(Uuid, Uuid)> = sqlx::query_as(
        "SELECT user_id, tenant_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL"
    )
    .bind(&payload.token)
    .fetch_optional(&state.db)
    .await?;

    let (user_id, _tenant_id) =
        record.ok_or_else(|| AppError::Validation("Invalid or expired reset token".to_string()))?;

    let password_hash = password::hash_password(&payload.new_password)?;

    sqlx::query("UPDATE users SET password_hash = $2, failed_login_count = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1")
        .bind(user_id)
        .bind(&password_hash)
        .execute(&state.db)
        .await?;

    sqlx::query("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1")
        .bind(user_id)
        .execute(&state.db)
        .await?;

    Ok(StatusCode::OK)
}

// === Email Verification ===

pub async fn request_email_verification(
    State(state): State<AppState>,
    Extension(claims): Extension<jwt::Claims>,
) -> AppResult<StatusCode> {
    let verification_token = Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(24);

    sqlx::query(
        "UPDATE users SET email_verification_token = $3, email_verification_expires = $4, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .bind(&verification_token)
    .bind(expires_at)
    .execute(&state.db)
    .await?;

    // In production: send verification email
    tracing::info!(
        "Email verification requested for user {}, token: {}",
        claims.sub,
        verification_token
    );

    Ok(StatusCode::OK)
}

#[derive(Debug, Deserialize)]
pub struct VerifyEmailRequest {
    pub token: String,
}

pub async fn verify_email(
    State(state): State<AppState>,
    Json(payload): Json<VerifyEmailRequest>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL, updated_at = NOW() \
         WHERE email_verification_token = $1 AND email_verification_expires > NOW()"
    )
    .bind(&payload.token)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::Validation(
            "Invalid or expired verification token".to_string(),
        ));
    }

    Ok(StatusCode::OK)
}

// === Accept Invite (set password for invited users) ===

#[derive(Debug, Deserialize, Validate)]
pub struct AcceptInviteRequest {
    pub token: String,
    #[validate(length(min = 12, max = 128))]
    pub password: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

pub async fn accept_invite(
    State(state): State<AppState>,
    Json(payload): Json<AcceptInviteRequest>,
) -> AppResult<Json<AuthResponse>> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Find invited user by invite token
    let user: Option<UserRow> = sqlx::query_as(
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until, mfa_enabled \
         FROM users WHERE invite_token = $1 AND status = 'invited'"
    )
    .bind(&payload.token)
    .fetch_optional(&state.db)
    .await?;

    let user = user.ok_or_else(|| AppError::NotFound("Invalid or expired invite".to_string()))?;

    let password_hash = password::hash_password(&payload.password)?;
    let first_name = payload.first_name.as_deref().unwrap_or(&user.first_name);
    let last_name = payload.last_name.as_deref().unwrap_or(&user.last_name);

    sqlx::query(
        "UPDATE users SET password_hash = $2, first_name = $3, last_name = $4, status = 'active', invite_token = NULL, updated_at = NOW() WHERE id = $1"
    )
    .bind(user.id)
    .bind(&password_hash)
    .bind(first_name)
    .bind(last_name)
    .execute(&state.db)
    .await?;

    let access_token = jwt::create_access_token(
        user.id,
        user.tenant_id,
        &user.role,
        &state.config.jwt_secret,
    )?;
    let (refresh_token, refresh_jti) = jwt::create_refresh_token(
        user.id,
        user.tenant_id,
        &user.role,
        &state.config.jwt_secret,
    )?;

    // Store refresh token jti for rotation tracking
    store_refresh_token_jti(&state, user.id, refresh_jti).await;

    Ok(Json(AuthResponse {
        access_token,
        refresh_token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            first_name: first_name.to_string(),
            last_name: last_name.to_string(),
            role: user.role,
            tenant_id: user.tenant_id,
        },
    }))
}

// === Helper: store refresh token jti in Redis for rotation tracking ===

async fn store_refresh_token_jti(state: &AppState, user_id: Uuid, jti: Uuid) {
    if let Some(ref redis) = state.redis {
        use fred::interfaces::KeysInterface;
        let key = format!("refresh_jti:{}:{}", user_id, jti);
        let _: () = redis
            .set(
                &key,
                "active",
                Some(fred::types::Expiration::EX(7 * 24 * 3600)), // 7 days matching refresh token
                None,
                false,
            )
            .await
            .unwrap_or(());
    }
}
