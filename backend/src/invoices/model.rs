use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Invoice {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Uuid,
    pub invoice_number: String,
    pub status: String,
    pub subtotal_cents: i64,
    pub tax_cents: i64,
    pub total_cents: i64,
    pub amount_paid_cents: i64,
    pub currency: String,
    pub due_date: Option<NaiveDate>,
    pub issued_date: Option<NaiveDate>,
    pub paid_date: Option<NaiveDate>,
    pub notes: Option<String>,
    pub stripe_payment_intent_id: Option<String>,
    pub stripe_invoice_id: Option<String>,
    pub pdf_s3_key: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateInvoiceRequest {
    pub client_id: Uuid,
    pub due_date: Option<NaiveDate>,
    pub notes: Option<String>,
    pub line_items: Vec<CreateLineItemRequest>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateLineItemRequest {
    #[validate(length(min = 1, max = 1000))]
    pub description: String,
    pub quantity: f64,
    pub unit_price_cents: i64,
    pub time_entry_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct ListInvoicesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub status: Option<String>,
    pub client_id: Option<Uuid>,
    pub search: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateInvoiceStatusRequest {
    pub status: String,
}
