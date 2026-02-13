use axum::{
    extract::{Path, State},
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
pub struct SavedJob {
    pub id: Uuid,
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SavedJobWithDetails {
    pub id: Uuid,
    pub user_id: Uuid,
    pub job_id: Uuid,
    pub job_title: Option<String>,
    pub department: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub employment_type: Option<String>,
    pub salary_min_cents: Option<i64>,
    pub salary_max_cents: Option<i64>,
    pub job_status: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SaveJobPayload {
    pub job_id: Uuid,
}

pub async fn list_saved_jobs(
    State(state): State<AppState>,
    claims: Claims,
) -> AppResult<Json<Vec<SavedJobWithDetails>>> {
    let saved = sqlx::query_as::<_, SavedJobWithDetails>(
        r#"SELECT sj.id, sj.user_id, sj.job_id,
                  jp.title as job_title, jp.department, jp.location_city,
                  jp.location_state, jp.employment_type,
                  jp.salary_min_cents, jp.salary_max_cents, jp.status as job_status,
                  sj.created_at
           FROM saved_jobs sj
           JOIN job_posts jp ON jp.id = sj.job_id
           WHERE sj.user_id = $1
           ORDER BY sj.created_at DESC"#,
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(saved))
}

pub async fn save_job(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<SaveJobPayload>,
) -> AppResult<(StatusCode, Json<SavedJob>)> {
    let saved = sqlx::query_as::<_, SavedJob>(
        r#"INSERT INTO saved_jobs (user_id, job_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, job_id) DO UPDATE SET user_id = EXCLUDED.user_id
           RETURNING *"#,
    )
    .bind(claims.sub)
    .bind(payload.job_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(saved)))
}

pub async fn unsave_job(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query("DELETE FROM saved_jobs WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(StatusCode::NO_CONTENT)
}
