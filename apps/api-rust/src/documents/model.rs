use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Document {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Uuid,
    pub uploaded_by: Uuid,
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub s3_key: String,
    pub category: Option<String>,
    pub ai_confidence: Option<f64>,
    pub ai_extracted_data: serde_json::Value,
    pub verification_status: String,
    pub tax_year: Option<i16>,
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateDocumentRequest {
    #[validate(length(min = 1, max = 500))]
    pub filename: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub client_id: Uuid,
    pub category: Option<String>,
    pub tax_year: Option<i16>,
}

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    pub document: Document,
    pub upload_url: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct UpdateDocumentRequest {
    pub category: Option<String>,
    pub tax_year: Option<i16>,
    pub verification_status: Option<String>,
    pub ai_verified: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ListDocumentsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub client_id: Option<Uuid>,
    pub category: Option<String>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub sort: Option<String>,
    pub order: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkDocumentIdsRequest {
    pub ids: Vec<Uuid>,
}
