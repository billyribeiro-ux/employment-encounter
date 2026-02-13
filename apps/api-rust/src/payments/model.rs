use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreatePaymentIntentRequest {
    pub invoice_id: Uuid,
}

#[derive(Debug, Serialize)]
pub struct PaymentIntentResponse {
    pub client_secret: String,
    pub payment_intent_id: String,
    pub amount_cents: i64,
    pub currency: String,
}
