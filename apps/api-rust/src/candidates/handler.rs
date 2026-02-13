use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
#[allow(unused_imports)]
use crate::candidates::model::*;
use crate::AppState;

pub async fn list_candidates(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListCandidatesQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(25).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let search = params.search.as_deref().unwrap_or("");
    let search_pattern = format!("%{}%", search.to_lowercase());

    let availability_status = params.availability_status.as_deref().unwrap_or("");
    let remote_preference = params.remote_preference.as_deref().unwrap_or("");
    let location_country = params.location_country.as_deref().unwrap_or("");
    let skill = params.skill.as_deref().unwrap_or("");

    let candidates: Vec<CandidateProfile> = sqlx::query_as(
        "SELECT cp.* FROM candidate_profiles cp \
         WHERE cp.tenant_id = $1 \
         AND ($2 = '' OR LOWER(cp.headline) LIKE $3 OR LOWER(cp.summary) LIKE $3) \
         AND ($4 = '' OR cp.availability_status = $4) \
         AND ($5 = '' OR cp.remote_preference = $5) \
         AND ($6 = '' OR cp.location_country = $6) \
         AND ($7 = '' OR EXISTS ( \
             SELECT 1 FROM candidate_skills cs \
             WHERE cs.candidate_id = cp.id AND cs.tenant_id = cp.tenant_id \
             AND LOWER(cs.skill_name) = LOWER($7) \
         )) \
         ORDER BY cp.created_at DESC \
         LIMIT $8 OFFSET $9"
    )
    .bind(claims.tid)
    .bind(search)
    .bind(&search_pattern)
    .bind(availability_status)
    .bind(remote_preference)
    .bind(location_country)
    .bind(skill)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM candidate_profiles cp \
         WHERE cp.tenant_id = $1 \
         AND ($2 = '' OR LOWER(cp.headline) LIKE $3 OR LOWER(cp.summary) LIKE $3) \
         AND ($4 = '' OR cp.availability_status = $4) \
         AND ($5 = '' OR cp.remote_preference = $5) \
         AND ($6 = '' OR cp.location_country = $6) \
         AND ($7 = '' OR EXISTS ( \
             SELECT 1 FROM candidate_skills cs \
             WHERE cs.candidate_id = cp.id AND cs.tenant_id = cp.tenant_id \
             AND LOWER(cs.skill_name) = LOWER($7) \
         ))"
    )
    .bind(claims.tid)
    .bind(search)
    .bind(&search_pattern)
    .bind(availability_status)
    .bind(remote_preference)
    .bind(location_country)
    .bind(skill)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "data": candidates,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn get_candidate(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<CandidateProfile>> {
    let candidate: CandidateProfile = sqlx::query_as(
        "SELECT * FROM candidate_profiles WHERE id = $1 AND tenant_id = $2"
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Candidate not found".to_string()))?;

    Ok(Json(candidate))
}

pub async fn create_candidate(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateCandidateRequest>,
) -> AppResult<(StatusCode, Json<CandidateProfile>)> {
    let candidate: CandidateProfile = sqlx::query_as(
        "INSERT INTO candidate_profiles \
         (tenant_id, user_id, headline, summary, location_city, location_state, \
          location_country, remote_preference, availability_status, \
          desired_salary_min_cents, desired_salary_max_cents, \
          visa_status, work_authorization, linkedin_url, portfolio_url, github_url) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) \
         RETURNING *"
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(&payload.headline)
    .bind(&payload.summary)
    .bind(&payload.location_city)
    .bind(&payload.location_state)
    .bind(&payload.location_country)
    .bind(&payload.remote_preference)
    .bind(&payload.availability_status)
    .bind(payload.desired_salary_min_cents)
    .bind(payload.desired_salary_max_cents)
    .bind(&payload.visa_status)
    .bind(&payload.work_authorization)
    .bind(&payload.linkedin_url)
    .bind(&payload.portfolio_url)
    .bind(&payload.github_url)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(candidate)))
}

pub async fn update_candidate(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCandidateRequest>,
) -> AppResult<Json<CandidateProfile>> {
    let candidate: CandidateProfile = sqlx::query_as(
        "UPDATE candidate_profiles SET \
         headline = COALESCE($3, headline), \
         summary = COALESCE($4, summary), \
         location_city = COALESCE($5, location_city), \
         location_state = COALESCE($6, location_state), \
         location_country = COALESCE($7, location_country), \
         remote_preference = COALESCE($8, remote_preference), \
         availability_status = COALESCE($9, availability_status), \
         desired_salary_min_cents = COALESCE($10, desired_salary_min_cents), \
         desired_salary_max_cents = COALESCE($11, desired_salary_max_cents), \
         desired_currency = COALESCE($12, desired_currency), \
         visa_status = COALESCE($13, visa_status), \
         work_authorization = COALESCE($14, work_authorization), \
         linkedin_url = COALESCE($15, linkedin_url), \
         portfolio_url = COALESCE($16, portfolio_url), \
         github_url = COALESCE($17, github_url), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING *"
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&payload.headline)
    .bind(&payload.summary)
    .bind(&payload.location_city)
    .bind(&payload.location_state)
    .bind(&payload.location_country)
    .bind(&payload.remote_preference)
    .bind(&payload.availability_status)
    .bind(payload.desired_salary_min_cents)
    .bind(payload.desired_salary_max_cents)
    .bind(&payload.desired_currency)
    .bind(&payload.visa_status)
    .bind(&payload.work_authorization)
    .bind(&payload.linkedin_url)
    .bind(&payload.portfolio_url)
    .bind(&payload.github_url)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Candidate not found".to_string()))?;

    Ok(Json(candidate))
}

pub async fn list_candidate_skills(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(candidate_id): Path<Uuid>,
) -> AppResult<Json<Vec<CandidateSkill>>> {
    let skills: Vec<CandidateSkill> = sqlx::query_as(
        "SELECT * FROM candidate_skills \
         WHERE candidate_id = $1 AND tenant_id = $2 \
         ORDER BY skill_name ASC"
    )
    .bind(candidate_id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(skills))
}

pub async fn add_candidate_skill(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(candidate_id): Path<Uuid>,
    Json(payload): Json<AddSkillRequest>,
) -> AppResult<(StatusCode, Json<CandidateSkill>)> {
    // Verify the candidate exists and belongs to this tenant
    let _: (Uuid,) = sqlx::query_as(
        "SELECT id FROM candidate_profiles WHERE id = $1 AND tenant_id = $2"
    )
    .bind(candidate_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Candidate not found".to_string()))?;

    let skill: CandidateSkill = sqlx::query_as(
        "INSERT INTO candidate_skills \
         (tenant_id, candidate_id, skill_name, category, proficiency_level, \
          years_experience, evidence_url) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         RETURNING *"
    )
    .bind(claims.tid)
    .bind(candidate_id)
    .bind(&payload.skill_name)
    .bind(&payload.category)
    .bind(&payload.proficiency_level)
    .bind(payload.years_experience)
    .bind(&payload.evidence_url)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(skill)))
}

