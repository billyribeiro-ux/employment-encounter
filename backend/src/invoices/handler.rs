use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
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

    let sort_col = match params.sort.as_deref() {
        Some("invoice_number") => "invoice_number",
        Some("status") => "status",
        Some("total_cents") => "total_cents",
        Some("due_date") => "due_date",
        Some("created_at") => "created_at",
        _ => "created_at",
    };
    let sort_dir = match params.order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };
    let order_clause = format!("ORDER BY {} {}", sort_col, sort_dir);

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND deleted_at IS NULL AND (LOWER(COALESCE(invoice_number, '')) LIKE $2 OR LOWER(COALESCE(notes, '')) LIKE $2)",
        )
        .bind(claims.tid)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND deleted_at IS NULL",
        )
        .bind(claims.tid)
        .fetch_one(&state.db)
        .await?
    };

    let invoices: Vec<Invoice> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            &format!("SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE tenant_id = $1 AND deleted_at IS NULL AND (LOWER(COALESCE(invoice_number, '')) LIKE $2 OR LOWER(COALESCE(notes, '')) LIKE $2) {} LIMIT $3 OFFSET $4", order_clause),
        )
        .bind(claims.tid)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            &format!("SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE tenant_id = $1 AND deleted_at IS NULL {} LIMIT $2 OFFSET $3", order_clause),
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
        "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
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
    // Fetch current status
    let (current_status,): (String,) = sqlx::query_as(
        "SELECT status FROM invoices WHERE id = $1 AND tenant_id = $2"
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found".to_string()))?;

    // Validate state transitions
    let valid_transitions: &[(&str, &[&str])] = &[
        ("draft", &["sent", "cancelled"]),
        ("sent", &["viewed", "paid", "overdue", "cancelled"]),
        ("viewed", &["paid", "overdue", "cancelled"]),
        ("overdue", &["paid", "cancelled", "sent"]),
        ("cancelled", &["draft"]),
        ("void", &[]),
    ];

    let allowed = valid_transitions
        .iter()
        .find(|(from, _)| *from == current_status.as_str())
        .map(|(_, to)| to.contains(&payload.status.as_str()))
        .unwrap_or(false);

    if !allowed {
        return Err(AppError::Validation(format!(
            "Cannot transition invoice from '{}' to '{}'. Allowed transitions: {}",
            current_status,
            payload.status,
            valid_transitions.iter()
                .find(|(from, _)| *from == current_status.as_str())
                .map(|(_, to)| to.join(", "))
                .unwrap_or_else(|| "none".to_string())
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

pub async fn send_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
) -> AppResult<Json<Invoice>> {
    let invoice: Invoice = sqlx::query_as(
        "UPDATE invoices SET status = 'sent', sent_at = NOW(), issued_date = COALESCE(issued_date, CURRENT_DATE), updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 AND status = 'draft' \
         RETURNING id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, \
         amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, \
         stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at",
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found or not in draft status".to_string()))?;

    // In production: send email via Resend here
    // For now, just update status and return

    Ok(Json(invoice))
}

pub async fn record_payment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
    Json(payload): Json<RecordPaymentRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    // Verify invoice exists and is payable
    let invoice: Invoice = sqlx::query_as(
        "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, \
         amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, \
         stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at \
         FROM invoices WHERE id = $1 AND tenant_id = $2 AND status IN ('sent', 'viewed', 'overdue')"
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found or not payable".to_string()))?;

    // Record payment in payments table
    let payment_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO payments (id, tenant_id, invoice_id, amount_cents, method, stripe_payment_id, notes) \
         VALUES ($1, $2, $3, $4, $5, $6, $7)"
    )
    .bind(payment_id)
    .bind(claims.tid)
    .bind(invoice_id)
    .bind(payload.amount_cents)
    .bind(&payload.method)
    .bind(payload.stripe_payment_id.as_deref())
    .bind(payload.notes.as_deref())
    .execute(&state.db)
    .await?;

    // Update invoice amount_paid and status
    let new_paid = invoice.amount_paid_cents + payload.amount_cents;
    let new_status = if new_paid >= invoice.total_cents { "paid" } else { &invoice.status };
    let paid_date = if new_paid >= invoice.total_cents {
        Some(chrono::Utc::now().date_naive())
    } else {
        invoice.paid_date
    };

    sqlx::query(
        "UPDATE invoices SET amount_paid_cents = $3, status = $4, paid_date = $5, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2"
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .bind(new_paid)
    .bind(new_status)
    .bind(paid_date)
    .execute(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(serde_json::json!({
        "payment_id": payment_id,
        "invoice_id": invoice_id,
        "amount_cents": payload.amount_cents,
        "method": payload.method,
        "new_total_paid_cents": new_paid,
        "invoice_status": new_status,
    }))))
}

// ── Bulk Operations ──────────────────────────────────────────────────

pub async fn bulk_send_invoices(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BulkInvoiceIdsRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.ids.is_empty() {
        return Err(AppError::Validation("At least one ID is required".to_string()));
    }
    if payload.ids.len() > 100 {
        return Err(AppError::Validation("Maximum 100 IDs per bulk operation".to_string()));
    }

    let result = sqlx::query(
        "UPDATE invoices SET status = 'sent', sent_at = NOW(), issued_date = COALESCE(issued_date, CURRENT_DATE), updated_at = NOW() \
         WHERE tenant_id = $1 AND status = 'draft' AND id = ANY($2)",
    )
    .bind(claims.tid)
    .bind(&payload.ids)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "sent": result.rows_affected(),
        "requested": payload.ids.len(),
    })))
}

