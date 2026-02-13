use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::jobs::model::*;
use crate::AppState;

pub async fn list_jobs(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListJobsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let search_pattern = params
        .search
        .as_ref()
        .map(|s| format!("%{}%", s.to_lowercase()));

    // Build dynamic WHERE clause
    let mut conditions = vec!["tenant_id = $1".to_string()];
    let mut param_index = 2u32;

    if params.status.is_some() {
        conditions.push(format!("status = ${}", param_index));
        param_index += 1;
    }

    if params.work_mode.is_some() {
        conditions.push(format!("work_mode = ${}", param_index));
        param_index += 1;
    }

    if params.employment_type.is_some() {
        conditions.push(format!("employment_type = ${}", param_index));
        param_index += 1;
    }

    if params.seniority_level.is_some() {
        conditions.push(format!("seniority_level = ${}", param_index));
        param_index += 1;
    }

    if params.is_urgent.is_some() {
        conditions.push(format!("is_urgent = ${}", param_index));
        param_index += 1;
    }

    if search_pattern.is_some() {
        conditions.push(format!(
            "(LOWER(title) LIKE ${p} OR LOWER(COALESCE(description, '')) LIKE ${p})",
            p = param_index
        ));
        param_index += 1;
    }

    let where_clause = conditions.join(" AND ");

    // Count query
    let count_sql = format!("SELECT COUNT(*) FROM job_posts WHERE {}", where_clause);
    let mut count_query = sqlx::query_as::<_, (i64,)>(&count_sql).bind(claims.tid);

    if let Some(ref status) = params.status {
        count_query = count_query.bind(status);
    }
    if let Some(ref work_mode) = params.work_mode {
        count_query = count_query.bind(work_mode);
    }
    if let Some(ref employment_type) = params.employment_type {
        count_query = count_query.bind(employment_type);
    }
    if let Some(ref seniority_level) = params.seniority_level {
        count_query = count_query.bind(seniority_level);
    }
    if let Some(ref is_urgent) = params.is_urgent {
        count_query = count_query.bind(is_urgent);
    }
    if let Some(ref pattern) = search_pattern {
        count_query = count_query.bind(pattern);
    }

    let (total,) = count_query.fetch_one(&state.db).await?;

    // Data query
    let data_sql = format!(
        "SELECT id, tenant_id, organization_id, company_id, title, department, description, \
         requirements, responsibilities, benefits, location_city, location_state, location_country, \
         work_mode, employment_type, seniority_level, salary_min_cents, salary_max_cents, \
         salary_currency, equity_offered, status, visibility, posted_at, closes_at, filled_at, \
         hiring_manager_id, recruiter_id, max_applications, application_count, is_urgent, \
         skills_required, skills_preferred, metadata, created_at, updated_at \
         FROM job_posts WHERE {} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, param_index, param_index + 1
    );

    let mut data_query = sqlx::query_as::<_, JobPost>(&data_sql).bind(claims.tid);

    if let Some(ref status) = params.status {
        data_query = data_query.bind(status);
    }
    if let Some(ref work_mode) = params.work_mode {
        data_query = data_query.bind(work_mode);
    }
    if let Some(ref employment_type) = params.employment_type {
        data_query = data_query.bind(employment_type);
    }
    if let Some(ref seniority_level) = params.seniority_level {
        data_query = data_query.bind(seniority_level);
    }
    if let Some(ref is_urgent) = params.is_urgent {
        data_query = data_query.bind(is_urgent);
    }
    if let Some(ref pattern) = search_pattern {
        data_query = data_query.bind(pattern);
    }

    let jobs = data_query
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(serde_json::json!({
        "data": jobs,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": total_pages
        }
    })))
}