pub async fn delete_candidate_skill(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((candidate_id, skill_id)): Path<(Uuid, Uuid)>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "DELETE FROM candidate_skills \
         WHERE id = $1 AND candidate_id = $2 AND tenant_id = $3"
    )
    .bind(skill_id)
    .bind(candidate_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Skill not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn upload_candidate_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(candidate_id): Path<Uuid>,
    Json(payload): Json<UploadDocumentRequest>,
) -> AppResult<(StatusCode, Json<CandidateDocument>)> {
    // Verify the candidate exists and belongs to this tenant
    let _: (Uuid,) = sqlx::query_as(
        "SELECT id FROM candidate_profiles WHERE id = $1 AND tenant_id = $2"
    )
    .bind(candidate_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Candidate not found".to_string()))?;

    let is_primary = payload.is_primary.unwrap_or(false);

    let document: CandidateDocument = sqlx::query_as(
        "INSERT INTO candidate_documents \
         (tenant_id, candidate_id, document_type, filename, mime_type, size_bytes, is_primary) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         RETURNING *"
    )
    .bind(claims.tid)
    .bind(candidate_id)
    .bind(&payload.document_type)
    .bind(&payload.filename)
    .bind(&payload.mime_type)
    .bind(payload.size_bytes)
    .bind(is_primary)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(document)))
}

pub async fn list_candidate_documents(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(candidate_id): Path<Uuid>,
) -> AppResult<Json<Vec<CandidateDocument>>> {
    let documents: Vec<CandidateDocument> = sqlx::query_as(
        "SELECT * FROM candidate_documents \
         WHERE candidate_id = $1 AND tenant_id = $2 \
         ORDER BY created_at DESC"
    )
    .bind(candidate_id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(documents))
}

