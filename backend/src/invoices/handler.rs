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
use crate::invoices::model::*;
use crate::AppState;

pub async fn list_invoices(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListInvoicesQuery>,
) -> AppResult<Json<PaginatedResponse<Invoice>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.to_lowercase()));

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND (LOWER(COALESCE(invoice_number, '')) LIKE $2 OR LOWER(COALESCE(notes, '')) LIKE $2)",
        )
        .bind(claims.tid)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1",
        )
        .bind(claims.tid)
        .fetch_one(&state.db)
        .await?
    };

    let invoices: Vec<Invoice> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE tenant_id = $1 AND (LOWER(COALESCE(invoice_number, '')) LIKE $2 OR LOWER(COALESCE(notes, '')) LIKE $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4",
        )
        .bind(claims.tid)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
        )
        .bind(claims.tid)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: invoices,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn get_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
) -> AppResult<Json<Invoice>> {
    let invoice: Invoice = sqlx::query_as(
        "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE id = $1 AND tenant_id = $2",
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found".to_string()))?;

    Ok(Json(invoice))
}

pub async fn create_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateInvoiceRequest>,
) -> AppResult<(StatusCode, Json<Invoice>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    if payload.line_items.is_empty() {
        return Err(AppError::Validation(
            "At least one line item is required".to_string(),
        ));
    }

    let id = Uuid::new_v4();

    // Generate invoice number
    let (count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let invoice_number = format!("INV-{:05}", count + 1);

    // Calculate totals
    let subtotal_cents: i64 = payload
        .line_items
        .iter()
        .map(|li| (li.quantity * li.unit_price_cents as f64) as i64)
        .sum();
    let tax_cents: i64 = 0; // Tax calculation deferred to tax engine
    let total_cents = subtotal_cents + tax_cents;

    let invoice: Invoice = sqlx::query_as(
        "INSERT INTO invoices (id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, due_date, notes, created_by) VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10) RETURNING id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.client_id)
    .bind(&invoice_number)
    .bind(subtotal_cents)
    .bind(tax_cents)
    .bind(total_cents)
    .bind(payload.due_date)
    .bind(payload.notes.as_deref())
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // Insert line items
    for (i, li) in payload.line_items.iter().enumerate() {
        let line_total = (li.quantity * li.unit_price_cents as f64) as i64;
        sqlx::query(
            "INSERT INTO invoice_line_items (tenant_id, invoice_id, description, quantity, unit_price_cents, total_cents, time_entry_id, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        )
        .bind(claims.tid)
        .bind(id)
        .bind(&li.description)
        .bind(li.quantity)
        .bind(li.unit_price_cents)
        .bind(line_total)
        .bind(li.time_entry_id)
        .bind(i as i32)
        .execute(&state.db)
        .await?;

        // Mark time entry as invoiced if linked
        if let Some(te_id) = li.time_entry_id {
            sqlx::query(
                "UPDATE time_entries SET invoice_id = $1 WHERE id = $2 AND tenant_id = $3",
            )
            .bind(id)
            .bind(te_id)
            .bind(claims.tid)
            .execute(&state.db)
            .await?;
        }
    }

    Ok((StatusCode::CREATED, Json(invoice)))
}

pub async fn update_invoice_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
    Json(payload): Json<UpdateInvoiceStatusRequest>,
) -> AppResult<Json<Invoice>> {
    let valid_statuses = ["draft", "sent", "viewed", "paid", "overdue", "cancelled", "void"];
    if !valid_statuses.contains(&payload.status.as_str()) {
        return Err(AppError::Validation(format!(
            "Invalid status: {}. Must be one of: {}",
            payload.status,
            valid_statuses.join(", ")
        )));
    }

    let paid_date = if payload.status == "paid" {
        Some(chrono::Utc::now().date_naive())
    } else {
        None
    };

    let issued_date = if payload.status == "sent" {
        Some(chrono::Utc::now().date_naive())
    } else {
        None
    };

    let invoice: Invoice = sqlx::query_as(
        "UPDATE invoices SET status = $3, paid_date = COALESCE($4, paid_date), issued_date = COALESCE($5, issued_date), updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at",
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .bind(&payload.status)
    .bind(paid_date)
    .bind(issued_date)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found".to_string()))?;

    Ok(Json(invoice))
}

pub async fn delete_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    // Delete line items first
    sqlx::query("DELETE FROM invoice_line_items WHERE invoice_id = $1 AND tenant_id = $2")
        .bind(invoice_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    // Unlink time entries
    sqlx::query("UPDATE time_entries SET invoice_id = NULL WHERE invoice_id = $1 AND tenant_id = $2")
        .bind(invoice_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    let result = sqlx::query("DELETE FROM invoices WHERE id = $1 AND tenant_id = $2")
        .bind(invoice_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Invoice not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