pub async fn bulk_delete_invoices(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BulkInvoiceIdsRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.ids.is_empty() {
        return Err(AppError::Validation("At least one ID is required".to_string()));
    }
    if payload.ids.len() > 100 {
        return Err(AppError::Validation("Maximum 100 IDs per bulk operation".to_string()));
    }

    // Soft-delete only draft invoices
    let result = sqlx::query(
        "UPDATE invoices SET deleted_at = NOW(), updated_at = NOW() \
         WHERE tenant_id = $1 AND status = 'draft' AND deleted_at IS NULL AND id = ANY($2)",
    )
    .bind(claims.tid)
    .bind(&payload.ids)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "deleted": result.rows_affected(),
        "requested": payload.ids.len(),
    })))
}

// ── Soft Delete: Restore & Trash ─────────────────────────────────────

pub async fn restore_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
) -> AppResult<Json<Invoice>> {
    let invoice: Invoice = sqlx::query_as(
        "UPDATE invoices SET deleted_at = NULL, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL \
         RETURNING id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, \
         amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, \
         stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at",
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found in trash".to_string()))?;

    Ok(Json(invoice))
}

pub async fn list_invoices_trash(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListInvoicesQuery>,
) -> AppResult<Json<PaginatedResponse<Invoice>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND deleted_at IS NOT NULL",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let invoices: Vec<Invoice> = sqlx::query_as(
        "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, \
         amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, \
         stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at \
         FROM invoices WHERE tenant_id = $1 AND deleted_at IS NOT NULL \
         ORDER BY deleted_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(claims.tid)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

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

// ── Recurring Invoices ───────────────────────────────────────────────

pub async fn create_recurring_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateRecurringInvoiceRequest>,
) -> AppResult<(StatusCode, Json<RecurringInvoice>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let valid_schedules = ["weekly", "monthly", "quarterly", "annually"];
    if !valid_schedules.contains(&payload.schedule.as_str()) {
        return Err(AppError::Validation(format!(
            "Invalid schedule '{}'. Must be one of: {}",
            payload.schedule,
            valid_schedules.join(", ")
        )));
    }

    if payload.line_items.is_empty() {
        return Err(AppError::Validation(
            "At least one line item is required".to_string(),
        ));
    }

    let subtotal_cents: i64 = payload
        .line_items
        .iter()
        .map(|li| (li.quantity * li.unit_price_cents as f64) as i64)
        .sum();
    let tax_cents: i64 = 0;
    let total_cents = subtotal_cents + tax_cents;

    let line_items_json = serde_json::to_value(&payload.line_items)
        .map_err(|e| AppError::Internal(format!("Failed to serialize line items: {}", e)))?;

    let id = Uuid::new_v4();
    let recurring: RecurringInvoice = sqlx::query_as(
        "INSERT INTO recurring_invoices (id, tenant_id, client_id, schedule, next_issue_date, notes, line_items, subtotal_cents, tax_cents, total_cents, created_by) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) \
         RETURNING id, tenant_id, client_id, schedule, next_issue_date, notes, line_items, subtotal_cents, tax_cents, total_cents, currency, is_active, last_issued_at, invoices_generated, created_by, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.client_id)
    .bind(&payload.schedule)
    .bind(payload.next_issue_date)
    .bind(payload.notes.as_deref())
    .bind(&line_items_json)
    .bind(subtotal_cents)
    .bind(tax_cents)
    .bind(total_cents)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(recurring)))
}

