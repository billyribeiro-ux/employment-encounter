use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorkflowTemplate {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub steps: serde_json::Value,
    pub is_active: bool,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorkflowInstance {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub template_id: Uuid,
    pub client_id: Uuid,
    pub name: String,
    pub status: String,
    pub current_step_index: i32,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub due_date: Option<NaiveDate>,
    pub assigned_to: Option<Uuid>,
    pub metadata: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WorkflowStepLog {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub instance_id: Uuid,
    pub step_index: i32,
    pub step_name: String,
    pub action: String,
    pub performed_by: Uuid,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateTemplateRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub steps: serde_json::Value,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateInstanceRequest {
    pub template_id: Uuid,
    pub client_id: Uuid,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub due_date: Option<NaiveDate>,
    pub assigned_to: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AdvanceStepRequest {
    pub action: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ListWorkflowsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
    pub client_id: Option<Uuid>,
    pub search: Option<String>,
}
