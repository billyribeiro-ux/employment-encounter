use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Expense {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub client_id: Option<Uuid>,
    pub user_id: Uuid,
    pub category: String,
    pub description: Option<String>,
    pub amount_cents: i64,
    pub date: NaiveDate,
    pub receipt_document_id: Option<Uuid>,
    pub is_reimbursable: bool,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateExpenseRequest {
    #[validate(length(min = 1, max = 100))]
    pub category: String,
    pub description: Option<String>,
    pub amount_cents: i64,
    pub date: NaiveDate,
    pub client_id: Option<Uuid>,
    pub receipt_document_id: Option<Uuid>,
    pub is_reimbursable: Option<bool>,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct ListExpensesQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub client_id: Option<Uuid>,
    pub category: Option<String>,
    pub status: Option<String>,
    pub search: Option<String>,
    pub sort: Option<String>,
    pub order: Option<String>,
}
