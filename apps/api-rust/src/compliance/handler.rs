use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::Claims;
use crate::clients::model::{PaginatedResponse, PaginationMeta};
use crate::compliance::model::*;
use crate::error::{AppError, AppResult};
use crate::AppState;

pub async fn list_deadlines(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListDeadlinesQuery>,
) -> AppResult<Json<PaginatedResponse<ComplianceDeadline>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * per_page;

    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.to_lowercase()));

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM compliance_deadlines WHERE tenant_id = $1 AND (LOWER(filing_type) LIKE $2 OR LOWER(COALESCE(description, '')) LIKE $2 OR LOWER(COALESCE(notes, '')) LIKE $2)",
        )
        .bind(claims.tid)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM compliance_deadlines WHERE tenant_id = $1",
        )
        .bind(claims.tid)
        .fetch_one(&state.db)
        .await?
    };

    let deadlines: Vec<ComplianceDeadline> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT id, tenant_id, client_id, filing_type, description, due_date, extended_due_date, status, extension_filed, extension_filed_at, completed_at, assigned_to, notes, reminder_sent_30d, reminder_sent_14d, reminder_sent_7d, reminder_sent_1d, created_at, updated_at FROM compliance_deadlines WHERE tenant_id = $1 AND (LOWER(filing_type) LIKE $2 OR LOWER(COALESCE(description, '')) LIKE $2 OR LOWER(COALESCE(notes, '')) LIKE $2) ORDER BY due_date ASC LIMIT $3 OFFSET $4",
        )
        .bind(claims.tid)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT id, tenant_id, client_id, filing_type, description, due_date, extended_due_date, status, extension_filed, extension_filed_at, completed_at, assigned_to, notes, reminder_sent_30d, reminder_sent_14d, reminder_sent_7d, reminder_sent_1d, created_at, updated_at FROM compliance_deadlines WHERE tenant_id = $1 ORDER BY due_date ASC LIMIT $2 OFFSET $3",
        )
        .bind(claims.tid)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: deadlines,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn create_deadline(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateDeadlineRequest>,
) -> AppResult<(StatusCode, Json<ComplianceDeadline>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let deadline: ComplianceDeadline = sqlx::query_as(
        "INSERT INTO compliance_deadlines (tenant_id, client_id, filing_type, description, due_date, assigned_to, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, tenant_id, client_id, filing_type, description, due_date, extended_due_date, status, extension_filed, extension_filed_at, completed_at, assigned_to, notes, reminder_sent_30d, reminder_sent_14d, reminder_sent_7d, reminder_sent_1d, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(payload.client_id)
    .bind(&payload.filing_type)
    .bind(payload.description.as_deref())
    .bind(payload.due_date)
    .bind(payload.assigned_to)
    .bind(payload.notes.as_deref())
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(deadline)))
}

pub async fn update_deadline(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(deadline_id): Path<Uuid>,
    Json(payload): Json<UpdateDeadlineRequest>,
) -> AppResult<Json<ComplianceDeadline>> {
    let existing: ComplianceDeadline = sqlx::query_as(
        "SELECT id, tenant_id, client_id, filing_type, description, due_date, extended_due_date, status, extension_filed, extension_filed_at, completed_at, assigned_to, notes, reminder_sent_30d, reminder_sent_14d, reminder_sent_7d, reminder_sent_1d, created_at, updated_at FROM compliance_deadlines WHERE id = $1 AND tenant_id = $2",
    )
    .bind(deadline_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Deadline not found".to_string()))?;

    let status = payload.status.as_deref().unwrap_or(&existing.status);
    let extension_filed = payload.extension_filed.unwrap_or(existing.extension_filed);
    let extended_due_date = payload.extended_due_date.or(existing.extended_due_date);
    let assigned_to = payload.assigned_to.or(existing.assigned_to);
    let notes = payload.notes.as_deref().or(existing.notes.as_deref());

    let completed_at = if status == "completed" && existing.status != "completed" {
        Some(chrono::Utc::now())
    } else {
        existing.completed_at
    };

    let extension_filed_at = if extension_filed && !existing.extension_filed {
        Some(chrono::Utc::now())
    } else {
        existing.extension_filed_at
    };

    let updated: ComplianceDeadline = sqlx::query_as(
        "UPDATE compliance_deadlines SET status = $3, extension_filed = $4, extended_due_date = $5, assigned_to = $6, notes = $7, completed_at = $8, extension_filed_at = $9, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id, client_id, filing_type, description, due_date, extended_due_date, status, extension_filed, extension_filed_at, completed_at, assigned_to, notes, reminder_sent_30d, reminder_sent_14d, reminder_sent_7d, reminder_sent_1d, created_at, updated_at",
    )
    .bind(deadline_id)
    .bind(claims.tid)
    .bind(status)
    .bind(extension_filed)
    .bind(extended_due_date)
    .bind(assigned_to)
    .bind(notes)
    .bind(completed_at)
    .bind(extension_filed_at)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(updated))
}

pub async fn delete_deadline(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(deadline_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query("DELETE FROM compliance_deadlines WHERE id = $1 AND tenant_id = $2")
        .bind(deadline_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Deadline not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_consent_records(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (String, String, String, Option<String>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id::text, consent_type, status, purpose, created_at
         FROM consent_records WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(records) => {
            let data: Vec<serde_json::Value> = records.iter().map(|r| {
                serde_json::json!({
                    "id": r.0, "consent_type": r.1, "status": r.2,
                    "purpose": r.3, "created_at": r.4
                })
            }).collect();
            Ok(Json(serde_json::json!({ "data": data })))
        }
        Err(_) => Ok(Json(serde_json::json!({ "data": [] })))
    }
}

pub async fn list_deletion_requests(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (String, String, String, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id::text, requester_email, status, created_at
         FROM deletion_requests WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(records) => {
            let data: Vec<serde_json::Value> = records.iter().map(|r| {
                serde_json::json!({
                    "id": r.0, "requester_email": r.1, "status": r.2, "created_at": r.3
                })
            }).collect();
            Ok(Json(serde_json::json!({ "data": data })))
        }
        Err(_) => Ok(Json(serde_json::json!({ "data": [] })))
    }
}

pub async fn create_deletion_request(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(body): Json<serde_json::Value>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    let email = body.get("requester_email").and_then(|v| v.as_str()).unwrap_or("");
    let reason = body.get("reason").and_then(|v| v.as_str());

    let row = sqlx::query_as::<_, (String,)>(
        "INSERT INTO deletion_requests (tenant_id, requester_email, reason, requested_by)
         VALUES ($1, $2, $3, $4) RETURNING id::text"
    )
    .bind(claims.tid)
    .bind(email)
    .bind(reason)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await;

    match row {
        Ok((id,)) => Ok((StatusCode::CREATED, Json(serde_json::json!({ "id": id, "status": "pending" })))),
        Err(e) => Err(AppError::Database(e)),
    }
}

pub async fn list_retention_policies(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let rows = sqlx::query_as::<_, (String, String, i32, Option<String>, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id::text, data_type, retention_days, action, created_at
         FROM retention_policies WHERE tenant_id = $1 ORDER BY data_type"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(records) => {
            let data: Vec<serde_json::Value> = records.iter().map(|r| {
                serde_json::json!({
                    "id": r.0, "data_type": r.1, "retention_days": r.2,
                    "action": r.3, "created_at": r.4
                })
            }).collect();
            Ok(Json(serde_json::json!({ "data": data })))
        }
        Err(_) => Ok(Json(serde_json::json!({ "data": [] })))
    }
}
