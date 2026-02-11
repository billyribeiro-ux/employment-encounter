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
}

pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<AuthResponse>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Check if email already exists
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&payload.email)
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
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .execute(&state.db)
    .await?;

    let access_token = jwt::create_access_token(user_id, tenant_id, "admin", &state.config.jwt_secret)?;
    let refresh_token = jwt::create_refresh_token(user_id, tenant_id, "admin", &state.config.jwt_secret)?;

    Ok((
        StatusCode::CREATED,
        Json(AuthResponse {
            access_token,
            refresh_token,
            user: UserResponse {
                id: user_id,
                email: payload.email,
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
) -> AppResult<Json<AuthResponse>> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let ip = security::extract_ip(&headers);
    let ua = security::extract_user_agent(&headers);

    // Find user by email
    let user: UserRow = sqlx::query_as(
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until FROM users WHERE email = $1",
    )
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

    // Check if account is locked
    if let Some(locked_until) = user.locked_until {
        if locked_until > chrono::Utc::now() {
            security::log_security_event(
                state.db.clone(), Some(user.tenant_id), Some(user.id),
                SecurityEventType::LoginLocked,
                format!("Login attempt on locked account: {}", payload.email),
                ip.clone(), ua.clone(), None,
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
            state.db.clone(), Some(user.tenant_id), Some(user.id),
            SecurityEventType::LoginFailed,
            format!("Failed login attempt #{} for: {}", new_count, payload.email),
            ip.clone(), ua.clone(), None,
        );
        return Err(AppError::Unauthorized("Invalid email or password".to_string()));
    }

    // Reset failed login count on successful login
    sqlx::query("UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1")
        .bind(user.id)
        .execute(&state.db)
        .await?;

    security::log_security_event(
        state.db.clone(), Some(user.tenant_id), Some(user.id),
        SecurityEventType::LoginSuccess,
        format!("Successful login: {}", user.email),
        ip, ua, None,
    );

    let access_token = jwt::create_access_token(user.id, user.tenant_id, &user.role, &state.config.jwt_secret)?;
    let refresh_token = jwt::create_refresh_token(user.id, user.tenant_id, &user.role, &state.config.jwt_secret)?;

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

    // Check if token has been revoked via Redis
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
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until \
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

    // Issue new token pair
    let access_token = jwt::create_access_token(user.id, user.tenant_id, &user.role, &state.config.jwt_secret)?;
    let refresh_token = jwt::create_refresh_token(user.id, user.tenant_id, &user.role, &state.config.jwt_secret)?;

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
        "SELECT id, tenant_id, email, password_hash, first_name, last_name, role, status, failed_login_count, locked_until \
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

pub async fn logout(
    State(state): State<AppState>,
    Extension(claims): Extension<jwt::Claims>,
) -> AppResult<StatusCode> {
    security::log_security_event(
        state.db.clone(), Some(claims.tid), Some(claims.sub),
        SecurityEventType::LogoutSuccess,
        "User logged out, tokens revoked".to_string(),
        None, None, None,
    );

    // Revoke all tokens for this user via Redis
    if let Some(ref redis) = state.redis {
        use fred::interfaces::KeysInterface;
        let revoke_key = format!("revoked_token:{}", claims.sub);
        // Set revocation flag with TTL matching refresh token lifetime (7 days)
        let _: () = redis.set(&revoke_key, "revoked", Some(fred::types::Expiration::EX(7 * 24 * 3600)), None, false).await
            .map_err(|e| AppError::Internal(format!("Failed to revoke token: {}", e)))?;
    }

    // Also revoke in database for persistence
    sqlx::query(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL"
    )
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::NO_CONTENT)
}
