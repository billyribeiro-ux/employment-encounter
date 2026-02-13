use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct JobPost {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub organization_id: Option<Uuid>,
    pub company_id: Option<Uuid>,
    pub title: String,
    pub department: Option<String>,
    pub description: Option<String>,
    pub requirements: Option<String>,
    pub responsibilities: Option<String>,
    pub benefits: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub work_mode: String,
    pub employment_type: String,
    pub seniority_level: Option<String>,
    pub salary_min_cents: Option<i64>,
    pub salary_max_cents: Option<i64>,
    pub salary_currency: String,
    pub equity_offered: bool,
    pub status: String,
    pub visibility: String,
    pub posted_at: Option<DateTime<Utc>>,
    pub closes_at: Option<DateTime<Utc>>,
    pub filled_at: Option<DateTime<Utc>>,
    pub hiring_manager_id: Option<Uuid>,
    pub recruiter_id: Option<Uuid>,
    pub max_applications: Option<i32>,
    pub application_count: i32,
    pub is_urgent: bool,
    pub skills_required: Vec<String>,
    pub skills_preferred: Vec<String>,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateJobRequest {
    #[validate(length(min = 3, message = "Title must be at least 3 characters"))]
    pub title: String,
    pub department: Option<String>,
    pub description: Option<String>,
    pub requirements: Option<String>,
    pub responsibilities: Option<String>,
    pub benefits: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub work_mode: Option<String>,
    pub employment_type: Option<String>,
    pub seniority_level: Option<String>,
    pub salary_min_cents: Option<i64>,
    pub salary_max_cents: Option<i64>,
    pub equity_offered: Option<bool>,
    pub visibility: Option<String>,
    pub hiring_manager_id: Option<Uuid>,
    pub recruiter_id: Option<Uuid>,
    pub max_applications: Option<i32>,
    pub is_urgent: Option<bool>,
    pub skills_required: Option<Vec<String>>,
    pub skills_preferred: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateJobRequest {
    pub title: Option<String>,
    pub department: Option<String>,
    pub description: Option<String>,
    pub requirements: Option<String>,
    pub responsibilities: Option<String>,
    pub benefits: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub work_mode: Option<String>,
    pub employment_type: Option<String>,
    pub seniority_level: Option<String>,
    pub salary_min_cents: Option<i64>,
    pub salary_max_cents: Option<i64>,
    pub equity_offered: Option<bool>,
    pub visibility: Option<String>,
    pub hiring_manager_id: Option<Uuid>,
    pub recruiter_id: Option<Uuid>,
    pub max_applications: Option<i32>,
    pub is_urgent: Option<bool>,
    pub skills_required: Option<Vec<String>>,
    pub skills_preferred: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct ListJobsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
    pub status: Option<String>,
    pub work_mode: Option<String>,
    pub employment_type: Option<String>,
    pub seniority_level: Option<String>,
    pub is_urgent: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct PublicJobsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
    pub work_mode: Option<String>,
    pub employment_type: Option<String>,
    pub location_country: Option<String>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PublicJobPost {
    pub id: Uuid,
    pub title: String,
    pub department: Option<String>,
    pub description: Option<String>,
    pub requirements: Option<String>,
    pub responsibilities: Option<String>,
    pub benefits: Option<String>,
    pub location_city: Option<String>,
    pub location_state: Option<String>,
    pub location_country: Option<String>,
    pub work_mode: String,
    pub employment_type: String,
    pub seniority_level: Option<String>,
    pub salary_min_cents: Option<i64>,
    pub salary_max_cents: Option<i64>,
    pub salary_currency: String,
    pub equity_offered: bool,
    pub skills_required: Vec<String>,
    pub skills_preferred: Vec<String>,
    pub posted_at: Option<DateTime<Utc>>,
    pub closes_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}
