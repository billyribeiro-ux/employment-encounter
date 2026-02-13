use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::auth::Claims;
use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Referral {
    pub id: String,
    pub referrer_id: String,
    pub candidate_name: String,
    pub candidate_email: String,
    pub job_id: Option<String>,
    pub relationship: Option<String>,
    pub notes: Option<String>,
    pub status: String,
    pub reward_amount: Option<f64>,
    pub reward_status: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReferral {
    pub candidate_name: String,
    pub candidate_email: String,
    pub job_id: Option<String>,
    pub relationship: Option<String>,
    pub notes: Option<String>,
}

pub async fn list_referrals(
    claims: Claims,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<Referral>>, AppError> {
    let referrals = sqlx::query_as::<_, Referral>(
        "SELECT id::text, referrer_id::text, candidate_name, candidate_email,
                job_id::text, relationship, notes, status,
                reward_amount::float8 as reward_amount, reward_status, created_at
         FROM referrals WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100"
    )
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(referrals))
}

pub async fn create_referral(
    claims: Claims,
    State(pool): State<PgPool>,
    Json(body): Json<CreateReferral>,
) -> Result<(StatusCode, Json<Referral>), AppError> {
    let referral = sqlx::query_as::<_, Referral>(
        "INSERT INTO referrals (tenant_id, referrer_id, candidate_name, candidate_email, job_id, relationship, notes)
         VALUES ($1, $2::uuid, $3, $4, $5::uuid, $6, $7)
         RETURNING id::text, referrer_id::text, candidate_name, candidate_email,
                   job_id::text, relationship, notes, status,
                   reward_amount::float8 as reward_amount, reward_status, created_at"
    )
    .bind(&claims.tid)
    .bind(&claims.sub)
    .bind(&body.candidate_name)
    .bind(&body.candidate_email)
    .bind(&body.job_id)
    .bind(&body.relationship)
    .bind(&body.notes)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(referral)))
}
