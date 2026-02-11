use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::Claims;
use crate::clients::model::*;
use crate::error::{AppError, AppResult};
use crate::AppState;

pub async fn list_clients(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListClientsQuery>,
) -> AppResult<Json<PaginatedResponse<Client>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let status_filter = params.status.as_deref().unwrap_or("active");
    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.to_lowercase()));

    let sort_col = match params.sort.as_deref() {
        Some("name") => "name",
        Some("business_type") => "business_type",
        Some("status") => "status",
        Some("created_at") => "created_at",
        _ => "name",
    };
    let sort_dir = match params.order.as_deref() {
        Some("desc") => "DESC",
        _ => "ASC",
    };
    let order_clause = format!("ORDER BY {} {}", sort_col, sort_dir);

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM clients WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL AND (LOWER(name) LIKE $3 OR LOWER(COALESCE(business_type, '')) LIKE $3)",
        )
        .bind(claims.tid)
        .bind(status_filter)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM clients WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL",
        )
        .bind(claims.tid)
        .bind(status_filter)
        .fetch_one(&state.db)
        .await?
    };

    let clients: Vec<Client> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            &format!("SELECT id, tenant_id, name, business_type, fiscal_year_end, tax_id_last4, status, assigned_cpa_id, risk_score, engagement_score, metadata, created_at, updated_at FROM clients WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL AND (LOWER(name) LIKE $3 OR LOWER(COALESCE(business_type, '')) LIKE $3) {} LIMIT $4 OFFSET $5", order_clause),
        )
        .bind(claims.tid)
        .bind(status_filter)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            &format!("SELECT id, tenant_id, name, business_type, fiscal_year_end, tax_id_last4, status, assigned_cpa_id, risk_score, engagement_score, metadata, created_at, updated_at FROM clients WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL {} LIMIT $3 OFFSET $4", order_clause),
        )
        .bind(claims.tid)
        .bind(status_filter)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: clients,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn get_client(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
) -> AppResult<Json<Client>> {
    let client: Client = sqlx::query_as(
        "SELECT id, tenant_id, name, business_type, fiscal_year_end, tax_id_last4, status, assigned_cpa_id, risk_score, engagement_score, metadata, created_at, updated_at FROM clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(client_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Client not found".to_string()))?;

    Ok(Json(client))
}

pub async fn create_client(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateClientRequest>,
) -> AppResult<(StatusCode, Json<Client>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let id = Uuid::new_v4();
    let fiscal_year_end = payload.fiscal_year_end.unwrap_or_else(|| "Calendar".to_string());

    let client: Client = sqlx::query_as(
        "INSERT INTO clients (id, tenant_id, name, business_type, fiscal_year_end, assigned_cpa_id, status, metadata) VALUES ($1, $2, $3, $4, $5, $6, 'active', '{}') RETURNING id, tenant_id, name, business_type, fiscal_year_end, tax_id_last4, status, assigned_cpa_id, risk_score, engagement_score, metadata, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&payload.name)
    .bind(&payload.business_type)
    .bind(&fiscal_year_end)
    .bind(payload.assigned_cpa_id)
    .fetch_one(&state.db)
    .await?;

    // Insert contacts if provided
    if let Some(contacts) = payload.contacts {
        for contact in contacts {
            let is_primary = contact.is_primary.unwrap_or(false);
            sqlx::query(
                "INSERT INTO client_contacts (tenant_id, client_id, first_name, last_name, email, phone, is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            )
            .bind(claims.tid)
            .bind(id)
            .bind(&contact.first_name)
            .bind(&contact.last_name)
            .bind(contact.email.as_deref())
            .bind(contact.phone.as_deref())
            .bind(is_primary)
            .execute(&state.db)
            .await?;
        }
    }

    Ok((StatusCode::CREATED, Json(client)))
}

pub async fn update_client(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Json(payload): Json<UpdateClientRequest>,
) -> AppResult<Json<Client>> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    // Verify client exists
    let (existing,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM clients WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(client_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    if existing == 0 {
        return Err(AppError::NotFound("Client not found".to_string()));
    }

    let client: Client = sqlx::query_as(
        "UPDATE clients SET name = COALESCE($3, name), business_type = COALESCE($4, business_type), fiscal_year_end = COALESCE($5, fiscal_year_end), status = COALESCE($6, status), assigned_cpa_id = COALESCE($7, assigned_cpa_id), updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id, name, business_type, fiscal_year_end, tax_id_last4, status, assigned_cpa_id, risk_score, engagement_score, metadata, created_at, updated_at",
    )
    .bind(client_id)
    .bind(claims.tid)
    .bind(payload.name.as_deref())
    .bind(payload.business_type.as_deref())
    .bind(payload.fiscal_year_end.as_deref())
    .bind(payload.status.as_deref())
    .bind(payload.assigned_cpa_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(client))
}

// ── Client Sub-Resource Endpoints ──────────────────────────────────────

pub async fn list_client_documents(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Query(params): Query<SubResourceQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(25).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let docs: Vec<serde_json::Value> = sqlx::query_as::<_, (Uuid, String, Option<String>, String, i16, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, filename, category, verification_status, version, created_at \
         FROM documents WHERE tenant_id = $1 AND client_id = $2 AND deleted_at IS NULL \
         ORDER BY created_at DESC LIMIT $3 OFFSET $4"
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, filename, category, status, version, created_at)| {
        serde_json::json!({ "id": id, "filename": filename, "category": category, "verification_status": status, "version": version, "created_at": created_at })
    })
    .collect();

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM documents WHERE tenant_id = $1 AND client_id = $2 AND deleted_at IS NULL"
    )
    .bind(claims.tid)
    .bind(client_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "data": docs, "meta": { "page": page, "per_page": per_page, "total": total } })))
}

