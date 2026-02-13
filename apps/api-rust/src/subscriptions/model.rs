use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Plan {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub price_monthly_cents: i64,
    pub price_annual_cents: Option<i64>,
    pub max_jobs: Option<i32>,
    pub max_users: Option<i32>,
    pub max_candidates: Option<i32>,
    pub features: serde_json::Value,
    pub is_active: bool,
    pub stripe_price_id_monthly: Option<String>,
    pub stripe_price_id_annual: Option<String>,
    pub sort_order: i16,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Subscription {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub plan_id: Uuid,
    pub status: String,
    pub billing_cycle: String,
    pub current_period_start: Option<DateTime<Utc>>,
    pub current_period_end: Option<DateTime<Utc>>,
    pub trial_ends_at: Option<DateTime<Utc>>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub stripe_subscription_id: Option<String>,
    pub stripe_customer_id: Option<String>,
    pub seats_used: i32,
    pub seats_limit: i32,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SubscriptionWithPlan {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub plan_id: Uuid,
    pub status: String,
    pub billing_cycle: String,
    pub current_period_start: Option<DateTime<Utc>>,
    pub current_period_end: Option<DateTime<Utc>>,
    pub trial_ends_at: Option<DateTime<Utc>>,
    pub cancelled_at: Option<DateTime<Utc>>,
    pub seats_used: i32,
    pub seats_limit: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub plan_name: String,
    pub plan_slug: String,
    pub price_monthly_cents: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct UsageMeter {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub subscription_id: Uuid,
    pub meter_type: String,
    pub current_value: i64,
    pub limit_value: Option<i64>,
    pub period_start: Option<DateTime<Utc>>,
    pub period_end: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Entitlement {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub feature_key: String,
    pub is_enabled: bool,
    pub limit_value: Option<i64>,
    pub expires_at: Option<DateTime<Utc>>,
    pub source: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubscriptionRequest {
    pub plan_id: Uuid,
    pub billing_cycle: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ChangePlanRequest {
    pub plan_id: Uuid,
}
