use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

use super::model::*;

/// GET /plans — list all active plans ordered by sort_order.
pub async fn list_plans(
    State(state): State<AppState>,
    Extension(_claims): Extension<Claims>,
) -> AppResult<Json<Vec<Plan>>> {
    let plans: Vec<Plan> = sqlx::query_as(
        "SELECT id, name, slug, description, price_monthly_cents, price_annual_cents, \
         max_jobs, max_users, max_candidates, features, is_active, \
         stripe_price_id_monthly, stripe_price_id_annual, sort_order, \
         created_at, updated_at \
         FROM plans WHERE is_active = true ORDER BY sort_order ASC",
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(plans))
}

/// GET /subscription — get the current tenant's subscription with plan details.
pub async fn get_current_subscription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<SubscriptionWithPlan>> {
    let subscription: SubscriptionWithPlan = sqlx::query_as(
        "SELECT s.id, s.tenant_id, s.plan_id, s.status, s.billing_cycle, \
         s.current_period_start, s.current_period_end, s.trial_ends_at, \
         s.cancelled_at, s.seats_used, s.seats_limit, s.created_at, s.updated_at, \
         p.name AS plan_name, p.slug AS plan_slug, p.price_monthly_cents \
         FROM subscriptions s \
         JOIN plans p ON p.id = s.plan_id \
         WHERE s.tenant_id = $1 \
         ORDER BY s.created_at DESC LIMIT 1",
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Subscription not found".to_string()))?;

    Ok(Json(subscription))
}

/// POST /subscription — create a new subscription for the current tenant.
pub async fn create_subscription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateSubscriptionRequest>,
) -> AppResult<(StatusCode, Json<Subscription>)> {
    // Verify the plan exists and is active
    let plan: Plan = sqlx::query_as(
        "SELECT id, name, slug, description, price_monthly_cents, price_annual_cents, \
         max_jobs, max_users, max_candidates, features, is_active, \
         stripe_price_id_monthly, stripe_price_id_annual, sort_order, \
         created_at, updated_at \
         FROM plans WHERE id = $1 AND is_active = true",
    )
    .bind(payload.plan_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Plan not found".to_string()))?;

    // Check if tenant already has an active subscription
    let existing: Option<(Uuid,)> = sqlx::query_as(
        "SELECT id FROM subscriptions WHERE tenant_id = $1 AND status IN ('active', 'trialing')",
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::Conflict(
            "Tenant already has an active subscription".to_string(),
        ));
    }

    let billing_cycle = payload
        .billing_cycle
        .unwrap_or_else(|| "monthly".to_string());

    if billing_cycle != "monthly" && billing_cycle != "annual" {
        return Err(AppError::Validation(
            "billing_cycle must be 'monthly' or 'annual'".to_string(),
        ));
    }

    let id = Uuid::new_v4();
    let seats_limit = plan.max_users.unwrap_or(5);
    let period_interval = if billing_cycle == "annual" {
        "1 year"
    } else {
        "1 month"
    };

    let subscription: Subscription = sqlx::query_as(
        &format!(
            "INSERT INTO subscriptions \
             (id, tenant_id, plan_id, status, billing_cycle, \
              current_period_start, current_period_end, trial_ends_at, \
              seats_used, seats_limit, metadata) \
             VALUES ($1, $2, $3, 'trialing', $4, \
              NOW(), NOW() + INTERVAL '{}', NOW() + INTERVAL '14 days', \
              0, $5, '{{}}') \
             RETURNING id, tenant_id, plan_id, status, billing_cycle, \
              current_period_start, current_period_end, trial_ends_at, \
              cancelled_at, stripe_subscription_id, stripe_customer_id, \
              seats_used, seats_limit, metadata, created_at, updated_at",
            period_interval
        ),
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.plan_id)
    .bind(&billing_cycle)
    .bind(seats_limit)
    .fetch_one(&state.db)
    .await?;

    // Insert default usage meters for the plan
    let meter_types = vec![
        ("jobs", plan.max_jobs.map(|v| v as i64)),
        ("users", plan.max_users.map(|v| v as i64)),
        ("candidates", plan.max_candidates.map(|v| v as i64)),
    ];

    for (meter_type, limit_value) in meter_types {
        sqlx::query(
            "INSERT INTO usage_meters \
             (id, tenant_id, subscription_id, meter_type, current_value, limit_value, \
              period_start, period_end) \
             VALUES ($1, $2, $3, $4, 0, $5, NOW(), NOW() + INTERVAL '1 month')",
        )
        .bind(Uuid::new_v4())
        .bind(claims.tid)
        .bind(id)
        .bind(meter_type)
        .bind(limit_value)
        .execute(&state.db)
        .await?;
    }

    Ok((StatusCode::CREATED, Json(subscription)))
}

