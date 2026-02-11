use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ComplianceDeadline {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Uuid,
    pub filing_type: String,
    pub description: Option<String>,
    pub due_date: NaiveDate,
    pub extended_due_date: Option<NaiveDate>,
    pub status: String,
    pub extension_filed: bool,
    pub extension_filed_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub assigned_to: Option<Uuid>,
    pub notes: Option<String>,
    pub reminder_sent_30d: bool,
    pub reminder_sent_14d: bool,
    pub reminder_sent_7d: bool,
    pub reminder_sent_1d: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateDeadlineRequest {
    pub client_id: Uuid,
    #[validate(length(min = 1, max = 50))]
    pub filing_type: String,
    pub description: Option<String>,
    pub due_date: NaiveDate,
    pub assigned_to: Option<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDeadlineRequest {
    pub status: Option<String>,
    pub extension_filed: Option<bool>,
    pub extended_due_date: Option<NaiveDate>,
    pub assigned_to: Option<Uuid>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListDeadlinesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
    pub client_id: Option<Uuid>,
    pub month: Option<i32>,
    pub year: Option<i32>,
    pub search: Option<String>,
}
