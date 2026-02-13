use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ActivityItem {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub actor_id: Uuid,
    pub action: String,
    pub action_type: String,
    pub resource_type: String,
    pub resource_id: Option<Uuid>,
    pub resource_name: Option<String>,
    pub metadata: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct ActivityStats {
    pub actions_today: i64,
    pub actions_this_week: i64,
    pub avg_daily_actions: f64,
    pub most_active_member: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListActivityParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub action_type: Option<String>,
    pub actor_id: Option<Uuid>,
    pub date_from: Option<String>,
    pub date_to: Option<String>,
}

pub async fn list_activity(
    State(state): State<AppState>,
    claims: Claims,
    Query(params): Query<ListActivityParams>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let offset = ((params.page.unwrap_or(1) - 1) * per_page).max(0);

    let items = sqlx::query_as::<_, ActivityItem>(
        r#"SELECT * FROM activity_log
           WHERE tenant_id = $1
           AND ($4::text IS NULL OR action_type = $4)
           AND ($5::uuid IS NULL OR actor_id = $5)
           ORDER BY created_at DESC
           LIMIT $2 OFFSET $3"#,
    )
    .bind(claims.tid)
    .bind(per_page)
    .bind(offset)
    .bind(&params.action_type)
    .bind(params.actor_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    let total: (i64,) = sqlx::query_as(
        r#"SELECT COUNT(*) FROM activity_log
           WHERE tenant_id = $1
           AND ($2::text IS NULL OR action_type = $2)
           AND ($3::uuid IS NULL OR actor_id = $3)"#,
    )
    .bind(claims.tid)
    .bind(&params.action_type)
    .bind(params.actor_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({
        "data": items,
        "meta": {
            "page": params.page.unwrap_or(1),
            "per_page": per_page,
            "total": total.0,
        }
    })))
}

pub async fn get_activity_stats(
    State(state): State<AppState>,
    claims: Claims,
) -> AppResult<Json<ActivityStats>> {
    let today: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM activity_log WHERE tenant_id = $1 AND created_at >= CURRENT_DATE",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    let this_week: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM activity_log WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    let avg_daily = if this_week.0 > 0 {
        this_week.0 as f64 / 7.0
    } else {
        0.0
    };

    Ok(Json(ActivityStats {
        actions_today: today.0,
        actions_this_week: this_week.0,
        avg_daily_actions: avg_daily,
        most_active_member: None,
    }))
}