pub async fn get_job(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(job_id): Path<Uuid>,
) -> AppResult<Json<JobPost>> {
    let job: JobPost = sqlx::query_as(
        "SELECT id, tenant_id, organization_id, company_id, title, department, description, \
         requirements, responsibilities, benefits, location_city, location_state, location_country, \
         work_mode, employment_type, seniority_level, salary_min_cents, salary_max_cents, \
         salary_currency, equity_offered, status, visibility, posted_at, closes_at, filled_at, \
         hiring_manager_id, recruiter_id, max_applications, application_count, is_urgent, \
         skills_required, skills_preferred, metadata, created_at, updated_at \
         FROM job_posts WHERE id = $1 AND tenant_id = $2",
    )
    .bind(job_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    Ok(Json(job))
}

pub async fn create_job(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateJobRequest>,
) -> AppResult<(StatusCode, Json<JobPost>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let id = Uuid::new_v4();
    let work_mode = payload.work_mode.as_deref().unwrap_or("onsite");
    let employment_type = payload.employment_type.as_deref().unwrap_or("full_time");
    let equity_offered = payload.equity_offered.unwrap_or(false);
    let visibility = payload.visibility.as_deref().unwrap_or("internal");
    let is_urgent = payload.is_urgent.unwrap_or(false);
    let skills_required = payload.skills_required.as_deref().unwrap_or(&[]);
    let skills_preferred = payload.skills_preferred.as_deref().unwrap_or(&[]);

    let job: JobPost = sqlx::query_as(
        "INSERT INTO job_posts (id, tenant_id, title, department, description, requirements, \
         responsibilities, benefits, location_city, location_state, location_country, work_mode, \
         employment_type, seniority_level, salary_min_cents, salary_max_cents, equity_offered, \
         status, visibility, hiring_manager_id, recruiter_id, max_applications, is_urgent, \
         skills_required, skills_preferred, metadata) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, \
         'draft', $18, $19, $20, $21, $22, $23, $24, '{}') \
         RETURNING id, tenant_id, organization_id, company_id, title, department, description, \
         requirements, responsibilities, benefits, location_city, location_state, location_country, \
         work_mode, employment_type, seniority_level, salary_min_cents, salary_max_cents, \
         salary_currency, equity_offered, status, visibility, posted_at, closes_at, filled_at, \
         hiring_manager_id, recruiter_id, max_applications, application_count, is_urgent, \
         skills_required, skills_preferred, metadata, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&payload.title)
    .bind(payload.department.as_deref())
    .bind(payload.description.as_deref())
    .bind(payload.requirements.as_deref())
    .bind(payload.responsibilities.as_deref())
    .bind(payload.benefits.as_deref())
    .bind(payload.location_city.as_deref())
    .bind(payload.location_state.as_deref())
    .bind(payload.location_country.as_deref())
    .bind(work_mode)
    .bind(employment_type)
    .bind(payload.seniority_level.as_deref())
    .bind(payload.salary_min_cents)
    .bind(payload.salary_max_cents)
    .bind(equity_offered)
    .bind(visibility)
    .bind(payload.hiring_manager_id)
    .bind(payload.recruiter_id)
    .bind(payload.max_applications)
    .bind(is_urgent)
    .bind(skills_required)
    .bind(skills_preferred)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(job)))
}

