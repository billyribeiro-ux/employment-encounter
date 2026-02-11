use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Document {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Option<Uuid>,
    pub uploaded_by: Uuid,
    pub name: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub s3_key: String,
    pub s3_version_id: Option<String>,
    pub category: Option<String>,
    pub ai_category: Option<String>,
    pub ai_confidence: Option<f64>,
    pub tax_year: Option<i32>,
    pub status: String,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateDocumentRequest {
    #[validate(length(min = 1, max = 500))]
    pub name: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub client_id: Option<Uuid>,
    pub category: Option<String>,
    pub tax_year: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub document: Document,
    pub upload_url: String,
}

#[derive(Debug, Deserialize)]
pub struct ListDocumentsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub client_id: Option<Uuid>,
    pub category: Option<String>,
    pub status: Option<String>,
}
