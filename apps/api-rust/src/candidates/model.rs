use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CandidateProfile {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Option<Uuid>,
    pub headline: Option<String>,
    pub summary: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub remote_preference: Option<String>,
    pub availability_status: Option<String>,
    pub desired_salary_min_cents: Option<i64>,
    pub desired_salary_max_cents: Option<i64>,
    pub desired_currency: Option<String>,
    pub visa_status: Option<String>,
    pub work_authorization: Option<String>,
    pub linkedin_url: Option<String>,
    pub portfolio_url: Option<String>,
    pub github_url: Option<String>,
    pub profile_completeness_pct: i16,
    pub is_anonymous: bool,
    pub reputation_score: i16,
    pub response_rate_pct: i16,
    pub interview_attendance_rate_pct: i16,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CandidateSkill {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub candidate_id: Uuid,
    pub skill_name: String,
    pub category: Option<String>,
    pub proficiency_level: Option<String>,
    pub years_experience: Option<i16>,
    pub is_verified: bool,
    pub evidence_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CandidateDocument {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub candidate_id: Uuid,
    pub document_type: String,
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub s3_key: Option<String>,
    pub is_primary: bool,
    pub parsed_data: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateCandidateRequest {
    pub headline: Option<String>,
    pub summary: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub remote_preference: Option<String>,
    pub availability_status: Option<String>,
    pub desired_salary_min_cents: Option<i64>,
    pub desired_salary_max_cents: Option<i64>,
    pub visa_status: Option<String>,
    pub work_authorization: Option<String>,
    pub linkedin_url: Option<String>,
    pub portfolio_url: Option<String>,
    pub github_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCandidateRequest {
    pub headline: Option<String>,
    pub summary: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub remote_preference: Option<String>,
    pub availability_status: Option<String>,
    pub desired_salary_min_cents: Option<i64>,
    pub desired_salary_max_cents: Option<i64>,
    pub desired_currency: Option<String>,
    pub visa_status: Option<String>,
    pub work_authorization: Option<String>,
    pub linkedin_url: Option<String>,
    pub portfolio_url: Option<String>,
    pub github_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddSkillRequest {
    pub skill_name: String,
    pub category: Option<String>,
    pub proficiency_level: Option<String>,
    pub years_experience: Option<i16>,
    pub evidence_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UploadDocumentRequest {
    pub document_type: String,
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub is_primary: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ListCandidatesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
    pub availability_status: Option<String>,
    pub remote_preference: Option<String>,
    pub location_country: Option<String>,
    pub skill: Option<String>,
}

// ── Candidate Notes ──────────────────────────────────────────────────────

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CandidateNote {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub candidate_id: Uuid,
    pub application_id: Option<Uuid>,
    pub author_id: Uuid,
    pub content: String,
    pub is_private: Option<bool>,
    pub note_type: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateNoteRequest {
    pub application_id: Option<Uuid>,
    pub content: String,
    pub is_private: Option<bool>,
    pub note_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNoteRequest {
    pub content: Option<String>,
    pub is_private: Option<bool>,
    pub note_type: Option<String>,
}

// ── Candidate Favorites ──────────────────────────────────────────────────

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct CandidateFavorite {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub candidate_id: Uuid,
    pub user_id: Uuid,
    pub job_id: Option<Uuid>,
    pub tags: Vec<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFavoriteRequest {
    pub candidate_id: Uuid,
    pub job_id: Option<Uuid>,
    pub tags: Option<Vec<String>>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListFavoritesQuery {
    pub job_id: Option<Uuid>,
}
