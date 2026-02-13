use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Notification {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Uuid,
    pub r#type: String,
    pub title: String,
    pub body: Option<String>,
    pub resource_type: Option<String>,
    pub resource_id: Option<Uuid>,
    pub is_read: bool,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateNotificationRequest {
    pub user_id: Uuid,
    #[validate(length(min = 1, max = 500))]
    pub title: String,
    pub body: Option<String>,
    pub r#type: String,
    pub resource_type: Option<String>,
    pub resource_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct ListNotificationsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub unread_only: Option<bool>,
}
