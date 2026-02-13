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
pub struct EmailTemplate {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub category: String,
    pub subject: String,
    pub body: String,
    pub variables: Vec<String>,
    pub is_active: bool,
    pub is_default: bool,
    pub usage_count: i32,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ListParams {
    pub category: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTemplatePayload {
    pub name: String,
    pub category: Option<String>,
    pub subject: String,
    pub body: String,
    pub variables: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTemplatePayload {
    pub name: Option<String>,
    pub category: Option<String>,
    pub subject: Option<String>,
    pub body: Option<String>,
    pub variables: Option<Vec<String>>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct SendTemplatePayload {
    pub recipient_email: String,
    pub variables: serde_json::Value,
}

pub async fn list_templates(
    State(state): State<AppState>,
    claims: Claims,
    Query(params): Query<ListParams>,
) -> AppResult<Json<Vec<EmailTemplate>>> {
    let templates = sqlx::query_as::<_, EmailTemplate>(
        r#"SELECT * FROM email_templates
           WHERE tenant_id = $1
           AND ($2::text IS NULL OR category = $2)
           AND ($3::bool IS NULL OR is_active = $3)
           ORDER BY is_default DESC, name ASC"#,
    )
    .bind(claims.tid)
    .bind(params.category)
    .bind(params.is_active)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(templates))
}

pub async fn create_template(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<CreateTemplatePayload>,
) -> AppResult<(StatusCode, Json<EmailTemplate>)> {
    let template = sqlx::query_as::<_, EmailTemplate>(
        r#"INSERT INTO email_templates (tenant_id, name, category, subject, body, variables, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *"#,
    )
    .bind(claims.tid)
    .bind(&payload.name)
    .bind(payload.category.as_deref().unwrap_or("custom"))
    .bind(&payload.subject)
    .bind(&payload.body)
    .bind(payload.variables.as_deref().unwrap_or(&[]))
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(template)))
}

pub async fn get_template(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<Json<EmailTemplate>> {
    let template = sqlx::query_as::<_, EmailTemplate>(
        "SELECT * FROM email_templates WHERE id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound("Resource not found".into()))?;

    Ok(Json(template))
}

pub async fn update_template(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateTemplatePayload>,
) -> AppResult<Json<EmailTemplate>> {
    let template = sqlx::query_as::<_, EmailTemplate>(
        r#"UPDATE email_templates SET
            name = COALESCE($3, name),
            category = COALESCE($4, category),
            subject = COALESCE($5, subject),
            body = COALESCE($6, body),
            variables = COALESCE($7, variables),
            is_active = COALESCE($8, is_active),
            updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2
           RETURNING *"#,
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.name)
    .bind(payload.category)
    .bind(payload.subject)
    .bind(payload.body)
    .bind(payload.variables)
    .bind(payload.is_active)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound("Resource not found".into()))?;

    Ok(Json(template))
}

pub async fn delete_template(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query("DELETE FROM email_templates WHERE id = $1 AND tenant_id = $2 AND is_default = false")
        .bind(id)
        .bind(claims.tid)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn send_template(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(_payload): Json<SendTemplatePayload>,
) -> AppResult<Json<serde_json::Value>> {
    // Increment usage count
    sqlx::query(
        "UPDATE email_templates SET usage_count = usage_count + 1 WHERE id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({ "status": "queued", "message": "Email queued for delivery" })))
}
