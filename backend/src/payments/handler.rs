use stripe_rust as stripe;

use axum::{
    body::Bytes,
    extract::{Extension, State},
    http::{HeaderMap, StatusCode},
    Json,
};

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::payments::model::*;
use crate::AppState;

pub async fn create_payment_intent(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreatePaymentIntentRequest>,
) -> AppResult<Json<PaymentIntentResponse>> {
    // Look up the invoice
    let invoice: (i64, String, Option<String>) = sqlx::query_as(
        "SELECT total_cents, currency, stripe_payment_intent_id \
         FROM invoices WHERE id = $1 AND tenant_id = $2 AND status IN ('sent', 'viewed', 'overdue')"
    )
    .bind(payload.invoice_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Invoice not found or not payable".to_string()))?;

    let (total_cents, currency, existing_pi) = invoice;

    // If there's already a payment intent, return it
    if let Some(pi_id) = existing_pi {
        // In production, retrieve the existing PI from Stripe
        return Ok(Json(PaymentIntentResponse {
            client_secret: format!("{}_secret_existing", pi_id),
            payment_intent_id: pi_id,
            amount_cents: total_cents,
            currency,
        }));
    }

    // Create Stripe PaymentIntent
    let stripe_secret = state.config.stripe_secret_key.as_deref().unwrap_or("sk_test_placeholder");
    let client = stripe::Client::new(stripe_secret);

    let mut create_params = stripe::CreatePaymentIntent::new(total_cents, stripe::Currency::USD);
    create_params.metadata = Some(std::collections::HashMap::from([
        ("invoice_id".to_string(), payload.invoice_id.to_string()),
        ("tenant_id".to_string(), claims.tid.to_string()),
    ]));

    match stripe::PaymentIntent::create(&client, create_params).await {
        Ok(pi) => {
            let pi_id = pi.id.to_string();
            let client_secret = pi.client_secret.unwrap_or_default();

            // Store the payment intent ID on the invoice
            sqlx::query(
                "UPDATE invoices SET stripe_payment_intent_id = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3"
            )
            .bind(&pi_id)
            .bind(payload.invoice_id)
            .bind(claims.tid)
            .execute(&state.db)
            .await?;

            Ok(Json(PaymentIntentResponse {
                client_secret,
                payment_intent_id: pi_id,
                amount_cents: total_cents,
                currency,
            }))
        }
        Err(e) => {
            tracing::error!("Stripe PaymentIntent creation failed: {}", e);
            Err(AppError::Internal("Payment processing failed".to_string()))
        }
    }
}

pub async fn stripe_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> AppResult<StatusCode> {
    let webhook_secret = state.config.stripe_webhook_secret.as_deref().unwrap_or("");
    let signature = headers
        .get("stripe-signature")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    let payload = std::str::from_utf8(&body)
        .map_err(|_| AppError::Validation("Invalid webhook payload".to_string()))?;

    // Verify webhook signature
    let event = stripe::Webhook::construct_event(payload, signature, webhook_secret)
        .map_err(|e| {
            tracing::warn!("Stripe webhook signature verification failed: {}", e);
            AppError::Unauthorized("Invalid webhook signature".to_string())
        })?;

    match event.type_ {
        stripe::EventType::PaymentIntentSucceeded => {
            if let stripe::EventObject::PaymentIntent(pi) = event.data.object {
                let pi_id = pi.id.to_string();
                tracing::info!("Payment succeeded for PaymentIntent: {}", pi_id);

                // Update invoice status to paid
                let result = sqlx::query(
                    "UPDATE invoices SET status = 'paid', paid_date = CURRENT_DATE, \
                     amount_paid_cents = total_cents, updated_at = NOW() \
                     WHERE stripe_payment_intent_id = $1"
                )
                .bind(&pi_id)
                .execute(&state.db)
                .await?;

                if result.rows_affected() > 0 {
                    // Get invoice details for notification
                    let invoice_info: Option<(uuid::Uuid, uuid::Uuid, String, i64)> = sqlx::query_as(
                        "SELECT tenant_id, created_by, invoice_number, total_cents \
                         FROM invoices WHERE stripe_payment_intent_id = $1"
                    )
                    .bind(&pi_id)
                    .fetch_optional(&state.db)
                    .await?;

                    if let Some((tenant_id, created_by, invoice_number, amount)) = invoice_info {
                        // Send real-time notification via WebSocket
                        state.ws_broadcast.send_to_user(
                            tenant_id,
                            created_by,
                            crate::ws::WsEventPayload::InvoicePaid {
                                id: uuid::Uuid::nil(),
                                invoice_number: invoice_number.clone(),
                                amount_cents: amount,
                            },
                        );

                        // Create in-app notification
                        // Set tenant context first for RLS — parameterized
                        sqlx::query("SELECT set_config('app.current_tenant', $1, true)")
                            .bind(tenant_id.to_string())
                            .execute(&state.db)
                            .await?;

                        sqlx::query(
                            "INSERT INTO notifications (tenant_id, user_id, type, title, body) \
                             VALUES ($1, $2, 'invoice_paid', $3, $4)"
                        )
                        .bind(tenant_id)
                        .bind(created_by)
                        .bind(format!("Invoice {} paid", invoice_number))
                        .bind(format!("Payment of ${:.2} received", amount as f64 / 100.0))
                        .execute(&state.db)
                        .await?;
                    }
                }
            }
        }
        stripe::EventType::PaymentIntentPaymentFailed => {
            if let stripe::EventObject::PaymentIntent(pi) = event.data.object {
                tracing::warn!("Payment failed for PaymentIntent: {}", pi.id);
            }
        }
        _ => {
            tracing::debug!("Unhandled Stripe event type: {:?}", event.type_);
        }
    }

    Ok(StatusCode::OK)
}
