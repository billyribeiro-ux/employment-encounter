use axum::{
    extract::{Extension, Query, State},
    Json,
};

use crate::auth::jwt::Claims;
use crate::error::AppResult;
use crate::middleware::auth::require_role;
use crate::reports::model::*;
use crate::AppState;

pub async fn get_profit_loss(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ReportQuery>,
) -> AppResult<Json<ProfitLossReport>> {
    require_role(&claims, "manager")?;

    let start = params.start_date.as_deref().unwrap_or("2026-01-01");
    let end = params.end_date.as_deref().unwrap_or("2026-12-31");

    // Revenue: paid invoices in period
    let (revenue_cents,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount_paid_cents), 0)::BIGINT FROM invoices \
         WHERE tenant_id = $1 AND status = 'paid' AND paid_date >= $2::DATE AND paid_date <= $3::DATE"
    )
    .bind(claims.tid)
    .bind(start)
    .bind(end)
    .fetch_one(&state.db)
    .await?;

    // Revenue by service type from time entries linked to paid invoices
    let service_revenue: Vec<(Option<String>, i64)> = sqlx::query_as(
        "SELECT c.business_type, COALESCE(SUM(i.amount_paid_cents), 0)::BIGINT \
         FROM invoices i JOIN clients c ON c.id = i.client_id \
         WHERE i.tenant_id = $1 AND i.status = 'paid' AND i.paid_date >= $2::DATE AND i.paid_date <= $3::DATE \
         GROUP BY c.business_type ORDER BY 2 DESC"
    )
    .bind(claims.tid)
    .bind(start)
    .bind(end)
    .fetch_all(&state.db)
    .await?;

    let revenue_items: Vec<ReportLineItem> = service_revenue
        .into_iter()
        .map(|(label, amount)| ReportLineItem {
            label: label.unwrap_or_else(|| "Other".to_string()),
            amount_cents: amount,
        })
        .collect();

    // Expenses in period
    let (expense_cents,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount_cents), 0)::BIGINT FROM expenses \
         WHERE tenant_id = $1 AND date >= $2::DATE AND date <= $3::DATE"
    )
    .bind(claims.tid)
    .bind(start)
    .bind(end)
    .fetch_one(&state.db)
    .await?;

    let expense_by_category: Vec<(String, i64)> = sqlx::query_as(
        "SELECT category, COALESCE(SUM(amount_cents), 0)::BIGINT \
         FROM expenses WHERE tenant_id = $1 AND date >= $2::DATE AND date <= $3::DATE \
         GROUP BY category ORDER BY 2 DESC"
    )
    .bind(claims.tid)
    .bind(start)
    .bind(end)
    .fetch_all(&state.db)
    .await?;

    let expense_items: Vec<ReportLineItem> = expense_by_category
        .into_iter()
        .map(|(label, amount)| ReportLineItem {
            label,
            amount_cents: amount,
        })
        .collect();

    Ok(Json(ProfitLossReport {
        period_start: start.to_string(),
        period_end: end.to_string(),
        revenue: ProfitLossSection {
            total_cents: revenue_cents,
            items: revenue_items,
        },
        expenses: ProfitLossSection {
            total_cents: expense_cents,
            items: expense_items,
        },
        net_income_cents: revenue_cents - expense_cents,
    }))
}

pub async fn get_cash_flow(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ReportQuery>,
) -> AppResult<Json<CashFlowReport>> {
    require_role(&claims, "manager")?;

    let start = params.start_date.as_deref().unwrap_or("2026-01-01");
    let end = params.end_date.as_deref().unwrap_or("2026-12-31");

    // Monthly inflows (paid invoices)
    let inflows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT TO_CHAR(paid_date, 'YYYY-MM'), COALESCE(SUM(amount_paid_cents), 0)::BIGINT \
         FROM invoices WHERE tenant_id = $1 AND status = 'paid' \
         AND paid_date >= $2::DATE AND paid_date <= $3::DATE \
         GROUP BY TO_CHAR(paid_date, 'YYYY-MM') ORDER BY 1"
    )
    .bind(claims.tid)
    .bind(start)
    .bind(end)
    .fetch_all(&state.db)
    .await?;

    // Monthly outflows (expenses)
    let outflows: Vec<(String, i64)> = sqlx::query_as(
        "SELECT TO_CHAR(date, 'YYYY-MM'), COALESCE(SUM(amount_cents), 0)::BIGINT \
         FROM expenses WHERE tenant_id = $1 AND date >= $2::DATE AND date <= $3::DATE \
         GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY 1"
    )
    .bind(claims.tid)
    .bind(start)
    .bind(end)
    .fetch_all(&state.db)
    .await?;

    let inflow_entries: Vec<CashFlowEntry> = inflows
        .into_iter()
        .map(|(month, amount)| CashFlowEntry {
            month,
            amount_cents: amount,
        })
        .collect();

    let outflow_entries: Vec<CashFlowEntry> = outflows
        .into_iter()
        .map(|(month, amount)| CashFlowEntry {
            month,
            amount_cents: amount,
        })
        .collect();

    let total_in: i64 = inflow_entries.iter().map(|e| e.amount_cents).sum();
    let total_out: i64 = outflow_entries.iter().map(|e| e.amount_cents).sum();

    Ok(Json(CashFlowReport {
        period_start: start.to_string(),
        period_end: end.to_string(),
        inflows: inflow_entries,
        outflows: outflow_entries,
        net_cash_flow_cents: total_in - total_out,
    }))
}

pub async fn get_team_utilization(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    require_role(&claims, "manager")?;

    let utilization: Vec<(Uuid, String, String, i64, i64)> = sqlx::query_as(
        "SELECT u.id, u.first_name, u.last_name, \
         COALESCE(SUM(te.duration_minutes), 0)::BIGINT AS total_minutes, \
         COALESCE(SUM(CASE WHEN te.is_billable THEN te.duration_minutes ELSE 0 END), 0)::BIGINT AS billable_minutes \
         FROM users u \
         LEFT JOIN time_entries te ON te.user_id = u.id AND te.tenant_id = u.tenant_id \
           AND te.date >= date_trunc('month', CURRENT_DATE) \
         WHERE u.tenant_id = $1 AND u.status = 'active' AND u.role != 'client' \
         GROUP BY u.id, u.first_name, u.last_name \
         ORDER BY total_minutes DESC"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    use uuid::Uuid;

    let data: Vec<serde_json::Value> = utilization
        .into_iter()
        .map(|(id, first, last, total, billable)| {
            let utilization_pct = if total > 0 {
                (billable as f64 / total as f64 * 100.0).round()
            } else {
                0.0
            };
            serde_json::json!({
                "user_id": id,
                "name": format!("{} {}", first, last),
                "total_minutes": total,
                "billable_minutes": billable,
                "utilization_percent": utilization_pct,
            })
        })
        .collect();

    Ok(Json(serde_json::json!({ "data": data })))
}
