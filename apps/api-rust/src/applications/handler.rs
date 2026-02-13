use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::applications::model::*;
use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

const APPLICATION_COLUMNS: &str = "a.id, a.tenant_id, a.job_id, a.candidate_id, a.stage, \
    a.status, a.source, a.referrer_id, a.cover_letter, a.resume_document_id, a.match_score, \
    a.match_reasons, a.decision_notes, a.rejected_reason, a.offer_amount_cents, \
    a.offer_equity_pct, a.offer_extended_at, a.offer_accepted_at, a.offer_declined_at, \
    a.hired_at, a.created_at, a.updated_at";

const APPLICATION_WITH_DETAILS_COLUMNS: &str = "a.id, a.tenant_id, a.job_id, a.candidate_id, \
    a.stage, a.status, a.source, a.referrer_id, a.cover_letter, a.resume_document_id, \
    a.match_score, a.match_reasons, a.decision_notes, a.rejected_reason, a.offer_amount_cents, \
    a.offer_equity_pct, a.offer_extended_at, a.offer_accepted_at, a.offer_declined_at, \
    a.hired_at, a.created_at, a.updated_at, \
    j.title AS job_title, \
    cp.headline AS candidate_headline, \
    CONCAT(cp.first_name, ' ', cp.last_name) AS candidate_name";

const JOIN_CLAUSE: &str = "FROM applications a \
    INNER JOIN job_posts j ON j.id = a.job_id \
    LEFT JOIN candidate_profiles cp ON cp.id = a.candidate_id";

pub async fn list_applications(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListApplicationsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    // Build dynamic WHERE clause
    let mut conditions = vec!["a.tenant_id = $1".to_string()];
    let mut param_index = 2u32;

    if params.job_id.is_some() {
        conditions.push(format!("a.job_id = ${}", param_index));
        param_index += 1;
    }

    if params.candidate_id.is_some() {
        conditions.push(format!("a.candidate_id = ${}", param_index));
        param_index += 1;
    }

    if params.stage.is_some() {
        conditions.push(format!("a.stage = ${}", param_index));
        param_index += 1;
    }

    if params.status.is_some() {
        conditions.push(format!("a.status = ${}", param_index));
        param_index += 1;
    }

    let where_clause = conditions.join(" AND ");

    // Count query
    let count_sql = format!("SELECT COUNT(*) {} WHERE {}", JOIN_CLAUSE, where_clause);
    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql).bind(claims.tid);

    if let Some(ref job_id) = params.job_id {
        count_query = count_query.bind(job_id);
    }
    if let Some(ref candidate_id) = params.candidate_id {
        count_query = count_query.bind(candidate_id);
    }
    if let Some(ref stage) = params.stage {
        count_query = count_query.bind(stage);
    }
    if let Some(ref status) = params.status {
        count_query = count_query.bind(status);
    }

    let (total,) = count_query.fetch_one(&state.db).await?;

    // Data query
    let data_sql = format!(
        "SELECT {} {} WHERE {} ORDER BY a.created_at DESC LIMIT ${} OFFSET ${}",
        APPLICATION_WITH_DETAILS_COLUMNS,
        JOIN_CLAUSE,
        where_clause,
        param_index,
        param_index + 1
    );

    let mut data_query = sqlx::query_as::<_, ApplicationWithDetails>(&data_sql).bind(claims.tid);

    if let Some(ref job_id) = params.job_id {
        data_query = data_query.bind(job_id);
    }
    if let Some(ref candidate_id) = params.candidate_id {
        data_query = data_query.bind(candidate_id);
    }
    if let Some(ref stage) = params.stage {
        data_query = data_query.bind(stage);
    }
    if let Some(ref status) = params.status {
        data_query = data_query.bind(status);
    }

    let applications = data_query
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(serde_json::json!({
        "data": applications,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages
        }
    })))
}

