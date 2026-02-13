use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::Claims;
use crate::clients::model::{PaginatedResponse, PaginationMeta};
use crate::error::{AppError, AppResult};
use crate::tasks::model::*;
use crate::AppState;

pub async fn list_tasks(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListTasksQuery>,
) -> AppResult<Json<PaginatedResponse<Task>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * per_page;

    let search_pattern = params
        .search
        .as_ref()
        .map(|s| format!("%{}%", s.to_lowercase()));

    // Build dynamic WHERE clause from filters
    let mut conditions = vec![
        "tenant_id = $1".to_string(),
        "deleted_at IS NULL".to_string(),
    ];
    let mut bind_idx = 2u32;

    if let Some(ref _search) = search_pattern {
        conditions.push(format!(
            "(LOWER(title) LIKE ${idx} OR LOWER(COALESCE(description, '')) LIKE ${idx})",
            idx = bind_idx
        ));
        bind_idx += 1;
    }
    if params.status.is_some() {
        conditions.push(format!("status = ${}", bind_idx));
        bind_idx += 1;
    }
    if params.priority.is_some() {
        conditions.push(format!("priority = ${}", bind_idx));
        bind_idx += 1;
    }
    if params.assigned_to.is_some() {
        conditions.push(format!("assigned_to = ${}", bind_idx));
        bind_idx += 1;
    }
    if params.client_id.is_some() {
        conditions.push(format!("client_id = ${}", bind_idx));
        bind_idx += 1;
    }

    let where_clause = conditions.join(" AND ");
    let count_sql = format!("SELECT COUNT(*) FROM tasks WHERE {}", where_clause);
    let data_sql = format!(
        "SELECT id, tenant_id, client_id, workflow_instance_id, workflow_step_index, title, description, status, priority, assigned_to, created_by, due_date, completed_at, is_recurring, recurrence_rule, sort_order, created_at, updated_at FROM tasks WHERE {} ORDER BY sort_order, created_at DESC LIMIT ${} OFFSET ${}",
        where_clause, bind_idx, bind_idx + 1
    );

    // Build count query with dynamic binds
    let mut count_q = sqlx::query_as::<_, (i64,)>(&count_sql).bind(claims.tid);
    if let Some(ref pattern) = search_pattern {
        count_q = count_q.bind(pattern);
    }
    if let Some(ref status) = params.status {
        count_q = count_q.bind(status);
    }
    if let Some(ref priority) = params.priority {
        count_q = count_q.bind(priority);
    }
    if let Some(assigned_to) = params.assigned_to {
        count_q = count_q.bind(assigned_to);
    }
    if let Some(client_id) = params.client_id {
        count_q = count_q.bind(client_id);
    }
    let (total,) = count_q.fetch_one(&state.db).await?;

    // Build data query with dynamic binds
    let mut data_q = sqlx::query_as::<_, Task>(&data_sql).bind(claims.tid);
    if let Some(ref pattern) = search_pattern {
        data_q = data_q.bind(pattern);
    }
    if let Some(ref status) = params.status {
        data_q = data_q.bind(status);
    }
    if let Some(ref priority) = params.priority {
        data_q = data_q.bind(priority);
    }
    if let Some(assigned_to) = params.assigned_to {
        data_q = data_q.bind(assigned_to);
    }
    if let Some(client_id) = params.client_id {
        data_q = data_q.bind(client_id);
    }
    let tasks = data_q
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: tasks,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn get_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<Uuid>,
) -> AppResult<Json<Task>> {
    let task: Task = sqlx::query_as(
        "SELECT id, tenant_id, client_id, workflow_instance_id, workflow_step_index, title, description, status, priority, assigned_to, created_by, due_date, completed_at, is_recurring, recurrence_rule, sort_order, created_at, updated_at FROM tasks WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(task_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    Ok(Json(task))
}

pub async fn create_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTaskRequest>,
) -> AppResult<(StatusCode, Json<Task>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let priority = payload.priority.as_deref().unwrap_or("medium");

    let valid_priorities = ["low", "medium", "high", "urgent"];
    if !valid_priorities.contains(&priority) {
        return Err(AppError::Validation(format!(
            "Invalid priority: '{}'. Must be one of: {}",
            priority,
            valid_priorities.join(", ")
        )));
    }

    let task: Task = sqlx::query_as(
        "INSERT INTO tasks (tenant_id, title, description, client_id, assigned_to, due_date, priority, workflow_instance_id, workflow_step_index, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, tenant_id, client_id, workflow_instance_id, workflow_step_index, title, description, status, priority, assigned_to, created_by, due_date, completed_at, is_recurring, recurrence_rule, sort_order, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(&payload.title)
    .bind(payload.description.as_deref())
    .bind(payload.client_id)
    .bind(payload.assigned_to)
    .bind(payload.due_date)
    .bind(priority)
    .bind(payload.workflow_instance_id)
    .bind(payload.workflow_step_index)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(task)))
}

