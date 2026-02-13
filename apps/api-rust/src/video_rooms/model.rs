use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VideoRoom {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: Option<String>,
    pub meeting_id: Option<Uuid>,
    pub room_code: Option<String>,
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

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VideoRoomToken {
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

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct VideoSession {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub room_id: Uuid,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub participant_count: i32,
    pub quality_score: Option<f64>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRoomRequest {
    pub name: Option<String>,
    pub meeting_id: Option<Uuid>,
    pub max_participants: Option<i32>,
    pub recording_enabled: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ListRoomsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
}
