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
pub struct TalentPool {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub pool_type: String,
    pub member_count: Option<i64>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct PoolMember {
    pub id: String,
    pub candidate_name: String,
    pub candidate_email: Option<String>,
    pub source: Option<String>,
    pub engagement_score: i32,
    pub last_contacted_at: Option<chrono::DateTime<chrono::Utc>>,
    pub notes: Option<String>,
    pub added_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePool {
    pub name: String,
    pub description: Option<String>,
    pub pool_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddMember {
    pub candidate_name: String,
    pub candidate_email: Option<String>,
    pub source: Option<String>,
    pub notes: Option<String>,
}

pub async fn list_pools(
    claims: Claims,
    State(pool): State<PgPool>,
) -> Result<Json<Vec<TalentPool>>, AppError> {
    let pools = sqlx::query_as::<_, TalentPool>(
        "SELECT tp.id::text, tp.name, tp.description, tp.pool_type, tp.created_at,
                COUNT(tpm.id) as member_count
         FROM talent_pools tp
         LEFT JOIN talent_pool_members tpm ON tpm.pool_id = tp.id
         WHERE tp.tenant_id = $1
         GROUP BY tp.id ORDER BY tp.name"
    )
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(pools))
}

pub async fn create_pool(
    claims: Claims,
    State(pool): State<PgPool>,
    Json(body): Json<CreatePool>,
) -> Result<(StatusCode, Json<TalentPool>), AppError> {
    let tp = sqlx::query_as::<_, TalentPool>(
        "INSERT INTO talent_pools (tenant_id, name, description, pool_type, created_by)
         VALUES ($1, $2, $3, $4, $5::uuid)
         RETURNING id::text, name, description, pool_type, created_at, 0::bigint as member_count"
    )
    .bind(&claims.tid)
    .bind(&body.name)
    .bind(&body.description)
    .bind(body.pool_type.unwrap_or_else(|| "custom".to_string()))
    .bind(&claims.sub)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(tp)))
}

pub async fn list_members(
    claims: Claims,
    State(pool): State<PgPool>,
    Path(pool_id): Path<String>,
) -> Result<Json<Vec<PoolMember>>, AppError> {
    let members = sqlx::query_as::<_, PoolMember>(
        "SELECT tpm.id::text, tpm.candidate_name, tpm.candidate_email,
                tpm.source, tpm.engagement_score, tpm.last_contacted_at,
                tpm.notes, tpm.added_at
         FROM talent_pool_members tpm
         JOIN talent_pools tp ON tp.id = tpm.pool_id
         WHERE tpm.pool_id = $1::uuid AND tp.tenant_id = $2
         ORDER BY tpm.added_at DESC"
    )
    .bind(&pool_id)
    .bind(&claims.tid)
    .fetch_all(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(members))
}

pub async fn add_member(
    claims: Claims,
    State(pool): State<PgPool>,
    Path(pool_id): Path<String>,
    Json(body): Json<AddMember>,
) -> Result<(StatusCode, Json<PoolMember>), AppError> {
    let member = sqlx::query_as::<_, PoolMember>(
        "INSERT INTO talent_pool_members (pool_id, candidate_name, candidate_email, source, notes)
         SELECT $1::uuid, $2, $3, $4, $5
         FROM talent_pools WHERE id = $1::uuid AND tenant_id = $6
         RETURNING id::text, candidate_name, candidate_email, source, engagement_score,
                   last_contacted_at, notes, added_at"
    )
    .bind(&pool_id)
    .bind(&body.candidate_name)
    .bind(&body.candidate_email)
    .bind(&body.source)
    .bind(&body.notes)
    .bind(&claims.tid)
    .fetch_one(&pool)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(member)))
}