pub async fn get_application(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(application_id): Path<Uuid>,
) -> AppResult<Json<ApplicationWithDetails>> {
    let sql = format!(
        "SELECT {} {} WHERE a.id = $1 AND a.tenant_id = $2",
        APPLICATION_WITH_DETAILS_COLUMNS, JOIN_CLAUSE
    );

    let application: ApplicationWithDetails = sqlx::query_as(&sql)
        .bind(application_id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    Ok(Json(application))
}

pub async fn create_application(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateApplicationRequest>,
) -> AppResult<(StatusCode, Json<Application>)> {
    let id = Uuid::new_v4();

    // Insert the application
    let application: Application = sqlx::query_as(
        "INSERT INTO applications (id, tenant_id, job_id, candidate_id, stage, status, source, \
         cover_letter, resume_document_id, match_reasons) \
         VALUES ($1, $2, $3, $4, 'applied', 'active', $5, $6, $7, '{}') \
         RETURNING id, tenant_id, job_id, candidate_id, stage, status, source, referrer_id, \
         cover_letter, resume_document_id, match_score, match_reasons, decision_notes, \
         rejected_reason, offer_amount_cents, offer_equity_pct, offer_extended_at, \
         offer_accepted_at, offer_declined_at, hired_at, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.job_id)
    .bind(payload.candidate_id)
    .bind(payload.source.as_deref())
    .bind(payload.cover_letter.as_deref())
    .bind(payload.resume_document_id)
    .fetch_one(&state.db)
    .await?;

    // Insert initial stage event
    sqlx::query(
        "INSERT INTO application_stage_events (tenant_id, application_id, to_stage, changed_by) \
         VALUES ($1, $2, 'applied', $3)",
    )
    .bind(claims.tid)
    .bind(id)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    // Increment application_count on the job post
    sqlx::query(
        "UPDATE job_posts SET application_count = application_count + 1, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(payload.job_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(application)))
}

pub async fn advance_stage(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(application_id): Path<Uuid>,
    Json(payload): Json<AdvanceStageRequest>,
) -> AppResult<Json<Application>> {
    // Get current application
    let current: Application = sqlx::query_as(&format!(
        "SELECT {} FROM applications a WHERE a.id = $1 AND a.tenant_id = $2",
        APPLICATION_COLUMNS
    ))
    .bind(application_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    let from_stage = current.stage.clone();

    // Calculate duration_hours from previous stage event
    let duration_hours: Option<i32> = sqlx::query_as::<_, (Option<i32>,)>(
        "SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::int / 3600 \
         FROM application_stage_events \
         WHERE application_id = $1 AND tenant_id = $2 \
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(application_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .and_then(|row| row.0);

    // Update the application stage
    let updated: Application = sqlx::query_as(&format!(
        "UPDATE applications SET stage = $3, updated_at = NOW() \
             WHERE id = $1 AND tenant_id = $2 \
             RETURNING {}",
        APPLICATION_COLUMNS.replace("a.", "")
    ))
    .bind(application_id)
    .bind(claims.tid)
    .bind(&payload.to_stage)
    .fetch_one(&state.db)
    .await?;

    // Insert stage event
    sqlx::query(
        "INSERT INTO application_stage_events \
         (tenant_id, application_id, from_stage, to_stage, changed_by, notes, duration_hours) \
         VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(claims.tid)
    .bind(application_id)
    .bind(&from_stage)
    .bind(&payload.to_stage)
    .bind(claims.sub)
    .bind(payload.notes.as_deref())
    .bind(duration_hours)
    .execute(&state.db)
    .await?;

    Ok(Json(updated))
}

pub async fn get_stage_history(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(application_id): Path<Uuid>,
) -> AppResult<Json<Vec<ApplicationStageEvent>>> {
    let events: Vec<ApplicationStageEvent> = sqlx::query_as(
        "SELECT id, tenant_id, application_id, from_stage, to_stage, changed_by, notes, \
         duration_hours, created_at \
         FROM application_stage_events \
         WHERE application_id = $1 AND tenant_id = $2 \
         ORDER BY created_at ASC",
    )
    .bind(application_id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(events))
}

pub async fn reject_application(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(application_id): Path<Uuid>,
    Json(payload): Json<AdvanceStageRequest>,
) -> AppResult<Json<Application>> {
    // Get current application
    let current: Application = sqlx::query_as(&format!(
        "SELECT {} FROM applications a WHERE a.id = $1 AND a.tenant_id = $2",
        APPLICATION_COLUMNS
    ))
    .bind(application_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    let from_stage = current.stage.clone();

    // Calculate duration_hours from previous stage event
    let duration_hours: Option<i32> = sqlx::query_as::<_, (Option<i32>,)>(
        "SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::int / 3600 \
         FROM application_stage_events \
         WHERE application_id = $1 AND tenant_id = $2 \
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(application_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .and_then(|row| row.0);

    // Update the application
    let updated: Application = sqlx::query_as(&format!(
        "UPDATE applications SET stage = 'rejected', status = 'rejected', \
             rejected_reason = $3, decision_notes = $4, updated_at = NOW() \
             WHERE id = $1 AND tenant_id = $2 \
             RETURNING {}",
        APPLICATION_COLUMNS.replace("a.", "")
    ))
    .bind(application_id)
    .bind(claims.tid)
    .bind(payload.notes.as_deref())
    .bind(payload.notes.as_deref())
    .fetch_one(&state.db)
    .await?;

    // Insert stage event
    sqlx::query(
        "INSERT INTO application_stage_events \
         (tenant_id, application_id, from_stage, to_stage, changed_by, notes, duration_hours) \
         VALUES ($1, $2, $3, 'rejected', $4, $5, $6)",
    )
    .bind(claims.tid)
    .bind(application_id)
    .bind(&from_stage)
    .bind(claims.sub)
    .bind(payload.notes.as_deref())
    .bind(duration_hours)
    .execute(&state.db)
    .await?;

    Ok(Json(updated))
}

pub async fn withdraw_application(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(application_id): Path<Uuid>,
) -> AppResult<Json<Application>> {
    // Verify application exists
    let (existing,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM applications WHERE id = $1 AND tenant_id = $2")
            .bind(application_id)
            .bind(claims.tid)
            .fetch_one(&state.db)
            .await?;

    if existing == 0 {
        return Err(AppError::NotFound("Application not found".to_string()));
    }

    let updated: Application = sqlx::query_as(&format!(
        "UPDATE applications SET stage = 'withdrawn', status = 'withdrawn', updated_at = NOW() \
             WHERE id = $1 AND tenant_id = $2 \
             RETURNING {}",
        APPLICATION_COLUMNS.replace("a.", "")
    ))
    .bind(application_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(updated))
}
