use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::auth::Claims;
use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct OnboardingTemplate {
    pub id: String,
    pub name: String,
    pub role_type: Option<String>,
    pub phases: serde_json::Value,
    pub is_default: bool,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct OnboardingInstance {
    pub id: String,
    pub new_hire_name: String,
    pub new_hire_email: Option<String>,
    pub job_title: Option<String>,
    pub department: Option<String>,
    pub start_date: chrono::NaiveDate,
    pub status: String,
    pub progress_percent: i32,
    pub tasks: serde_json::Value,
    pub documents: serde_json::Value,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInstance {
    pub template_id: Option<String>,
    pub new_hire_name: String,
    pub new_hire_email: Option<String>,
    pub job_title: Option<String>,
    pub department: Option<String>,
    pub start_date: String,
    pub manager_id: Option<String>,
    pub buddy_id: Option<String>,
}

pub async fn list_templates(
    claims: Claims,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<OnboardingTemplate>>, AppError> {
    let templates = sqlx::query_as::<_, OnboardingTemplate>(
        "SELECT id::text, name, role_type, phases, is_default, created_at
         FROM onboarding_templates WHERE tenant_id = $1 ORDER BY name"
    )
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(templates))
}

pub async fn list_instances(
    claims: Claims,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<OnboardingInstance>>, AppError> {
    let instances = sqlx::query_as::<_, OnboardingInstance>(
        "SELECT id::text, new_hire_name, new_hire_email, job_title, department,
                start_date, status, progress_percent, tasks, documents, created_at
         FROM onboarding_instances WHERE tenant_id = $1 ORDER BY start_date DESC"
    )
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(instances))
}

pub async fn create_instance(
    claims: Claims,
    State(pool): State<PgPool>,
    Json(body): Json<CreateInstance>,
) -> Result<(StatusCode, Json<OnboardingInstance>), AppError> {
    let start_date = chrono::NaiveDate::parse_from_str(&body.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::NotFound)?;

    let instance = sqlx::query_as::<_, OnboardingInstance>(
        "INSERT INTO onboarding_instances (tenant_id, template_id, new_hire_name, new_hire_email,
                                            job_title, department, start_date, manager_id, buddy_id)
         VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8::uuid, $9::uuid)
         RETURNING id::text, new_hire_name, new_hire_email, job_title, department,
                   start_date, status, progress_percent, tasks, documents, created_at"
    )
    .bind(&claims.tid)
    .bind(&body.template_id)
    .bind(&body.new_hire_name)
    .bind(&body.new_hire_email)
    .bind(&body.job_title)
    .bind(&body.department)
    .bind(start_date)
    .bind(&body.manager_id)
    .bind(&body.buddy_id)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(instance)))
}

pub async fn update_progress(
    claims: Claims,
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<OnboardingInstance>, AppError> {
    let progress = body.get("progress_percent").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
    let tasks = body.get("tasks").cloned().unwrap_or(serde_json::json!([]));

    let instance = sqlx::query_as::<_, OnboardingInstance>(
        "UPDATE onboarding_instances SET progress_percent = $1, tasks = $2,
                status = CASE WHEN $1 >= 100 THEN 'completed' ELSE 'in_progress' END,
                updated_at = now()
         WHERE id = $3::uuid AND tenant_id = $4
         RETURNING id::text, new_hire_name, new_hire_email, job_title, department,
                   start_date, status, progress_percent, tasks, documents, created_at"
    )
    .bind(progress)
    .bind(tasks)
    .bind(&id)
    .bind(&claims.tid)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(instance))
}
