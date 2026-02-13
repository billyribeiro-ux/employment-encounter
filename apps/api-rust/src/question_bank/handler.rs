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
pub struct InterviewQuestion {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub question: String,
    pub category: String,
    pub difficulty: Option<String>,
    pub suggested_followups: Vec<String>,
    pub scoring_rubric: Option<String>,
    pub is_starred: bool,
    pub usage_count: i32,
    pub avg_score: Option<f64>,
    pub tags: Vec<String>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct QuestionSet {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub interview_type: Option<String>,
    pub question_ids: Vec<Uuid>,
    pub created_by: Uuid,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ListQuestionsParams {
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub search: Option<String>,
    pub is_starred: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuestionPayload {
    pub question: String,
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub suggested_followups: Option<Vec<String>>,
    pub scoring_rubric: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuestionPayload {
    pub question: Option<String>,
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub suggested_followups: Option<Vec<String>>,
    pub scoring_rubric: Option<String>,
    pub is_starred: Option<bool>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateQuestionSetPayload {
    pub name: String,
    pub description: Option<String>,
    pub interview_type: Option<String>,
    pub question_ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuestionSetPayload {
    pub name: Option<String>,
    pub description: Option<String>,
    pub interview_type: Option<String>,
    pub question_ids: Option<Vec<Uuid>>,
}

pub async fn list_questions(
    State(state): State<AppState>,
    claims: Claims,
    Query(params): Query<ListQuestionsParams>,
) -> AppResult<Json<Vec<InterviewQuestion>>> {
    let questions = sqlx::query_as::<_, InterviewQuestion>(
        r#"SELECT * FROM interview_questions
           WHERE tenant_id = $1
           AND ($2::text IS NULL OR category = $2)
           AND ($3::text IS NULL OR difficulty = $3)
           AND ($4::bool IS NULL OR is_starred = $4)
           AND ($5::text IS NULL OR question ILIKE '%' || $5 || '%')
           ORDER BY is_starred DESC, created_at DESC"#,
    )
    .bind(claims.tid)
    .bind(params.category)
    .bind(params.difficulty)
    .bind(params.is_starred)
    .bind(params.search)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(questions))
}

pub async fn create_question(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<CreateQuestionPayload>,
) -> AppResult<(StatusCode, Json<InterviewQuestion>)> {
    let question = sqlx::query_as::<_, InterviewQuestion>(
        r#"INSERT INTO interview_questions (tenant_id, question, category, difficulty, suggested_followups, scoring_rubric, tags, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *"#,
    )
    .bind(claims.tid)
    .bind(&payload.question)
    .bind(payload.category.as_deref().unwrap_or("general"))
    .bind(payload.difficulty.as_deref().unwrap_or("medium"))
    .bind(payload.suggested_followups.as_deref().unwrap_or(&[]))
    .bind(payload.scoring_rubric)
    .bind(payload.tags.as_deref().unwrap_or(&[]))
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(question)))
}

pub async fn update_question(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateQuestionPayload>,
) -> AppResult<Json<InterviewQuestion>> {
    let question = sqlx::query_as::<_, InterviewQuestion>(
        r#"UPDATE interview_questions SET
            question = COALESCE($3, question),
            category = COALESCE($4, category),
            difficulty = COALESCE($5, difficulty),
            suggested_followups = COALESCE($6, suggested_followups),
            scoring_rubric = COALESCE($7, scoring_rubric),
            is_starred = COALESCE($8, is_starred),
            tags = COALESCE($9, tags),
            updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2
           RETURNING *"#,
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.question)
    .bind(payload.category)
    .bind(payload.difficulty)
    .bind(payload.suggested_followups)
    .bind(payload.scoring_rubric)
    .bind(payload.is_starred)
    .bind(payload.tags)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound)?;

    Ok(Json(question))
}

pub async fn delete_question(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query("DELETE FROM interview_questions WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_question_sets(
    State(state): State<AppState>,
    claims: Claims,
) -> AppResult<Json<Vec<QuestionSet>>> {
    let sets = sqlx::query_as::<_, QuestionSet>(
        "SELECT * FROM question_sets WHERE tenant_id = $1 ORDER BY name ASC",
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(sets))
}

pub async fn create_question_set(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<CreateQuestionSetPayload>,
) -> AppResult<(StatusCode, Json<QuestionSet>)> {
    let set = sqlx::query_as::<_, QuestionSet>(
        r#"INSERT INTO question_sets (tenant_id, name, description, interview_type, question_ids, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(claims.tid)
    .bind(&payload.name)
    .bind(payload.description)
    .bind(payload.interview_type)
    .bind(&payload.question_ids)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(set)))
}

pub async fn update_question_set(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateQuestionSetPayload>,
) -> AppResult<Json<QuestionSet>> {
    let set = sqlx::query_as::<_, QuestionSet>(
        r#"UPDATE question_sets SET
            name = COALESCE($3, name),
            description = COALESCE($4, description),
            interview_type = COALESCE($5, interview_type),
            question_ids = COALESCE($6, question_ids),
            updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2
           RETURNING *"#,
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.name)
    .bind(payload.description)
    .bind(payload.interview_type)
    .bind(payload.question_ids)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound)?;

    Ok(Json(set))
}

pub async fn delete_question_set(
    State(state): State<AppState>,
    claims: Claims,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query("DELETE FROM question_sets WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .execute(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(StatusCode::NO_CONTENT)
}
