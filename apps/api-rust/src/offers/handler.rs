use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::offers::model::*;
use crate::AppState;

pub async fn list_offers(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListOffersQuery>,
) -> AppResult<Json<Vec<Offer>>> {
    let job_id_filter = params.job_id.map(|id| id.to_string()).unwrap_or_default();
    let status_filter = params.status.as_deref().unwrap_or("");

    let offers: Vec<Offer> = sqlx::query_as(
        "SELECT * FROM offers \
         WHERE tenant_id = $1 \
         AND ($2 = '' OR job_id::text = $2) \
         AND ($3 = '' OR status = $3) \
         ORDER BY created_at DESC",
    )
    .bind(claims.tid)
    .bind(&job_id_filter)
    .bind(status_filter)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(offers))
}

pub async fn create_offer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateOfferRequest>,
) -> AppResult<(StatusCode, Json<Offer>)> {
    if payload.title.is_empty() {
        return Err(AppError::Validation("title is required".to_string()));
    }

    // Verify application exists and belongs to tenant
    let _: (Uuid,) = sqlx::query_as("SELECT id FROM applications WHERE id = $1 AND tenant_id = $2")
        .bind(payload.application_id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    let salary_currency = payload.salary_currency.as_deref().unwrap_or("USD");

    let offer: Offer = sqlx::query_as(
        "INSERT INTO offers \
         (tenant_id, application_id, job_id, candidate_id, status, title, \
          base_salary_cents, salary_currency, equity_pct, signing_bonus_cents, \
          start_date, expiry_date, benefits_summary, custom_terms, created_by) \
         VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) \
         RETURNING *",
    )
    .bind(claims.tid)
    .bind(payload.application_id)
    .bind(payload.job_id)
    .bind(payload.candidate_id)
    .bind(&payload.title)
    .bind(payload.base_salary_cents)
    .bind(salary_currency)
    .bind(payload.equity_pct)
    .bind(payload.signing_bonus_cents)
    .bind(payload.start_date)
    .bind(payload.expiry_date)
    .bind(&payload.benefits_summary)
    .bind(&payload.custom_terms)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(offer)))
}

pub async fn get_offer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Offer>> {
    let offer: Offer = sqlx::query_as("SELECT * FROM offers WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Offer not found".to_string()))?;

    Ok(Json(offer))
}

pub async fn update_offer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateOfferRequest>,
) -> AppResult<Json<Offer>> {
    // Only allow updates to draft offers
    let existing: Offer = sqlx::query_as("SELECT * FROM offers WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Offer not found".to_string()))?;

    if existing.status != "draft" {
        return Err(AppError::Validation(format!(
            "Cannot update offer in '{}' status. Only draft offers can be updated.",
            existing.status
        )));
    }

    let offer: Offer = sqlx::query_as(
        "UPDATE offers SET \
         title = COALESCE($3, title), \
         base_salary_cents = COALESCE($4, base_salary_cents), \
         salary_currency = COALESCE($5, salary_currency), \
         equity_pct = COALESCE($6, equity_pct), \
         signing_bonus_cents = COALESCE($7, signing_bonus_cents), \
         start_date = COALESCE($8, start_date), \
         expiry_date = COALESCE($9, expiry_date), \
         benefits_summary = COALESCE($10, benefits_summary), \
         custom_terms = COALESCE($11, custom_terms), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING *",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&payload.title)
    .bind(payload.base_salary_cents)
    .bind(&payload.salary_currency)
    .bind(payload.equity_pct)
    .bind(payload.signing_bonus_cents)
    .bind(payload.start_date)
    .bind(payload.expiry_date)
    .bind(&payload.benefits_summary)
    .bind(&payload.custom_terms)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(offer))
}

pub async fn send_offer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Offer>> {
    let existing: Offer = sqlx::query_as("SELECT * FROM offers WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Offer not found".to_string()))?;

    if existing.status != "draft" {
        return Err(AppError::Validation(format!(
            "Cannot send offer in '{}' status. Only draft offers can be sent.",
            existing.status
        )));
    }

    let offer: Offer = sqlx::query_as(
        "UPDATE offers SET status = 'sent', sent_at = NOW(), updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING *",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(offer))
}

pub async fn accept_offer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Offer>> {
    let existing: Offer = sqlx::query_as("SELECT * FROM offers WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Offer not found".to_string()))?;

    if existing.status != "sent" {
        return Err(AppError::Validation(format!(
            "Cannot accept offer in '{}' status. Only sent offers can be accepted.",
            existing.status
        )));
    }

    let offer: Offer = sqlx::query_as(
        "UPDATE offers SET \
         status = 'accepted', \
         responded_at = NOW(), \
         accepted_at = NOW(), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING *",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(offer))
}

pub async fn decline_offer(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<DeclineOfferRequest>,
) -> AppResult<Json<Offer>> {
    let existing: Offer = sqlx::query_as("SELECT * FROM offers WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Offer not found".to_string()))?;

    if existing.status != "sent" {
        return Err(AppError::Validation(format!(
            "Cannot decline offer in '{}' status. Only sent offers can be declined.",
            existing.status
        )));
    }

    let offer: Offer = sqlx::query_as(
        "UPDATE offers SET \
         status = 'declined', \
         responded_at = NOW(), \
         declined_at = NOW(), \
         decline_reason = $3, \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING *",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&payload.reason)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(offer))
}
