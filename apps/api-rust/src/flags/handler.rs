use axum::{
    extract::{Extension, State},
    Json,
};

use crate::auth::jwt::Claims;
use crate::error::AppResult;
use crate::AppState;

/// GET /flags - Get all feature flags for the current tenant
pub async fn get_flags(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    // Query entitlements as feature flags
    let flags: Vec<(String, bool, Option<i64>)> = sqlx::query_as(
        "SELECT feature_key, is_enabled, limit_value \
         FROM entitlements \
         WHERE tenant_id = $1 AND (expires_at IS NULL OR expires_at > NOW()) \
         ORDER BY feature_key ASC",
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    let flags_map: serde_json::Map<String, serde_json::Value> = flags
        .into_iter()
        .map(|(key, enabled, limit)| {
            let value = serde_json::json!({
                "enabled": enabled,
                "limit": limit,
            });
            (key, value)
        })
        .collect();

    Ok(Json(serde_json::json!({
        "flags": flags_map,
        "evaluated_at": chrono::Utc::now().to_rfc3339(),
    })))
}
