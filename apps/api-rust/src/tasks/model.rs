use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Task {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Option<Uuid>,
    pub workflow_instance_id: Option<Uuid>,
    pub workflow_step_index: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub assigned_to: Option<Uuid>,
    pub created_by: Uuid,
    pub due_date: Option<NaiveDate>,
    pub completed_at: Option<DateTime<Utc>>,
    pub is_recurring: bool,
    pub recurrence_rule: Option<String>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTaskRequest {
    #[validate(length(min = 1, max = 500))]
    pub title: String,
    pub description: Option<String>,
    pub client_id: Option<Uuid>,
    pub assigned_to: Option<Uuid>,
    pub due_date: Option<NaiveDate>,
    pub priority: Option<String>,
    pub workflow_instance_id: Option<Uuid>,
    pub workflow_step_index: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub due_date: Option<NaiveDate>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ListTasksQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
    pub priority: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub client_id: Option<Uuid>,
    pub search: Option<String>,
}
