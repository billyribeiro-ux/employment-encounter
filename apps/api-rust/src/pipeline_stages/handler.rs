use crate::AppState;
use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

use crate::auth::Claims;
use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PipelineTemplate {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub is_default: bool,
    pub stages: serde_json::Value,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePipelineTemplate {
    pub name: String,
    pub description: Option<String>,
    pub stages: serde_json::Value,
    pub is_default: Option<bool>,
}

pub async fn list_templates(
    claims: Claims,
    State(state): State<AppState>,
) -> Result<Json<Vec<PipelineTemplate>>, AppError> {
    let templates = sqlx::query_as::<_, PipelineTemplate>(
        "SELECT id::text, name, description, is_default, stages, created_at
         FROM pipeline_templates WHERE tenant_id = $1 ORDER BY is_default DESC, name",
    )
    .bind(&claims.tid)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(templates))
}

pub async fn create_template(
    claims: Claims,
    State(state): State<AppState>,
    Json(body): Json<CreatePipelineTemplate>,
) -> Result<(StatusCode, Json<PipelineTemplate>), AppError> {
    let template = sqlx::query_as::<_, PipelineTemplate>(
        "INSERT INTO pipeline_templates (tenant_id, name, description, stages, is_default)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id::text, name, description, is_default, stages, created_at",
    )
    .bind(&claims.tid)
    .bind(&body.name)
    .bind(&body.description)
    .bind(&body.stages)
    .bind(body.is_default.unwrap_or(false))
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(template)))
}
