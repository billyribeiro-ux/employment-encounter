use axum::{extract::{Extension, State}, Json};
use serde::Serialize;

use crate::auth::jwt::Claims;
use crate::error::AppResult;
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub active_clients: i64,
    pub total_documents: i64,
    pub hours_this_week: f64,
    pub outstanding_invoices: i64,
    pub outstanding_amount_cents: i64,
    pub revenue_mtd_cents: i64,
}

pub async fn get_dashboard_stats(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<DashboardStats>> {
    let (active_clients,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM clients WHERE tenant_id = $1 AND status = 'active' AND deleted_at IS NULL",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (total_documents,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM documents WHERE tenant_id = $1 AND deleted_at IS NULL",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (hours_this_week_minutes,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM time_entries WHERE tenant_id = $1 AND date >= date_trunc('week', CURRENT_DATE)",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (outstanding_invoices,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM invoices WHERE tenant_id = $1 AND status IN ('sent', 'viewed', 'overdue')",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (outstanding_amount_cents,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(total_cents - amount_paid_cents), 0) FROM invoices WHERE tenant_id = $1 AND status IN ('sent', 'viewed', 'overdue')",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (revenue_mtd_cents,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount_paid_cents), 0) FROM invoices WHERE tenant_id = $1 AND status = 'paid' AND paid_date >= date_trunc('month', CURRENT_DATE)",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(DashboardStats {
        active_clients,
        total_documents,
        hours_this_week: hours_this_week_minutes as f64 / 60.0,
        outstanding_invoices,
        outstanding_amount_cents,
        revenue_mtd_cents,
    }))
}
