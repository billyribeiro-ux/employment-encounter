use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Client {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub business_type: String,
    pub fiscal_year_end: String,
    pub tax_id_last4: Option<String>,
    pub status: String,
    pub assigned_cpa_id: Option<Uuid>,
    pub risk_score: Option<i16>,
    pub engagement_score: Option<i16>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateClientRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(min = 1, max = 50))]
    pub business_type: String,
    #[validate(length(max = 20))]
    pub fiscal_year_end: Option<String>,
    pub assigned_cpa_id: Option<Uuid>,
    pub contacts: Option<Vec<CreateContactRequest>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateClientRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    pub business_type: Option<String>,
    pub fiscal_year_end: Option<String>,
    pub status: Option<String>,
    pub assigned_cpa_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateContactRequest {
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    #[validate(email)]
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_primary: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ListClientsQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub sort: Option<String>,
    pub order: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SubResourceQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub meta: PaginationMeta,
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug, Deserialize)]
pub struct BulkIdsRequest {
    pub ids: Vec<Uuid>,
}
