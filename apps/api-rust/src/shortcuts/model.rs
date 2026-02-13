use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ShortcutProfile {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ShortcutBinding {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub profile_id: Uuid,
    pub action: String,
    pub keys: String,
    pub scope: String,
    pub is_enabled: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateShortcutsRequest {
    pub bindings: Vec<ShortcutBindingUpdate>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShortcutBindingUpdate {
    pub action: String,
    pub keys: String,
    pub scope: Option<String>,
    pub is_enabled: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ShortcutUsageEvent {
    pub action: String,
    pub keys: String,
    pub context: Option<String>,
}