pub async fn list_recurring_invoices(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListRecurringInvoicesQuery>,
) -> AppResult<Json<PaginatedResponse<RecurringInvoice>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM recurring_invoices WHERE tenant_id = $1 AND deleted_at IS NULL",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let recurring: Vec<RecurringInvoice> = sqlx::query_as(
        "SELECT id, tenant_id, client_id, schedule, next_issue_date, notes, line_items, subtotal_cents, tax_cents, total_cents, currency, is_active, last_issued_at, invoices_generated, created_by, created_at, updated_at \
         FROM recurring_invoices WHERE tenant_id = $1 AND deleted_at IS NULL \
         ORDER BY next_issue_date ASC LIMIT $2 OFFSET $3",
    )
    .bind(claims.tid)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: recurring,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn delete_recurring_invoice(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(recurring_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "UPDATE recurring_invoices SET deleted_at = NOW(), is_active = FALSE, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(recurring_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Recurring invoice not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, sqlx::FromRow)]
struct InvoiceLineItem {
    description: String,
    quantity: f64,
    unit_price_cents: i64,
    total_cents: i64,
}

/// Generate an HTML invoice and return it as a downloadable HTML file.
/// In production, pipe this through a headless browser or wkhtmltopdf for real PDF.
pub async fn generate_invoice_pdf(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(invoice_id): Path<Uuid>,
) -> Result<Response, AppError> {
    let invoice: Invoice = sqlx::query_as(
        "SELECT id, tenant_id, client_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, amount_paid_cents, currency, due_date, issued_date, paid_date, notes, stripe_payment_intent_id, stripe_invoice_id, pdf_s3_key, created_by, created_at, updated_at FROM invoices WHERE id = $1 AND tenant_id = $2",
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found".to_string()))?;

    let line_items: Vec<InvoiceLineItem> = sqlx::query_as(
        "SELECT description, quantity, unit_price_cents, total_cents FROM invoice_line_items WHERE invoice_id = $1 AND tenant_id = $2 ORDER BY sort_order",
    )
    .bind(invoice_id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    // Get client name
    let client_name: String = sqlx::query_scalar(
        "SELECT name FROM clients WHERE id = $1 AND tenant_id = $2",
    )
    .bind(invoice.client_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .unwrap_or_else(|| "Unknown Client".to_string());

    // Get firm name
    let firm_name: String = sqlx::query_scalar(
        "SELECT name FROM tenants WHERE id = $1",
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .unwrap_or_else(|| "CPA Firm".to_string());

    let fmt_cents = |c: i64| -> String {
        format!("${:.2}", c as f64 / 100.0)
    };

    let due_date_str = invoice
        .due_date
        .map(|d| d.format("%B %d, %Y").to_string())
        .unwrap_or_else(|| "N/A".to_string());

    let issued_date_str = invoice
        .issued_date
        .map(|d| d.format("%B %d, %Y").to_string())
        .unwrap_or_else(|| invoice.created_at.format("%B %d, %Y").to_string());

    let mut rows_html = String::new();
    for li in &line_items {
        rows_html.push_str(&format!(
            "<tr><td style='padding:8px;border-bottom:1px solid #eee'>{}</td>\
             <td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>{:.2}</td>\
             <td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>{}</td>\
             <td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>{}</td></tr>",
            li.description,
            li.quantity,
            fmt_cents(li.unit_price_cents),
            fmt_cents(li.total_cents),
        ));
    }

    let html = format!(
        r#"<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice {inv_num}</title>
<style>body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:40px;color:#333}}
.header{{display:flex;justify-content:space-between;margin-bottom:40px}}
.firm-name{{font-size:24px;font-weight:700;color:#1a1a1a}}
.invoice-title{{font-size:28px;font-weight:700;color:#2563eb;text-align:right}}
.meta{{display:flex;justify-content:space-between;margin-bottom:30px}}
.meta-block{{line-height:1.6}}
.meta-label{{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.5px}}
table{{width:100%;border-collapse:collapse;margin-bottom:30px}}
th{{text-align:left;padding:10px 8px;border-bottom:2px solid #333;font-size:13px;text-transform:uppercase;letter-spacing:0.5px}}
.totals{{text-align:right;margin-top:20px}}
.totals td{{padding:4px 8px}}
.total-row{{font-size:18px;font-weight:700;color:#2563eb}}
.status{{display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;text-transform:uppercase}}
.status-paid{{background:#dcfce7;color:#166534}}
.status-sent{{background:#dbeafe;color:#1e40af}}
.status-draft{{background:#f3f4f6;color:#374151}}
.status-overdue{{background:#fee2e2;color:#991b1b}}
.notes{{margin-top:30px;padding:16px;background:#f9fafb;border-radius:8px;font-size:14px}}
</style></head><body>
<div class="header">
  <div class="firm-name">{firm}</div>
  <div class="invoice-title">INVOICE</div>
</div>
<div class="meta">
  <div class="meta-block">
    <div class="meta-label">Bill To</div>
    <div style="font-size:16px;font-weight:600">{client}</div>
  </div>
  <div class="meta-block" style="text-align:right">
    <div><span class="meta-label">Invoice #:</span> {inv_num}</div>
    <div><span class="meta-label">Issued:</span> {issued}</div>
    <div><span class="meta-label">Due:</span> {due}</div>
    <div><span class="meta-label">Status:</span> <span class="status status-{status_lower}">{status}</span></div>
  </div>
</div>
<table>
  <thead><tr>
    <th>Description</th>
    <th style="text-align:right">Qty</th>
    <th style="text-align:right">Unit Price</th>
    <th style="text-align:right">Amount</th>
  </tr></thead>
  <tbody>{rows}</tbody>
</table>
<table class="totals" style="width:300px;margin-left:auto">
  <tr><td>Subtotal</td><td>{subtotal}</td></tr>
  <tr><td>Tax</td><td>{tax}</td></tr>
  <tr class="total-row"><td style="border-top:2px solid #333;padding-top:8px">Total</td><td style="border-top:2px solid #333;padding-top:8px">{total}</td></tr>
  <tr><td>Amount Paid</td><td>{paid}</td></tr>
  <tr style="font-weight:600"><td>Balance Due</td><td>{balance}</td></tr>
</table>
{notes_section}
</body></html>"#,
        firm = firm_name,
        client = client_name,
        inv_num = invoice.invoice_number,
        issued = issued_date_str,
        due = due_date_str,
        status = invoice.status,
        status_lower = invoice.status.to_lowercase(),
        rows = rows_html,
        subtotal = fmt_cents(invoice.subtotal_cents),
        tax = fmt_cents(invoice.tax_cents),
        total = fmt_cents(invoice.total_cents),
        paid = fmt_cents(invoice.amount_paid_cents),
        balance = fmt_cents(invoice.total_cents - invoice.amount_paid_cents),
        notes_section = invoice.notes.as_ref().map(|n| format!("<div class='notes'><strong>Notes:</strong> {}</div>", n)).unwrap_or_default(),
    );

    Ok((
        StatusCode::OK,
        [
            (axum::http::header::CONTENT_TYPE, "text/html; charset=utf-8"),
            (
                axum::http::header::CONTENT_DISPOSITION,
                &format!("inline; filename=\"{}.html\"", invoice.invoice_number),
            ),
        ],
        html,
    )
        .into_response())
}
