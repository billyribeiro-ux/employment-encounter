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
use crate::expenses::model::*;
use crate::AppState;

pub async fn list_expenses(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListExpensesQuery>,
) -> AppResult<Json<PaginatedResponse<Expense>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.to_lowercase()));

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM expenses WHERE tenant_id = $1 AND (LOWER(COALESCE(description, '')) LIKE $2 OR LOWER(category) LIKE $2)",
        )
        .bind(claims.tid)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM expenses WHERE tenant_id = $1",
        )
        .bind(claims.tid)
        .fetch_one(&state.db)
        .await?
    };

    let expenses: Vec<Expense> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT id, tenant_id, client_id, user_id, category, description, amount_cents, date, receipt_document_id, is_reimbursable, status, created_at, updated_at FROM expenses WHERE tenant_id = $1 AND (LOWER(COALESCE(description, '')) LIKE $2 OR LOWER(category) LIKE $2) ORDER BY date DESC LIMIT $3 OFFSET $4",
        )
        .bind(claims.tid)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT id, tenant_id, client_id, user_id, category, description, amount_cents, date, receipt_document_id, is_reimbursable, status, created_at, updated_at FROM expenses WHERE tenant_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3",
        )
        .bind(claims.tid)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: expenses,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn create_expense(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateExpenseRequest>,
) -> AppResult<(StatusCode, Json<Expense>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let is_reimbursable = payload.is_reimbursable.unwrap_or(false);

    let expense: Expense = sqlx::query_as(
        "INSERT INTO expenses (tenant_id, client_id, user_id, category, description, amount_cents, date, receipt_document_id, is_reimbursable) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, tenant_id, client_id, user_id, category, description, amount_cents, date, receipt_document_id, is_reimbursable, status, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(payload.client_id)
    .bind(claims.sub)
    .bind(&payload.category)
    .bind(payload.description.as_deref())
    .bind(payload.amount_cents)
    .bind(payload.date)
    .bind(payload.receipt_document_id)
    .bind(is_reimbursable)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(expense)))
}

pub async fn delete_expense(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(expense_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "DELETE FROM expenses WHERE id = $1 AND tenant_id = $2",
    )
    .bind(expense_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Expense not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