pub async fn update_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<Uuid>,
    Json(payload): Json<UpdateTaskRequest>,
) -> AppResult<Json<Task>> {
    // Check task exists
    let existing: Task = sqlx::query_as(
        "SELECT id, tenant_id, client_id, workflow_instance_id, workflow_step_index, title, description, status, priority, assigned_to, created_by, due_date, completed_at, is_recurring, recurrence_rule, sort_order, created_at, updated_at FROM tasks WHERE id = $1 AND tenant_id = $2",
    )
    .bind(task_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    let title = payload.title.as_deref().unwrap_or(&existing.title);
    let status = payload.status.as_deref().unwrap_or(&existing.status);
    let priority = payload.priority.as_deref().unwrap_or(&existing.priority);

    let valid_priorities = ["low", "medium", "high", "urgent"];
    if !valid_priorities.contains(&priority) {
        return Err(AppError::Validation(format!(
            "Invalid priority: '{}'. Must be one of: {}",
            priority,
            valid_priorities.join(", ")
        )));
    }

    let valid_statuses = ["todo", "in_progress", "review", "done"];
    if !valid_statuses.contains(&status) {
        return Err(AppError::Validation(format!(
            "Invalid status: '{}'. Must be one of: {}",
            status,
            valid_statuses.join(", ")
        )));
    }

    let sort_order = payload.sort_order.unwrap_or(existing.sort_order);
    let due_date = payload.due_date.or(existing.due_date);
    let assigned_to = payload.assigned_to.or(existing.assigned_to);
    let description = payload
        .description
        .as_deref()
        .or(existing.description.as_deref());

    let completed_at = if status == "done" && existing.status != "done" {
        Some(chrono::Utc::now())
    } else if status != "done" {
        None
    } else {
        existing.completed_at
    };

    let task: Task = sqlx::query_as(
        "UPDATE tasks SET title = $3, description = $4, status = $5, priority = $6, assigned_to = $7, due_date = $8, sort_order = $9, completed_at = $10, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id, client_id, workflow_instance_id, workflow_step_index, title, description, status, priority, assigned_to, created_by, due_date, completed_at, is_recurring, recurrence_rule, sort_order, created_at, updated_at",
    )
    .bind(task_id)
    .bind(claims.tid)
    .bind(title)
    .bind(description)
    .bind(status)
    .bind(priority)
    .bind(assigned_to)
    .bind(due_date)
    .bind(sort_order)
    .bind(completed_at)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(task))
}

pub async fn delete_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(task_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(task_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Task not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ── Bulk Operations ──────────────────────────────────────────────────

pub async fn bulk_update_tasks(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BulkTaskUpdateRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.ids.is_empty() {
        return Err(AppError::Validation(
            "At least one ID is required".to_string(),
        ));
    }
    if payload.ids.len() > 100 {
        return Err(AppError::Validation(
            "Maximum 100 IDs per bulk operation".to_string(),
        ));
    }

    // Validate status if provided
    if let Some(ref status) = payload.status {
        let valid_statuses = ["todo", "in_progress", "review", "done"];
        if !valid_statuses.contains(&status.as_str()) {
            return Err(AppError::Validation(format!(
                "Invalid status: '{}'. Must be one of: {}",
                status,
                valid_statuses.join(", ")
            )));
        }
    }

    // Validate priority if provided
    if let Some(ref priority) = payload.priority {
        let valid_priorities = ["low", "medium", "high", "urgent"];
        if !valid_priorities.contains(&priority.as_str()) {
            return Err(AppError::Validation(format!(
                "Invalid priority: '{}'. Must be one of: {}",
                priority,
                valid_priorities.join(", ")
            )));
        }
    }

    // Build dynamic update
    let result = sqlx::query(
        "UPDATE tasks SET \
         status = COALESCE($3, status), \
         assigned_to = COALESCE($4, assigned_to), \
         priority = COALESCE($5, priority), \
         completed_at = CASE WHEN COALESCE($3, status) = 'done' AND status != 'done' THEN NOW() \
                             WHEN COALESCE($3, status) != 'done' THEN NULL \
                             ELSE completed_at END, \
         updated_at = NOW() \
         WHERE tenant_id = $1 AND deleted_at IS NULL AND id = ANY($2)",
    )
    .bind(claims.tid)
    .bind(&payload.ids)
    .bind(payload.status.as_deref())
    .bind(payload.assigned_to)
    .bind(payload.priority.as_deref())
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "updated": result.rows_affected(),
        "requested": payload.ids.len(),
    })))
}

pub async fn bulk_delete_tasks(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<BulkTaskIdsRequest>,
) -> AppResult<Json<serde_json::Value>> {
    if payload.ids.is_empty() {
        return Err(AppError::Validation(
            "At least one ID is required".to_string(),
        ));
    }
    if payload.ids.len() > 100 {
        return Err(AppError::Validation(
            "Maximum 100 IDs per bulk operation".to_string(),
        ));
    }

    let result = sqlx::query(
        "UPDATE tasks SET deleted_at = NOW() WHERE tenant_id = $1 AND deleted_at IS NULL AND id = ANY($2)",
    )
    .bind(claims.tid)
    .bind(&payload.ids)
    .execute(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "deleted": result.rows_affected(),
        "requested": payload.ids.len(),
    })))
}
