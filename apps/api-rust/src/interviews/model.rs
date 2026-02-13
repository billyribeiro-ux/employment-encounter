use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct InterviewRoom {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: Option<String>,
    pub meeting_id: Option<Uuid>,
    pub room_code: String,
    pub status: String,
    pub max_participants: i32,
    pub recording_enabled: bool,
    pub created_by: Uuid,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInterviewRoomRequest {
    pub name: Option<String>,
    pub meeting_id: Option<Uuid>,
    pub max_participants: Option<i32>,
    pub recording_enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct InterviewRoomToken {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub room_id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub role: String,
    pub expires_at: DateTime<Utc>,
    pub used_at: Option<DateTime<Utc>>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionEventRequest {
    pub event_type: String,
    pub payload: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct SessionEvent {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub session_id: Uuid,
    pub user_id: Uuid,
    pub event_type: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubmitFeedbackRequest {
    pub overall_rating: Option<i32>,
    pub technical_rating: Option<i32>,
    pub communication_rating: Option<i32>,
    pub notes: Option<String>,
    pub recommendation: Option<String>,
}
