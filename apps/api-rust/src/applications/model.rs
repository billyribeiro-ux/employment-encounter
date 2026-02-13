use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Application {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub job_id: Uuid,
    pub candidate_id: Uuid,
    pub stage: String,
    pub status: String,
    pub source: Option<String>,
    pub referrer_id: Option<Uuid>,
    pub cover_letter: Option<String>,
    pub resume_document_id: Option<Uuid>,
    pub match_score: Option<f64>,
    pub match_reasons: Value,
    pub decision_notes: Option<String>,
    pub rejected_reason: Option<String>,
    pub offer_amount_cents: Option<i64>,
    pub offer_equity_pct: Option<f64>,
    pub offer_extended_at: Option<DateTime<Utc>>,
    pub offer_accepted_at: Option<DateTime<Utc>>,
    pub offer_declined_at: Option<DateTime<Utc>>,
    pub hired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ApplicationWithDetails {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub job_id: Uuid,
    pub candidate_id: Uuid,
    pub stage: String,
    pub status: String,
    pub source: Option<String>,
    pub referrer_id: Option<Uuid>,
    pub cover_letter: Option<String>,
    pub resume_document_id: Option<Uuid>,
    pub match_score: Option<f64>,
    pub match_reasons: Value,
    pub decision_notes: Option<String>,
    pub rejected_reason: Option<String>,
    pub offer_amount_cents: Option<i64>,
    pub offer_equity_pct: Option<f64>,
    pub offer_extended_at: Option<DateTime<Utc>>,
    pub offer_accepted_at: Option<DateTime<Utc>>,
    pub offer_declined_at: Option<DateTime<Utc>>,
    pub hired_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub job_title: String,
    pub candidate_headline: Option<String>,
    pub candidate_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateApplicationRequest {
    pub job_id: Uuid,
    pub candidate_id: Uuid,
    pub source: Option<String>,
    pub cover_letter: Option<String>,
    pub resume_document_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AdvanceStageRequest {
    pub to_stage: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ApplicationStageEvent {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub application_id: Uuid,
    pub from_stage: Option<String>,
    pub to_stage: String,
    pub changed_by: Option<Uuid>,
    pub notes: Option<String>,
    pub duration_hours: Option<i32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ListApplicationsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub job_id: Option<Uuid>,
    pub candidate_id: Option<Uuid>,
    pub stage: Option<String>,
    pub status: Option<String>,
}
