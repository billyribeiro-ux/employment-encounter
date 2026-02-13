use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::middleware::auth::require_role;
use crate::settings::model::*;
use crate::AppState;

pub async fn get_firm_settings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<FirmSettings>> {
    let firm: FirmSettings = sqlx::query_as(
        "SELECT id, name, slug, tier, status, settings, created_at, updated_at \
         FROM tenants WHERE id = $1"
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Firm not found".to_string()))?;

    Ok(Json(firm))
}

pub async fn update_firm_settings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateFirmSettingsRequest>,
) -> AppResult<Json<FirmSettings>> {
    require_role(&claims, "admin")?;

    let firm: FirmSettings = sqlx::query_as(
        "UPDATE tenants SET \
         name = COALESCE($2, name), \
         settings = COALESCE($3, settings), \
         updated_at = NOW() \
         WHERE id = $1 \
         RETURNING id, name, slug, tier, status, settings, created_at, updated_at"
    )
    .bind(claims.tid)
    .bind(&payload.name)
    .bind(&payload.settings)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Firm not found".to_string()))?;

    Ok(Json(firm))
}

pub async fn get_profile(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<UserProfile>> {
    let user: UserProfile = sqlx::query_as(
        "SELECT id, tenant_id, email, first_name, last_name, role, mfa_enabled, status, last_login_at, created_at, updated_at \
         FROM users WHERE id = $1 AND tenant_id = $2"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user))
}

pub async fn update_profile(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateProfileRequest>,
) -> AppResult<Json<UserProfile>> {
    let user: UserProfile = sqlx::query_as(
        "UPDATE users SET \
         first_name = COALESCE($3, first_name), \
         last_name = COALESCE($4, last_name), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, email, first_name, last_name, role, mfa_enabled, status, last_login_at, created_at, updated_at"
    )
    .bind(claims.sub)
    .bind(claims.tid)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user))
}

pub async fn list_users(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    require_role(&claims, "admin")?;

    let users: Vec<UserProfile> = sqlx::query_as(
        "SELECT id, tenant_id, email, first_name, last_name, role, mfa_enabled, status, last_login_at, created_at, updated_at \
         FROM users WHERE tenant_id = $1 AND status != 'deleted' ORDER BY created_at"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "data": users })))
}

pub async fn invite_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<InviteUserRequest>,
) -> AppResult<(StatusCode, Json<UserProfile>)> {
    require_role(&claims, "admin")?;

    // Check valid role
    let valid_roles = ["staff_accountant", "senior_accountant", "manager", "partner", "admin"];
    if !valid_roles.contains(&payload.role.as_str()) {
        return Err(AppError::Validation(format!("Invalid role: {}", payload.role)));
    }

    // Check duplicate email
    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM users WHERE tenant_id = $1 AND email = $2"
    )
    .bind(claims.tid)
    .bind(&payload.email)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::Conflict("User with this email already exists".to_string()));
    }

    // Create invited user with real hashed temp password and invite token
    let invite_token = Uuid::new_v4().to_string();
    let temp_password = Uuid::new_v4().to_string();
    let password_hash = crate::auth::password::hash_password(&temp_password)
        .unwrap_or_else(|_| "INVALID_HASH".to_string());

    let user: UserProfile = sqlx::query_as(
        "INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, invite_token) \
         VALUES ($1, $2, $3, $4, $5, $6, 'invited', $7) \
         RETURNING id, tenant_id, email, first_name, last_name, role, mfa_enabled, status, last_login_at, created_at, updated_at"
    )
    .bind(claims.tid)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.first_name)
    .bind(&payload.last_name)
    .bind(&payload.role)
    .bind(&invite_token)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(user)))
}

pub async fn update_user_role(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(user_id): Path<Uuid>,
    Json(payload): Json<UpdateUserRoleRequest>,
) -> AppResult<Json<UserProfile>> {
    require_role(&claims, "admin")?;

    let valid_roles = ["staff_accountant", "senior_accountant", "manager", "partner", "admin"];
    if !valid_roles.contains(&payload.role.as_str()) {
        return Err(AppError::Validation(format!("Invalid role: {}", payload.role)));
    }

    let user: UserProfile = sqlx::query_as(
        "UPDATE users SET role = $3, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, email, first_name, last_name, role, mfa_enabled, status, last_login_at, created_at, updated_at"
    )
    .bind(user_id)
    .bind(claims.tid)
    .bind(&payload.role)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user))
}

pub async fn delete_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(user_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    require_role(&claims, "partner")?;

    if user_id == claims.sub {
        return Err(AppError::Validation("Cannot delete yourself".to_string()));
    }

    let result = sqlx::query(
        "UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND tenant_id = $2 AND status != 'deleted'"
    )
    .bind(user_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("User not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
