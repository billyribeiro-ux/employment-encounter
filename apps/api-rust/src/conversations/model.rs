use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Conversation {
    pub id: Uuid,
    pub tenant_id: Uuid,
    #[sqlx(rename = "type")]
    #[serde(rename = "type")]
    pub type_: String,
    pub title: Option<String>,
    pub created_by: Uuid,
    pub last_message_at: Option<DateTime<Utc>>,
    pub last_message_preview: Option<String>,
    pub is_archived: bool,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ConversationParticipant {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub conversation_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub last_read_at: Option<DateTime<Utc>>,
    pub is_muted: bool,
    pub joined_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ChatMessage {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub message_type: String,
    pub parent_id: Option<Uuid>,
    pub is_edited: bool,
    pub is_deleted: bool,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ChatMessageWithSender {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub content: String,
    pub message_type: String,
    pub parent_id: Option<Uuid>,
    pub is_edited: bool,
    pub is_deleted: bool,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub sender_name: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateConversationRequest {
    #[serde(rename = "type")]
    pub type_: String,
    pub title: Option<String>,
    pub participant_ids: Vec<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub content: String,
    pub message_type: Option<String>,
    pub parent_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct ListConversationsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct ListMessagesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub search: Option<String>,
}
