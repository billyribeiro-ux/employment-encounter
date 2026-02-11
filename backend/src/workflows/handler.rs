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
use crate::workflows::model::*;
use crate::AppState;

// --- Templates ---

pub async fn list_templates(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<Vec<WorkflowTemplate>>> {
    let templates: Vec<WorkflowTemplate> = sqlx::query_as(
        "SELECT id, tenant_id, name, description, category, steps, is_active, created_by, created_at, updated_at FROM workflow_templates WHERE tenant_id = $1 AND is_active = true ORDER BY name",
    )
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(templates))
}

pub async fn create_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateTemplateRequest>,
) -> AppResult<(StatusCode, Json<WorkflowTemplate>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let template: WorkflowTemplate = sqlx::query_as(
        "INSERT INTO workflow_templates (tenant_id, name, description, category, steps, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, tenant_id, name, description, category, steps, is_active, created_by, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(&payload.name)
    .bind(payload.description.as_deref())
    .bind(payload.category.as_deref())
    .bind(&payload.steps)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(template)))
}

// --- Instances ---

pub async fn list_instances(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListWorkflowsQuery>,
) -> AppResult<Json<PaginatedResponse<WorkflowInstance>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM workflow_instances WHERE tenant_id = $1",
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let instances: Vec<WorkflowInstance> = sqlx::query_as(
        "SELECT id, tenant_id, template_id, client_id, name, status, current_step_index, started_at, completed_at, due_date, assigned_to, metadata, created_by, created_at, updated_at FROM workflow_instances WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(claims.tid)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: instances,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn get_instance(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(instance_id): Path<Uuid>,
) -> AppResult<Json<WorkflowInstance>> {
    let instance: WorkflowInstance = sqlx::query_as(
        "SELECT id, tenant_id, template_id, client_id, name, status, current_step_index, started_at, completed_at, due_date, assigned_to, metadata, created_by, created_at, updated_at FROM workflow_instances WHERE id = $1 AND tenant_id = $2",
    )
    .bind(instance_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Workflow not found".to_string()))?;

    Ok(Json(instance))
}

pub async fn create_instance(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateInstanceRequest>,
) -> AppResult<(StatusCode, Json<WorkflowInstance>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let instance: WorkflowInstance = sqlx::query_as(
        "INSERT INTO workflow_instances (tenant_id, template_id, client_id, name, due_date, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, tenant_id, template_id, client_id, name, status, current_step_index, started_at, completed_at, due_date, assigned_to, metadata, created_by, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(payload.template_id)
    .bind(payload.client_id)
    .bind(&payload.name)
    .bind(payload.due_date)
    .bind(payload.assigned_to)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // Log the first step as started
    let steps = sqlx::query_as::<_, (serde_json::Value,)>(
        "SELECT steps FROM workflow_templates WHERE id = $1 AND tenant_id = $2",
    )
    .bind(payload.template_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?;

    if let Some((steps_json,)) = steps {
        if let Some(first_step) = steps_json.as_array().and_then(|a| a.first()) {
            let step_name = first_step
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("Step 1");

            sqlx::query(
                "INSERT INTO workflow_step_logs (tenant_id, instance_id, step_index, step_name, action, performed_by) VALUES ($1, $2, 0, $3, 'started', $4)",
            )
            .bind(claims.tid)
            .bind(instance.id)
            .bind(step_name)
            .bind(claims.sub)
            .execute(&state.db)
            .await?;
        }
    }

    Ok((StatusCode::CREATED, Json(instance)))
}

pub async fn advance_step(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(instance_id): Path<Uuid>,
    Json(payload): Json<AdvanceStepRequest>,
) -> AppResult<Json<WorkflowInstance>> {
    let valid_actions = ["completed", "skipped", "rejected", "returned"];
    if !valid_actions.contains(&payload.action.as_str()) {
        return Err(AppError::Validation(format!(
            "Invalid action: {}. Must be one of: {}",
            payload.action,
            valid_actions.join(", ")
        )));
    }

    // Get current instance
    let instance: WorkflowInstance = sqlx::query_as(
        "SELECT id, tenant_id, template_id, client_id, name, status, current_step_index, started_at, completed_at, due_date, assigned_to, metadata, created_by, created_at, updated_at FROM workflow_instances WHERE id = $1 AND tenant_id = $2",
    )
    .bind(instance_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Workflow not found".to_string()))?;

    if instance.status != "active" {
        return Err(AppError::Validation("Workflow is not active".to_string()));
    }

    // Get template steps to determine total count and step name
    let (steps_json,): (serde_json::Value,) = sqlx::query_as(
        "SELECT steps FROM workflow_templates WHERE id = $1 AND tenant_id = $2",
    )
    .bind(instance.template_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let empty_vec = vec![];
    let steps_array = steps_json.as_array().unwrap_or(&empty_vec);
    let current_step_name = steps_array
        .get(instance.current_step_index as usize)
        .and_then(|s| s.get("name"))
        .and_then(|n| n.as_str())
        .unwrap_or("Unknown Step");

    // Log the action on current step
    sqlx::query(
        "INSERT INTO workflow_step_logs (tenant_id, instance_id, step_index, step_name, action, performed_by, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    )
    .bind(claims.tid)
    .bind(instance_id)
    .bind(instance.current_step_index)
    .bind(current_step_name)
    .bind(&payload.action)
    .bind(claims.sub)
    .bind(payload.notes.as_deref())
    .execute(&state.db)
    .await?;

    // Determine next step
    let next_index = match payload.action.as_str() {
        "completed" | "skipped" => instance.current_step_index + 1,
        "returned" => (instance.current_step_index - 1).max(0),
        _ => instance.current_step_index,
    };

    let is_complete = next_index >= steps_array.len() as i32;
    let new_status = if is_complete { "completed" } else { "active" };

    let updated: WorkflowInstance = sqlx::query_as(
        "UPDATE workflow_instances SET current_step_index = $3, status = $4, completed_at = CASE WHEN $4 = 'completed' THEN NOW() ELSE completed_at END, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id, tenant_id, template_id, client_id, name, status, current_step_index, started_at, completed_at, due_date, assigned_to, metadata, created_by, created_at, updated_at",
    )
    .bind(instance_id)
    .bind(claims.tid)
    .bind(next_index)
    .bind(new_status)
    .fetch_one(&state.db)
    .await?;

    // Log next step as started if not complete
    if !is_complete {
        let next_step_name = steps_array
            .get(next_index as usize)
            .and_then(|s| s.get("name"))
            .and_then(|n| n.as_str())
            .unwrap_or("Unknown Step");

        sqlx::query(
            "INSERT INTO workflow_step_logs (tenant_id, instance_id, step_index, step_name, action, performed_by) VALUES ($1, $2, $3, $4, 'started', $5)",
        )
        .bind(claims.tid)
        .bind(instance_id)
        .bind(next_index)
        .bind(next_step_name)
        .bind(claims.sub)
        .execute(&state.db)
        .await?;
    }

    Ok(Json(updated))
}

pub async fn get_step_logs(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(instance_id): Path<Uuid>,
) -> AppResult<Json<Vec<WorkflowStepLog>>> {
    let logs: Vec<WorkflowStepLog> = sqlx::query_as(
        "SELECT id, tenant_id, instance_id, step_index, step_name, action, performed_by, notes, created_at FROM workflow_step_logs WHERE instance_id = $1 AND tenant_id = $2 ORDER BY created_at",
    )
    .bind(instance_id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(logs))
}

pub async fn delete_instance(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(instance_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    // Delete step logs first
    sqlx::query("DELETE FROM workflow_step_logs WHERE instance_id = $1 AND tenant_id = $2")
        .bind(instance_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    let result = sqlx::query("DELETE FROM workflow_instances WHERE id = $1 AND tenant_id = $2")
        .bind(instance_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Workflow not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(template_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    // Check for existing instances using this template
    let (instance_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM workflow_instances WHERE template_id = $1 AND tenant_id = $2",
    )
    .bind(template_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    if instance_count > 0 {
        return Err(AppError::Validation(format!(
            "Cannot delete template with {} active instance(s). Delete instances first.",
            instance_count
        )));
    }

    let result = sqlx::query("DELETE FROM workflow_templates WHERE id = $1 AND tenant_id = $2")
        .bind(template_id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Template not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