pub async fn list_client_time_entries(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Query(params): Query<SubResourceQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(25).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let entries: Vec<serde_json::Value> = sqlx::query_as::<_, (Uuid, String, String, i32, i64, bool, chrono::NaiveDate)>(
        "SELECT id, description, service_type, duration_minutes, rate_cents, is_billable, date \
         FROM time_entries WHERE tenant_id = $1 AND client_id = $2 \
         ORDER BY date DESC LIMIT $3 OFFSET $4"
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, desc, stype, dur, rate, billable, date)| {
        serde_json::json!({ "id": id, "description": desc, "service_type": stype, "duration_minutes": dur, "rate_cents": rate, "is_billable": billable, "date": date })
    })
    .collect();

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM time_entries WHERE tenant_id = $1 AND client_id = $2"
    )
    .bind(claims.tid)
    .bind(client_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "data": entries, "meta": { "page": page, "per_page": per_page, "total": total } })))
}

pub async fn list_client_invoices(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Query(params): Query<SubResourceQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(25).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let invoices: Vec<serde_json::Value> = sqlx::query_as::<_, (Uuid, String, String, i64, Option<chrono::NaiveDate>, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, invoice_number, status, total_cents, due_date, created_at \
         FROM invoices WHERE tenant_id = $1 AND client_id = $2 \
         ORDER BY created_at DESC LIMIT $3 OFFSET $4"
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, num, status, total, due, created)| {
        serde_json::json!({ "id": id, "invoice_number": num, "status": status, "total_cents": total, "due_date": due, "created_at": created })
    })
    .collect();

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND client_id = $2"
    )
    .bind(claims.tid)
    .bind(client_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "data": invoices, "meta": { "page": page, "per_page": per_page, "total": total } })))
}

pub async fn list_client_messages(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Query(params): Query<SubResourceQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let messages: Vec<serde_json::Value> = sqlx::query_as::<_, (Uuid, Uuid, String, bool, bool, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, sender_id, content, is_internal, is_read, created_at \
         FROM messages WHERE tenant_id = $1 AND client_id = $2 \
         ORDER BY created_at DESC LIMIT $3 OFFSET $4"
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, sender, content, internal, read, created)| {
        serde_json::json!({ "id": id, "sender_id": sender, "content": content, "is_internal": internal, "is_read": read, "created_at": created })
    })
    .collect();

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND client_id = $2"
    )
    .bind(claims.tid)
    .bind(client_id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "data": messages, "meta": { "page": page, "per_page": per_page, "total": total } })))
}

pub async fn list_client_deadlines(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let deadlines: Vec<serde_json::Value> = sqlx::query_as::<_, (Uuid, String, Option<String>, chrono::NaiveDate, String, Option<chrono::DateTime<chrono::Utc>>)>(
        "SELECT id, filing_type, description, due_date, status, completed_at \
         FROM compliance_deadlines WHERE tenant_id = $1 AND client_id = $2 \
         ORDER BY due_date ASC"
    )
    .bind(claims.tid)
    .bind(client_id)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, ftype, desc, due, status, completed)| {
        serde_json::json!({ "id": id, "filing_type": ftype, "description": desc, "due_date": due, "status": status, "completed_at": completed })
    })
    .collect();

    Ok(Json(serde_json::json!({ "data": deadlines })))
}

pub async fn get_client_timeline(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Query(params): Query<SubResourceQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let limit = params.per_page.unwrap_or(50).min(100);

    let events: Vec<serde_json::Value> = sqlx::query_as::<_, (Uuid, Option<Uuid>, String, String, Option<Uuid>, serde_json::Value, chrono::DateTime<chrono::Utc>)>(
        "SELECT id, user_id, action, resource_type, resource_id, details, created_at \
         FROM audit_logs WHERE tenant_id = $1 AND \
         (resource_id = $2 OR details->>'client_id' = $3) \
         ORDER BY created_at DESC LIMIT $4"
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(client_id.to_string())
    .bind(limit)
    .fetch_all(&state.db)
    .await?
    .into_iter()
    .map(|(id, user_id, action, rtype, rid, details, created)| {
        serde_json::json!({ "id": id, "user_id": user_id, "action": action, "resource_type": rtype, "resource_id": rid, "details": details, "created_at": created })
    })
    .collect();

    Ok(Json(serde_json::json!({ "data": events })))
}

pub async fn delete_client(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "UPDATE clients SET deleted_at = NOW(), status = 'archived' WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(client_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Client not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
