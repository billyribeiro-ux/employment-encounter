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
        "SELECT COALESCE(SUM(duration_minutes), 0)::BIGINT FROM time_entries WHERE tenant_id = $1 AND date >= date_trunc('week', CURRENT_DATE)",
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
        "SELECT COALESCE(SUM(total_cents - amount_paid_cents), 0)::BIGINT FROM invoices WHERE tenant_id = $1 AND status IN ('sent', 'viewed', 'overdue')",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (revenue_mtd_cents,): (i64,) = sqlx::query_as(
        "SELECT COALESCE(SUM(amount_paid_cents), 0)::BIGINT FROM invoices WHERE tenant_id = $1 AND status = 'paid' AND paid_date >= date_trunc('month', CURRENT_DATE)",
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

// ── Hiring Stats ─────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct HiringStats {
    pub total_open_jobs: i64,
    pub total_applications: i64,
    pub applications_this_week: i64,
    pub time_to_hire_avg_days: Option<f64>,
    pub conversion_rates: Vec<StageConversion>,
    pub top_sources: Vec<SourceCount>,
    pub pipeline_by_stage: Vec<StageCount>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StageConversion {
    pub stage: String,
    pub count: i64,
    pub rate_pct: f64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct SourceCount {
    pub source: String,
    pub count: i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StageCount {
    pub stage: String,
    pub count: i64,
}

pub async fn get_hiring_stats(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<HiringStats>> {
    // Total open jobs
    let (total_open_jobs,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM job_posts WHERE tenant_id = $1 AND status IN ('open', 'draft')"
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    // Total applications
    let (total_applications,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM applications WHERE tenant_id = $1"
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    // Applications this week
    let (applications_this_week,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM applications WHERE tenant_id = $1 \
         AND created_at >= date_trunc('week', CURRENT_DATE)"
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    // Average time to hire (days from application created_at to hired_at)
    let (time_to_hire_avg_days,): (Option<f64>,) = sqlx::query_as(
        "SELECT AVG(EXTRACT(EPOCH FROM (hired_at - created_at)) / 86400.0) \
         FROM applications WHERE tenant_id = $1 AND hired_at IS NOT NULL"
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    // Pipeline by stage (conversion rates)
    let stage_counts: Vec<StageCount> = sqlx::query_as(
        "SELECT stage, COUNT(*)::BIGINT as count FROM applications \
         WHERE tenant_id = $1 AND status = 'active' \
         GROUP BY stage ORDER BY \
         CASE stage \
           WHEN 'applied' THEN 1 \
           WHEN 'screening' THEN 2 \
           WHEN 'phone_screen' THEN 3 \
           WHEN 'technical' THEN 4 \
           WHEN 'onsite' THEN 5 \
           WHEN 'offer' THEN 6 \
           WHEN 'hired' THEN 7 \
           ELSE 8 END"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    // Build conversion rates
    let total_for_rate = if total_applications > 0 { total_applications } else { 1 };
    let conversion_rates: Vec<StageConversion> = stage_counts
        .iter()
        .map(|sc| StageConversion {
            stage: sc.stage.clone(),
            count: sc.count,
            rate_pct: (sc.count as f64 / total_for_rate as f64) * 100.0,
        })
        .collect();

    // Top sources
    let top_sources: Vec<SourceCount> = sqlx::query_as(
        "SELECT COALESCE(source, 'unknown') as source, COUNT(*)::BIGINT as count \
         FROM applications WHERE tenant_id = $1 \
         GROUP BY source ORDER BY count DESC LIMIT 10"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    // Pipeline by stage (all statuses)
    let pipeline_by_stage: Vec<StageCount> = sqlx::query_as(
        "SELECT stage, COUNT(*)::BIGINT as count FROM applications \
         WHERE tenant_id = $1 \
         GROUP BY stage ORDER BY count DESC"
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(HiringStats {
        total_open_jobs,
        total_applications,
        applications_this_week,
        time_to_hire_avg_days,
        conversion_rates,
        top_sources,
        pipeline_by_stage,
    }))
}
