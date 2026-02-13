use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Offer {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub application_id: Uuid,
    pub job_id: Uuid,
    pub candidate_id: Uuid,
    pub status: String,
    pub title: String,
    pub base_salary_cents: Option<i64>,
    pub salary_currency: Option<String>,
    pub equity_pct: Option<f64>,
    pub signing_bonus_cents: Option<i64>,
    pub start_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub benefits_summary: Option<String>,
    pub custom_terms: Option<String>,
    pub sent_at: Option<DateTime<Utc>>,
    pub viewed_at: Option<DateTime<Utc>>,
    pub responded_at: Option<DateTime<Utc>>,
    pub accepted_at: Option<DateTime<Utc>>,
    pub declined_at: Option<DateTime<Utc>>,
    pub decline_reason: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateOfferRequest {
    pub application_id: Uuid,
    pub job_id: Uuid,
    pub candidate_id: Uuid,
    pub title: String,
    pub base_salary_cents: Option<i64>,
    pub salary_currency: Option<String>,
    pub equity_pct: Option<f64>,
    pub signing_bonus_cents: Option<i64>,
    pub start_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub benefits_summary: Option<String>,
    pub custom_terms: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOfferRequest {
    pub title: Option<String>,
    pub base_salary_cents: Option<i64>,
    pub salary_currency: Option<String>,
    pub equity_pct: Option<f64>,
    pub signing_bonus_cents: Option<i64>,
    pub start_date: Option<NaiveDate>,
    pub expiry_date: Option<NaiveDate>,
    pub benefits_summary: Option<String>,
    pub custom_terms: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListOffersQuery {
    pub job_id: Option<Uuid>,
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeclineOfferRequest {
    pub reason: Option<String>,
}