/// PUT /subscription/plan — change the current subscription's plan.
pub async fn change_plan(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ChangePlanRequest>,
) -> AppResult<Json<Subscription>> {
    // Verify the new plan exists and is active
    let new_plan: Plan = sqlx::query_as(
        "SELECT id, name, slug, description, price_monthly_cents, price_annual_cents, \
         max_jobs, max_users, max_candidates, features, is_active, \
         stripe_price_id_monthly, stripe_price_id_annual, sort_order, \
         created_at, updated_at \
         FROM plans WHERE id = $1 AND is_active = true",
    )
    .bind(payload.plan_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Plan not found".to_string()))?;

    let new_seats_limit = new_plan.max_users.unwrap_or(5);

    let subscription: Subscription = sqlx::query_as(
        "UPDATE subscriptions SET \
         plan_id = $2, seats_limit = $3, updated_at = NOW() \
         WHERE tenant_id = $1 AND status IN ('active', 'trialing') \
         RETURNING id, tenant_id, plan_id, status, billing_cycle, \
          current_period_start, current_period_end, trial_ends_at, \
          cancelled_at, stripe_subscription_id, stripe_customer_id, \
          seats_used, seats_limit, metadata, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(payload.plan_id)
    .bind(new_seats_limit)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Active subscription not found".to_string()))?;

    // Update usage meter limits to match the new plan
    let meter_updates = vec![
        ("jobs", new_plan.max_jobs.map(|v| v as i64)),
        ("users", new_plan.max_users.map(|v| v as i64)),
        ("candidates", new_plan.max_candidates.map(|v| v as i64)),
    ];

    for (meter_type, limit_value) in meter_updates {
        sqlx::query(
            "UPDATE usage_meters SET limit_value = $3, updated_at = NOW() \
             WHERE subscription_id = $1 AND meter_type = $2",
        )
        .bind(subscription.id)
        .bind(meter_type)
        .bind(limit_value)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(subscription))
}

/// POST /subscription/cancel — cancel the current subscription (effective at period end).
pub async fn cancel_subscription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<Subscription>> {
    let subscription: Subscription = sqlx::query_as(
        "UPDATE subscriptions SET \
         cancelled_at = NOW(), updated_at = NOW() \
         WHERE tenant_id = $1 AND status IN ('active', 'trialing') AND cancelled_at IS NULL \
         RETURNING id, tenant_id, plan_id, status, billing_cycle, \
          current_period_start, current_period_end, trial_ends_at, \
          cancelled_at, stripe_subscription_id, stripe_customer_id, \
          seats_used, seats_limit, metadata, created_at, updated_at",
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Active subscription not found".to_string()))?;

    Ok(Json(subscription))
}

/// GET /subscription/usage — list usage meters for the current subscription.
pub async fn get_usage(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<Vec<UsageMeter>>> {
    // Find the current active/trialing subscription
    let sub: (Uuid,) = sqlx::query_as(
        "SELECT id FROM subscriptions \
         WHERE tenant_id = $1 AND status IN ('active', 'trialing') \
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Active subscription not found".to_string()))?;

    let meters: Vec<UsageMeter> = sqlx::query_as(
        "SELECT id, tenant_id, subscription_id, meter_type, current_value, \
         limit_value, period_start, period_end, created_at, updated_at \
         FROM usage_meters \
         WHERE tenant_id = $1 AND subscription_id = $2 \
         ORDER BY meter_type ASC",
    )
    .bind(claims.tid)
    .bind(sub.0)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(meters))
}

/// GET /entitlements — list all entitlements for the current tenant.
pub async fn list_entitlements(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<Vec<Entitlement>>> {
    let entitlements: Vec<Entitlement> = sqlx::query_as(
        "SELECT id, tenant_id, feature_key, is_enabled, limit_value, \
         expires_at, source, created_at, updated_at \
         FROM entitlements \
         WHERE tenant_id = $1 \
         ORDER BY feature_key ASC",
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(entitlements))
}

/// GET /entitlements/:feature_key — check a specific entitlement.
pub async fn check_entitlement(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(feature_key): Path<String>,
) -> AppResult<Json<Entitlement>> {
    let entitlement: Entitlement = sqlx::query_as(
        "SELECT id, tenant_id, feature_key, is_enabled, limit_value, \
         expires_at, source, created_at, updated_at \
         FROM entitlements \
         WHERE tenant_id = $1 AND feature_key = $2",
    )
    .bind(claims.tid)
    .bind(&feature_key)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Entitlement not found".to_string()))?;

    Ok(Json(entitlement))
}
