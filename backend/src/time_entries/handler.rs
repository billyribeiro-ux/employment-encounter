use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::Claims;
use crate::clients::model::{PaginatedResponse, PaginationMeta};
use crate::error::{AppError, AppResult};
use crate::time_entries::model::*;
use crate::AppState;

pub async fn list_time_entries(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListTimeEntriesQuery>,
) -> AppResult<Json<PaginatedResponse<TimeEntry>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.to_lowercase()));

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM time_entries WHERE tenant_id = $1 AND LOWER(COALESCE(description, '')) LIKE $2",
        )
        .bind(claims.tid)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM time_entries WHERE tenant_id = $1",
        )
        .bind(claims.tid)
        .fetch_one(&state.db)
        .await?
    };

    let entries: Vec<TimeEntry> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT id, tenant_id, user_id, client_id, description, duration_minutes, rate_cents, is_billable, is_running, started_at, stopped_at, date, invoice_id, created_at, updated_at FROM time_entries WHERE tenant_id = $1 AND LOWER(COALESCE(description, '')) LIKE $2 ORDER BY date DESC, created_at DESC LIMIT $3 OFFSET $4",
        )
        .bind(claims.tid)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT id, tenant_id, user_id, client_id, description, duration_minutes, rate_cents, is_billable, is_running, started_at, stopped_at, date, invoice_id, created_at, updated_at FROM time_entries WHERE tenant_id = $1 ORDER BY date DESC, created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(claims.tid)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: entries,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn create_time_entry(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTimeEntryRequest>,
) -> AppResult<(StatusCode, Json<TimeEntry>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let id = Uuid::new_v4();
    let description = payload.description.unwrap_or_default();
    let is_billable = payload.is_billable.unwrap_or(true);
    let date = payload.date.unwrap_or_else(|| chrono::Utc::now().date_naive());
    let start_timer = payload.start_timer.unwrap_or(false);

    let (is_running, started_at, duration) = if start_timer {
        (true, Some(chrono::Utc::now()), 0)
    } else {
        (false, None, payload.duration_minutes.unwrap_or(0))
    };

    let rate_cents = payload.rate_cents.unwrap_or(0);

    let entry: TimeEntry = sqlx::query_as(
        "INSERT INTO time_entries (id, tenant_id, user_id, client_id, description, duration_minutes, rate_cents, is_billable, is_running, started_at, date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, tenant_id, user_id, client_id, description, duration_minutes, rate_cents, is_billable, is_running, started_at, stopped_at, date, invoice_id, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(payload.client_id)
    .bind(&description)
    .bind(duration)
    .bind(rate_cents)
    .bind(is_billable)
    .bind(is_running)
    .bind(started_at)
    .bind(date)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(entry)))
}

pub async fn stop_timer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(entry_id): Path<Uuid>,
) -> AppResult<Json<TimeEntry>> {
    let existing: TimeEntry = sqlx::query_as(
        "SELECT id, tenant_id, user_id, client_id, description, duration_minutes, rate_cents, is_billable, is_running, started_at, stopped_at, date, invoice_id, created_at, updated_at FROM time_entries WHERE id = $1 AND tenant_id = $2 AND is_running = TRUE",
    )
    .bind(entry_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Running timer not found".to_string()))?;

    let now = chrono::Utc::now();
    let elapsed_minutes = if let Some(started) = existing.started_at {
        ((now - started).num_seconds() as f64 / 60.0).ceil() as i32
    } else {
        0
    };

    let entry: TimeEntry = sqlx::query_as(
        "UPDATE time_entries SET is_running = FALSE, stopped_at = $3, duration_minutes = $4, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id, user_id, client_id, description, duration_minutes, rate_cents, is_billable, is_running, started_at, stopped_at, date, invoice_id, created_at, updated_at",
    )
    .bind(entry_id)
    .bind(claims.tid)
    .bind(now)
    .bind(elapsed_minutes)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(entry))
}

pub async fn delete_time_entry(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(entry_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "DELETE FROM time_entries WHERE id = $1 AND tenant_id = $2 AND invoice_id IS NULL",
    )
    .bind(entry_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(
            "Time entry not found or already invoiced".to_string(),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
