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

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM clients WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL",
    )
    .bind(claims.tid)
    .bind(status_filter)
    .fetch_one(&state.db)
    .await?;

    let clients: Vec<Client> = sqlx::query_as(
        "SELECT id, tenant_id, name, business_type, fiscal_year_end, tax_id_last4, status, assigned_cpa_id, risk_score, engagement_score, metadata, created_at, updated_at FROM clients WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL ORDER BY name ASC LIMIT $3 OFFSET $4",
    )
    .bind(claims.tid)
    .bind(status_filter)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

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
