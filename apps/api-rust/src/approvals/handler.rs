use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use crate::AppState;

use crate::auth::Claims;
use crate::errors::AppError;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ApprovalRequest {
    pub id: String,
    pub request_type: String,
    pub title: String,
    pub description: Option<String>,
    pub requester_id: String,
    pub current_step: i32,
    pub status: String,
    pub metadata: serde_json::Value,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct ListParams {
    pub status: Option<String>,
    pub request_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApprovalRequest {
    pub request_type: String,
    pub title: String,
    pub description: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub workflow_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DecisionBody {
    pub decision: String, // approved, rejected
    pub comment: Option<String>,
}

pub async fn list_requests(
    claims: Claims,
    State(state): State<AppState>,
    Query(params): Query<ListParams>,
) -> Result<Json<Vec<ApprovalRequest>>, AppError> {
    let mut query = String::from(
        "SELECT id::text, request_type, title, description, requester_id::text,
                current_step, status, metadata, created_at
         FROM approval_requests WHERE tenant_id = $1"
    );

    if let Some(ref status) = params.status {
        query.push_str(&format!(" AND status = '{}'", status));
    }
    if let Some(ref rt) = params.request_type {
        query.push_str(&format!(" AND request_type = '{}'", rt));
    }
    query.push_str(" ORDER BY created_at DESC LIMIT 50");

    let requests = sqlx::query_as::<_, ApprovalRequest>(&query)
        .bind(&claims.tid)
        .fetch_all(&state.db)
        .await
        .map_err(AppError::Database)?;

    Ok(Json(requests))
}

pub async fn create_request(
    claims: Claims,
    State(state): State<AppState>,
    Json(body): Json<CreateApprovalRequest>,
) -> Result<(StatusCode, Json<ApprovalRequest>), AppError> {
    let request = sqlx::query_as::<_, ApprovalRequest>(
        "INSERT INTO approval_requests (tenant_id, request_type, title, description, requester_id, metadata, workflow_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7::uuid)
         RETURNING id::text, request_type, title, description, requester_id::text,
                   current_step, status, metadata, created_at"
    )
    .bind(&claims.tid)
    .bind(&body.request_type)
    .bind(&body.title)
    .bind(&body.description)
    .bind(&claims.sub)
    .bind(body.metadata.unwrap_or(serde_json::json!({})))
    .bind(&body.workflow_id)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok((StatusCode::CREATED, Json(request)))
}

pub async fn decide_request(
    claims: Claims,
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<DecisionBody>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Record the decision
    sqlx::query(
        "INSERT INTO approval_decisions (request_id, approver_id, step_number, decision, comment)
         SELECT $1::uuid, $2::uuid, current_step, $3, $4
         FROM approval_requests WHERE id = $1::uuid AND tenant_id = $5"
    )
    .bind(&id)
    .bind(&claims.sub)
    .bind(&body.decision)
    .bind(&body.comment)
    .bind(&claims.tid)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    // Update the request status
    let new_status = if body.decision == "rejected" {
        "rejected"
    } else {
        "approved"
    };

    sqlx::query(
        "UPDATE approval_requests SET status = $1, updated_at = now()
         WHERE id = $2::uuid AND tenant_id = $3"
    )
    .bind(new_status)
    .bind(&id)
    .bind(&claims.tid)
    .execute(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(serde_json::json!({ "status": new_status })))
}