pub async fn update_job(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(job_id): Path<Uuid>,
    Json(payload): Json<UpdateJobRequest>,
) -> AppResult<Json<JobPost>> {
    // Verify job exists
    let (existing,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM job_posts WHERE id = $1 AND tenant_id = $2")
            .bind(job_id)
            .bind(claims.tid)
            .fetch_one(&state.db)
            .await?;

    if existing == 0 {
        return Err(AppError::NotFound("Job not found".to_string()));
    }

    let job: JobPost = sqlx::query_as(
        "UPDATE job_posts SET \
         title = COALESCE($3, title), \
         department = COALESCE($4, department), \
         description = COALESCE($5, description), \
         requirements = COALESCE($6, requirements), \
         responsibilities = COALESCE($7, responsibilities), \
         benefits = COALESCE($8, benefits), \
         location_city = COALESCE($9, location_city), \
         location_state = COALESCE($10, location_state), \
         location_country = COALESCE($11, location_country), \
         work_mode = COALESCE($12, work_mode), \
         employment_type = COALESCE($13, employment_type), \
         seniority_level = COALESCE($14, seniority_level), \
         salary_min_cents = COALESCE($15, salary_min_cents), \
         salary_max_cents = COALESCE($16, salary_max_cents), \
         equity_offered = COALESCE($17, equity_offered), \
         visibility = COALESCE($18, visibility), \
         hiring_manager_id = COALESCE($19, hiring_manager_id), \
         recruiter_id = COALESCE($20, recruiter_id), \
         max_applications = COALESCE($21, max_applications), \
         is_urgent = COALESCE($22, is_urgent), \
         skills_required = COALESCE($23, skills_required), \
         skills_preferred = COALESCE($24, skills_preferred), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, organization_id, company_id, title, department, description, \
         requirements, responsibilities, benefits, location_city, location_state, location_country, \
         work_mode, employment_type, seniority_level, salary_min_cents, salary_max_cents, \
         salary_currency, equity_offered, status, visibility, posted_at, closes_at, filled_at, \
         hiring_manager_id, recruiter_id, max_applications, application_count, is_urgent, \
         skills_required, skills_preferred, metadata, created_at, updated_at",
    )
    .bind(job_id)
    .bind(claims.tid)
    .bind(payload.title.as_deref())
    .bind(payload.department.as_deref())
    .bind(payload.description.as_deref())
    .bind(payload.requirements.as_deref())
    .bind(payload.responsibilities.as_deref())
    .bind(payload.benefits.as_deref())
    .bind(payload.location_city.as_deref())
    .bind(payload.location_state.as_deref())
    .bind(payload.location_country.as_deref())
    .bind(payload.work_mode.as_deref())
    .bind(payload.employment_type.as_deref())
    .bind(payload.seniority_level.as_deref())
    .bind(payload.salary_min_cents)
    .bind(payload.salary_max_cents)
    .bind(payload.equity_offered)
    .bind(payload.visibility.as_deref())
    .bind(payload.hiring_manager_id)
    .bind(payload.recruiter_id)
    .bind(payload.max_applications)
    .bind(payload.is_urgent)
    .bind(payload.skills_required.as_deref())
    .bind(payload.skills_preferred.as_deref())
    .fetch_one(&state.db)
    .await?;

    Ok(Json(job))
}

pub async fn delete_job(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(job_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query("DELETE FROM job_posts WHERE id = $1 AND tenant_id = $2")
        .bind(job_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Job not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn publish_job(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(job_id): Path<Uuid>,
) -> AppResult<Json<JobPost>> {
    // Verify job exists and is in draft status
    let existing: JobPost = sqlx::query_as(
        "SELECT id, tenant_id, organization_id, company_id, title, department, description, \
         requirements, responsibilities, benefits, location_city, location_state, location_country, \
         work_mode, employment_type, seniority_level, salary_min_cents, salary_max_cents, \
         salary_currency, equity_offered, status, visibility, posted_at, closes_at, filled_at, \
         hiring_manager_id, recruiter_id, max_applications, application_count, is_urgent, \
         skills_required, skills_preferred, metadata, created_at, updated_at \
         FROM job_posts WHERE id = $1 AND tenant_id = $2",
    )
    .bind(job_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    if existing.status != "draft" {
        return Err(AppError::Validation(format!(
            "Job cannot be published from '{}' status. Only draft jobs can be published.",
            existing.status
        )));
    }

    let job: JobPost = sqlx::query_as(
        "UPDATE job_posts SET status = 'open', posted_at = NOW(), updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, organization_id, company_id, title, department, description, \
         requirements, responsibilities, benefits, location_city, location_state, location_country, \
         work_mode, employment_type, seniority_level, salary_min_cents, salary_max_cents, \
         salary_currency, equity_offered, status, visibility, posted_at, closes_at, filled_at, \
         hiring_manager_id, recruiter_id, max_applications, application_count, is_urgent, \
         skills_required, skills_preferred, metadata, created_at, updated_at",
    )
    .bind(job_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(job))
}

// ── Public Job Endpoints (no auth required) ──────────────────────────────

pub async fn list_public_jobs(
    State(state): State<AppState>,
    Query(params): Query<PublicJobsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let search_pattern = params
        .search
        .as_ref()
        .map(|s| format!("%{}%", s.to_lowercase()));
    let work_mode_filter = params.work_mode.as_deref().unwrap_or("");
    let employment_type_filter = params.employment_type.as_deref().unwrap_or("");
    let location_country_filter = params.location_country.as_deref().unwrap_or("");
    let search_str = params.search.as_deref().unwrap_or("");
    let search_pat = search_pattern.as_deref().unwrap_or("");

    let jobs: Vec<PublicJobPost> = sqlx::query_as(
        "SELECT id, title, department, description, requirements, responsibilities, benefits, \
         location_city, location_state, location_country, work_mode, employment_type, \
         seniority_level, salary_min_cents, salary_max_cents, salary_currency, equity_offered, \
         skills_required, skills_preferred, posted_at, closes_at, created_at \
         FROM job_posts \
         WHERE status IN ('open') \
         AND visibility = 'public' \
         AND ($1 = '' OR LOWER(title) LIKE $2 OR LOWER(COALESCE(description, '')) LIKE $2) \
         AND ($3 = '' OR work_mode = $3) \
         AND ($4 = '' OR employment_type = $4) \
         AND ($5 = '' OR location_country = $5) \
         ORDER BY posted_at DESC NULLS LAST, created_at DESC \
         LIMIT $6 OFFSET $7",
    )
    .bind(search_str)
    .bind(search_pat)
    .bind(work_mode_filter)
    .bind(employment_type_filter)
    .bind(location_country_filter)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM job_posts \
         WHERE status IN ('open') \
         AND visibility = 'public' \
         AND ($1 = '' OR LOWER(title) LIKE $2 OR LOWER(COALESCE(description, '')) LIKE $2) \
         AND ($3 = '' OR work_mode = $3) \
         AND ($4 = '' OR employment_type = $4) \
         AND ($5 = '' OR location_country = $5)",
    )
    .bind(search_str)
    .bind(search_pat)
    .bind(work_mode_filter)
    .bind(employment_type_filter)
    .bind(location_country_filter)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "data": jobs,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn get_public_job(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> AppResult<Json<PublicJobPost>> {
    let job: PublicJobPost = sqlx::query_as(
        "SELECT id, title, department, description, requirements, responsibilities, benefits, \
         location_city, location_state, location_country, work_mode, employment_type, \
         seniority_level, salary_min_cents, salary_max_cents, salary_currency, equity_offered, \
         skills_required, skills_preferred, posted_at, closes_at, created_at \
         FROM job_posts \
         WHERE id = $1 AND status IN ('open') AND visibility = 'public'",
    )
    .bind(job_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Job not found".to_string()))?;

    Ok(Json(job))
}
