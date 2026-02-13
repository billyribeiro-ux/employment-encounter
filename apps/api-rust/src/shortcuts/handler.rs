use axum::{
    extract::{Extension, State},
    http::StatusCode,
    Json,
};

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::shortcuts::model::*;
use crate::AppState;

/// GET /shortcuts - Get user's active shortcut profile and bindings
pub async fn get_shortcuts(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    // Get or create default profile
    let profile: ShortcutProfile = match sqlx::query_as::<_, ShortcutProfile>(
        "SELECT id, tenant_id, user_id, name, is_active, created_at, updated_at \
         FROM shortcut_profiles \
         WHERE tenant_id = $1 AND user_id = $2 AND is_active = true \
         LIMIT 1",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    {
        Some(p) => p,
        None => {
            // Create default profile
            sqlx::query_as(
                "INSERT INTO shortcut_profiles (tenant_id, user_id, name, is_active) \
                 VALUES ($1, $2, 'Default', true) \
                 RETURNING id, tenant_id, user_id, name, is_active, created_at, updated_at",
            )
            .bind(claims.tid)
            .bind(claims.sub)
            .fetch_one(&state.db)
            .await?
        }
    };

    let bindings: Vec<ShortcutBinding> = sqlx::query_as(
        "SELECT id, tenant_id, profile_id, action, keys, scope, is_enabled, created_at \
         FROM shortcut_bindings \
         WHERE tenant_id = $1 AND profile_id = $2 \
         ORDER BY action ASC",
    )
    .bind(claims.tid)
    .bind(profile.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "profile": profile,
        "bindings": bindings
    })))
}

/// PATCH /shortcuts - Update shortcut bindings
pub async fn update_shortcuts(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateShortcutsRequest>,
) -> AppResult<Json<serde_json::Value>> {
    // Get active profile
    let profile: ShortcutProfile = sqlx::query_as(
        "SELECT id, tenant_id, user_id, name, is_active, created_at, updated_at \
         FROM shortcut_profiles \
         WHERE tenant_id = $1 AND user_id = $2 AND is_active = true \
         LIMIT 1",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Shortcut profile not found".to_string()))?;

    // Upsert bindings
    for binding in &payload.bindings {
        let scope = binding.scope.as_deref().unwrap_or("global");
        let is_enabled = binding.is_enabled.unwrap_or(true);

        sqlx::query(
            "INSERT INTO shortcut_bindings (tenant_id, profile_id, action, keys, scope, is_enabled) \
             VALUES ($1, $2, $3, $4, $5, $6) \
             ON CONFLICT (tenant_id, profile_id, action) \
             DO UPDATE SET keys = $4, scope = $5, is_enabled = $6",
        )
        .bind(claims.tid)
        .bind(profile.id)
        .bind(&binding.action)
        .bind(&binding.keys)
        .bind(scope)
        .bind(is_enabled)
        .execute(&state.db)
        .await?;
    }

    // Fetch updated bindings
    let bindings: Vec<ShortcutBinding> = sqlx::query_as(
        "SELECT id, tenant_id, profile_id, action, keys, scope, is_enabled, created_at \
         FROM shortcut_bindings \
         WHERE tenant_id = $1 AND profile_id = $2 \
         ORDER BY action ASC",
    )
    .bind(claims.tid)
    .bind(profile.id)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "profile": profile,
        "bindings": bindings
    })))
}

/// POST /shortcuts/usage-events - Track shortcut usage
pub async fn record_usage_event(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ShortcutUsageEvent>,
) -> AppResult<StatusCode> {
    sqlx::query(
        "INSERT INTO shortcut_usage_events (tenant_id, user_id, action, keys, context) \
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(&payload.action)
    .bind(&payload.keys)
    .bind(payload.context.as_deref())
    .execute(&state.db)
    .await?;

    Ok(StatusCode::CREATED)
}
