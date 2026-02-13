use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MeetingRequest {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub requested_by: Uuid,
    pub meeting_type: String,
    pub duration_minutes: i32,
    pub location: Option<String>,
    pub meeting_url: Option<String>,
    pub status: String,
    pub proposed_times: serde_json::Value,
    pub accepted_time: Option<DateTime<Utc>>,
    pub accepted_timezone: Option<String>,
    pub application_id: Option<Uuid>,
    pub conversation_id: Option<Uuid>,
    pub cancellation_reason: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MeetingParticipant {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub meeting_id: Uuid,
    pub user_id: Uuid,
    pub role: String,
    pub response_status: String,
    pub responded_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMeetingRequest {
    pub title: String,
    pub description: Option<String>,
    pub participant_user_ids: Vec<Uuid>,
    pub meeting_type: Option<String>,
    pub duration_minutes: Option<i32>,
    pub location: Option<String>,
    pub proposed_times: Vec<serde_json::Value>,
    pub application_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AcceptMeetingRequest {
    pub accepted_time: String,
    pub timezone: String,
}

#[derive(Debug, Deserialize)]
pub struct DenyMeetingRequest {
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RescheduleMeetingRequest {
    pub proposed_times: Vec<serde_json::Value>,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListMeetingsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
}
