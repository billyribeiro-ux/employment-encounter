use axum::{
    extract::{Extension, Query, State},
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::AppResult;
use crate::middleware::auth::require_role;
use crate::AppState;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AuditLogEntry {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub user_id: Option<Uuid>,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<Uuid>,
    pub details: serde_json::Value,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AuditLogQuery {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub user_id: Option<Uuid>,
    pub resource_type: Option<String>,
    pub action: Option<String>,
}

pub async fn list_audit_logs(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<AuditLogQuery>,
) -> AppResult<Json<serde_json::Value>> {
    require_role(&claims, "admin")?;

    let per_page = params.per_page.unwrap_or(50).min(200);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let mut conditions = vec!["tenant_id = $1".to_string()];
    let mut bind_idx = 2u32;

    if params.user_id.is_some() {
        conditions.push(format!("user_id = ${}", bind_idx));
        bind_idx += 1;
    }
    if params.resource_type.is_some() {
        conditions.push(format!("resource_type = ${}", bind_idx));
        bind_idx += 1;
    }
    if params.action.is_some() {
        conditions.push(format!("action ILIKE ${}", bind_idx));
        bind_idx += 1;
    }

    let where_clause = conditions.join(" AND ");
    let count_sql = format!("SELECT COUNT(*) FROM audit_logs WHERE {}", where_clause);
    let query_sql = format!(
        "SELECT id, tenant_id, user_id, action, resource_type, resource_id, details, \
         ip_address::TEXT as ip_address, user_agent, created_at \
         FROM audit_logs WHERE {} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, bind_idx, bind_idx + 1
    );

    // Build count query
    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(claims.tid);
    if let Some(uid) = params.user_id {
        count_q = count_q.bind(uid);
    }
    if let Some(ref rt) = params.resource_type {
        count_q = count_q.bind(rt);
    }
    if let Some(ref action) = params.action {
        count_q = count_q.bind(format!("%{}%", action));
    }
    let (total,) = count_q.fetch_one(&state.db).await?;

    // Build data query
    let mut data_q = sqlx::query_as::<_, AuditLogEntry>(&query_sql).bind(claims.tid);
    if let Some(uid) = params.user_id {
        data_q = data_q.bind(uid);
    }
    if let Some(ref rt) = params.resource_type {
        data_q = data_q.bind(rt);
    }
    if let Some(ref action) = params.action {
        data_q = data_q.bind(format!("%{}%", action));
    }
    let logs = data_q.bind(per_page).bind(offset).fetch_all(&state.db).await?;

    Ok(Json(serde_json::json!({
        "data": logs,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}
