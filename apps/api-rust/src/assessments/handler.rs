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
pub struct Assessment {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    pub difficulty: String,
    pub duration_minutes: i32,
    pub questions: serde_json::Value,
    pub passing_score: i32,
    pub is_active: bool,
    pub usage_count: i32,
    pub avg_score: Option<f64>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AssessmentSubmission {
    pub id: String,
    pub assessment_id: String,
    pub candidate_name: String,
    pub candidate_email: Option<String>,
    pub score: Option<f64>,
    pub percentile: Option<i32>,
    pub time_taken_seconds: Option<i32>,
    pub status: String,
    pub anti_cheat_flags: serde_json::Value,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAssessment {
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    pub difficulty: Option<String>,
    pub duration_minutes: Option<i32>,
    pub questions: serde_json::Value,
    pub passing_score: Option<i32>,
}

pub async fn list_assessments(
    claims: Claims,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Assessment>>, AppError> {
    let assessments = sqlx::query_as::<_, Assessment>(
        "SELECT id::text, title, description, category, difficulty, duration_minutes,
                questions, passing_score, is_active, usage_count,
                avg_score::float8 as avg_score, created_at
         FROM assessments WHERE tenant_id = $1 ORDER BY created_at DESC"
    )
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(assessments))
}

pub async fn create_assessment(
    claims: Claims,
    State(pool): State<PgPool>,
    Json(body): Json<CreateAssessment>,
) -> Result<(StatusCode, Json<Assessment>), AppError> {
    let assessment = sqlx::query_as::<_, Assessment>(
        "INSERT INTO assessments (tenant_id, title, description, category, difficulty, duration_minutes, questions, passing_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id::text, title, description, category, difficulty, duration_minutes,
                   questions, passing_score, is_active, usage_count,
                   avg_score::float8 as avg_score, created_at"
    )
    .bind(&claims.tid)
    .bind(&body.title)
    .bind(&body.description)
    .bind(&body.category)
    .bind(body.difficulty.unwrap_or_else(|| "medium".to_string()))
    .bind(body.duration_minutes.unwrap_or(30))
    .bind(&body.questions)
    .bind(body.passing_score.unwrap_or(70))
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(assessment)))
}

pub async fn list_submissions(
    claims: Claims,
    State(pool): State<PgPool>,
    Path(assessment_id): Path<String>,
) -> Result<Json<Vec<AssessmentSubmission>>, AppError> {
    let subs = sqlx::query_as::<_, AssessmentSubmission>(
        "SELECT s.id::text, s.assessment_id::text, s.candidate_name, s.candidate_email,
                s.score::float8 as score, s.percentile, s.time_taken_seconds,
                s.status, s.anti_cheat_flags, s.completed_at, s.created_at
         FROM assessment_submissions s
         JOIN assessments a ON a.id = s.assessment_id
         WHERE s.assessment_id = $1::uuid AND a.tenant_id = $2
         ORDER BY s.created_at DESC"
    )
    .bind(&assessment_id)
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(subs))
}