// ── Candidate Notes ──────────────────────────────────────────────────────

pub async fn list_candidate_notes(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(candidate_id): Path<Uuid>,
) -> AppResult<Json<Vec<CandidateNote>>> {
    let notes: Vec<CandidateNote> = sqlx::query_as(
        "SELECT * FROM candidate_notes \
         WHERE candidate_id = $1 AND tenant_id = $2 \
         ORDER BY created_at DESC"
    )
    .bind(candidate_id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(notes))
}

pub async fn create_candidate_note(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(candidate_id): Path<Uuid>,
    Json(payload): Json<CreateNoteRequest>,
) -> AppResult<(StatusCode, Json<CandidateNote>)> {
    if payload.content.is_empty() {
        return Err(crate::error::AppError::Validation("content is required".to_string()));
    }

    let is_private = payload.is_private.unwrap_or(false);
    let note_type = payload.note_type.as_deref().unwrap_or("general");

    let note: CandidateNote = sqlx::query_as(
        "INSERT INTO candidate_notes \
         (tenant_id, candidate_id, application_id, author_id, content, is_private, note_type) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         RETURNING *"
    )
    .bind(claims.tid)
    .bind(candidate_id)
    .bind(payload.application_id)
    .bind(claims.sub)
    .bind(&payload.content)
    .bind(is_private)
    .bind(note_type)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(note)))
}

pub async fn update_candidate_note(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((candidate_id, note_id)): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateNoteRequest>,
) -> AppResult<Json<CandidateNote>> {
    let note: CandidateNote = sqlx::query_as(
        "UPDATE candidate_notes SET \
         content = COALESCE($4, content), \
         is_private = COALESCE($5, is_private), \
         note_type = COALESCE($6, note_type), \
         updated_at = NOW() \
         WHERE id = $1 AND candidate_id = $2 AND tenant_id = $3 \
         RETURNING *"
    )
    .bind(note_id)
    .bind(candidate_id)
    .bind(claims.tid)
    .bind(&payload.content)
    .bind(payload.is_private)
    .bind(&payload.note_type)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| crate::error::AppError::NotFound("Note not found".to_string()))?;

    Ok(Json(note))
}

pub async fn delete_candidate_note(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((candidate_id, note_id)): Path<(Uuid, Uuid)>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "DELETE FROM candidate_notes \
         WHERE id = $1 AND candidate_id = $2 AND tenant_id = $3"
    )
    .bind(note_id)
    .bind(candidate_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(crate::error::AppError::NotFound("Note not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ── Candidate Favorites ──────────────────────────────────────────────────

pub async fn list_favorites(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListFavoritesQuery>,
) -> AppResult<Json<Vec<CandidateFavorite>>> {
    let job_id_filter = params.job_id.map(|id| id.to_string()).unwrap_or_default();

    let favorites: Vec<CandidateFavorite> = sqlx::query_as(
        "SELECT * FROM candidate_favorites \
         WHERE tenant_id = $1 AND user_id = $2 \
         AND ($3 = '' OR job_id::text = $3) \
         ORDER BY created_at DESC"
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(&job_id_filter)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(favorites))
}

pub async fn add_favorite(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateFavoriteRequest>,
) -> AppResult<(StatusCode, Json<CandidateFavorite>)> {
    let tags = payload.tags.unwrap_or_default();

    let favorite: CandidateFavorite = sqlx::query_as(
        "INSERT INTO candidate_favorites \
         (tenant_id, candidate_id, user_id, job_id, tags, notes) \
         VALUES ($1, $2, $3, $4, $5, $6) \
         ON CONFLICT (tenant_id, candidate_id, user_id, job_id) DO UPDATE SET \
         tags = EXCLUDED.tags, notes = EXCLUDED.notes \
         RETURNING *"
    )
    .bind(claims.tid)
    .bind(payload.candidate_id)
    .bind(claims.sub)
    .bind(payload.job_id)
    .bind(&tags)
    .bind(&payload.notes)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(favorite)))
}

pub async fn remove_favorite(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "DELETE FROM candidate_favorites \
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3"
    )
    .bind(id)
    .bind(claims.tid)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(crate::error::AppError::NotFound("Favorite not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
