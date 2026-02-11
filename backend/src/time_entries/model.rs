use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TimeEntry {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Uuid,
    pub client_id: Uuid,
    pub description: String,
    pub duration_minutes: i32,
    pub rate_cents: i64,
    pub is_billable: bool,
    pub is_running: bool,
    pub started_at: Option<DateTime<Utc>>,
    pub stopped_at: Option<DateTime<Utc>>,
    pub date: NaiveDate,
    pub invoice_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTimeEntryRequest {
    pub client_id: Uuid,
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    pub duration_minutes: Option<i32>,
    pub rate_cents: Option<i64>,
    pub is_billable: Option<bool>,
    pub date: Option<NaiveDate>,
    pub start_timer: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
#[allow(dead_code)]
pub struct UpdateTimeEntryRequest {
    pub client_id: Option<Uuid>,
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    pub duration_minutes: Option<i32>,
    pub rate_cents: Option<i64>,
    pub is_billable: Option<bool>,
    pub date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ListTimeEntriesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub client_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub date_from: Option<NaiveDate>,
    pub date_to: Option<NaiveDate>,
    pub is_billable: Option<bool>,
    pub search: Option<String>,
    pub sort: Option<String>,
    pub order: Option<String>,
}
