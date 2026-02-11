use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Message {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Uuid,
    pub sender_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub content: String,
    pub is_internal: bool,
    pub is_read: bool,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateMessageRequest {
    pub client_id: Uuid,
    #[validate(length(min = 1, max = 10000))]
    pub content: String,
    pub parent_id: Option<Uuid>,
    pub is_internal: Option<bool>,
    pub attachment_ids: Option<Vec<Uuid>>,
}

#[derive(Debug, Deserialize)]
pub struct ListMessagesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
}
