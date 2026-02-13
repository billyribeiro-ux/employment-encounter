use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AutomationRule {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub is_active: bool,
    pub trigger_event: String,
    pub conditions: serde_json::Value,
    pub actions: serde_json::Value,
    pub execution_count: i32,
    pub last_executed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct AutomationLogEntry {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub rule_id: Uuid,
    pub trigger_data: Option<serde_json::Value>,
    pub actions_taken: Option<serde_json::Value>,
    pub status: Option<String>,
    pub error_message: Option<String>,
    pub executed_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRulePayload {
    pub name: String,
    pub trigger_event: String,
    pub conditions: Option<serde_json::Value>,
    pub actions: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRulePayload {
    pub name: Option<String>,
    pub trigger_event: Option<String>,
    pub conditions: Option<serde_json::Value>,
    pub actions: Option<serde_json::Value>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct LogParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub rule_id: Option<Uuid>,
}

pub async fn list_rules(
    State(state): State<AppState>,
    claims: Claims,
) -> AppResult<Json<Vec<AutomationRule>>> {
    let rules = sqlx::query_as::<_, AutomationRule>(
        "SELECT * FROM automation_rules WHERE tenant_id = $1 ORDER BY is_active DESC, name ASC",
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(rules))
}

pub async fn create_rule(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<CreateRulePayload>,
) -> AppResult<(StatusCode, Json<AutomationRule>)> {
    let rule = sqlx::query_as::<_, AutomationRule>(
        r#"INSERT INTO automation_rules (tenant_id, name, trigger_event, conditions, actions, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(claims.tid)
    .bind(&payload.name)
    .bind(&payload.trigger_event)
    .bind(payload.conditions.unwrap_or(serde_json::json!({})))
    .bind(&payload.actions)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(rule)))
}

pub async fn update_rule(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateRulePayload>,
) -> AppResult<Json<AutomationRule>> {
    let rule = sqlx::query_as::<_, AutomationRule>(
        r#"UPDATE automation_rules SET
            name = COALESCE($3, name),
            trigger_event = COALESCE($4, trigger_event),
            conditions = COALESCE($5, conditions),
            actions = COALESCE($6, actions),
            is_active = COALESCE($7, is_active),
            updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2
           RETURNING *"#,
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.name)
    .bind(payload.trigger_event)
    .bind(payload.conditions)
    .bind(payload.actions)
    .bind(payload.is_active)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound("Resource not found".into()))?;

    Ok(Json(rule))
}

pub async fn delete_rule(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query("DELETE FROM automation_rules WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn toggle_rule(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<Json<AutomationRule>> {
    let rule = sqlx::query_as::<_, AutomationRule>(
        r#"UPDATE automation_rules SET is_active = NOT is_active, updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2
           RETURNING *"#,
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound("Resource not found".into()))?;

    Ok(Json(rule))
}

pub async fn list_execution_log(
    State(state): State<AppState>,
    claims: Claims,
    Query(params): Query<LogParams>,
) -> AppResult<Json<Vec<AutomationLogEntry>>> {
    let per_page = params.per_page.unwrap_or(20).min(100);
    let offset = ((params.page.unwrap_or(1) - 1) * per_page).max(0);

    let log = sqlx::query_as::<_, AutomationLogEntry>(
        r#"SELECT * FROM automation_log
           WHERE tenant_id = $1
           AND ($4::uuid IS NULL OR rule_id = $4)
           ORDER BY executed_at DESC
           LIMIT $2 OFFSET $3"#,
    )
    .bind(claims.tid)
    .bind(per_page)
    .bind(offset)
    .bind(params.rule_id)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(log))
}
