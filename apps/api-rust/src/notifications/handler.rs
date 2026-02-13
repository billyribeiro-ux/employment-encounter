use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::notifications::model::*;
use crate::AppState;

pub async fn list_notifications(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListNotificationsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(25).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;
    let unread_only = params.unread_only.unwrap_or(false);

    let notifications: Vec<Notification> = if unread_only {
        sqlx::query_as(
            "SELECT id, tenant_id, user_id, type, title, body, resource_type, resource_id, is_read, read_at, created_at \
             FROM notifications WHERE tenant_id = $1 AND user_id = $2 AND is_read = FALSE \
             ORDER BY created_at DESC LIMIT $3 OFFSET $4"
        )
        .bind(claims.tid)
        .bind(claims.sub)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT id, tenant_id, user_id, type, title, body, resource_type, resource_id, is_read, read_at, created_at \
             FROM notifications WHERE tenant_id = $1 AND user_id = $2 \
             ORDER BY created_at DESC LIMIT $3 OFFSET $4"
        )
        .bind(claims.tid)
        .bind(claims.sub)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let (total,): (i64,) = if unread_only {
        sqlx::query_as(
            "SELECT COUNT(*) FROM notifications WHERE tenant_id = $1 AND user_id = $2 AND is_read = FALSE"
        )
        .bind(claims.tid)
        .bind(claims.sub)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as("SELECT COUNT(*) FROM notifications WHERE tenant_id = $1 AND user_id = $2")
            .bind(claims.tid)
            .bind(claims.sub)
            .fetch_one(&state.db)
            .await?
    };

    Ok(Json(serde_json::json!({
        "data": notifications,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn get_unread_count(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let (count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM notifications WHERE tenant_id = $1 AND user_id = $2 AND is_read = FALSE"
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({ "unread_count": count })))
}

pub async fn mark_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(notification_id): Path<Uuid>,
) -> AppResult<Json<Notification>> {
    let notification: Notification = sqlx::query_as(
        "UPDATE notifications SET is_read = TRUE, read_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 AND user_id = $3 \
         RETURNING id, tenant_id, user_id, type, title, body, resource_type, resource_id, is_read, read_at, created_at"
    )
    .bind(notification_id)
    .bind(claims.tid)
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Notification not found".to_string()))?;

    Ok(Json(notification))
}

pub async fn mark_all_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let result = sqlx::query(
        "UPDATE notifications SET is_read = TRUE, read_at = NOW() \
         WHERE tenant_id = $1 AND user_id = $2 AND is_read = FALSE",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    Ok(Json(
        serde_json::json!({ "updated": result.rows_affected() }),
    ))
}

pub async fn create_notification(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateNotificationRequest>,
) -> AppResult<(StatusCode, Json<Notification>)> {
    let notification: Notification = sqlx::query_as(
        "INSERT INTO notifications (tenant_id, user_id, type, title, body, resource_type, resource_id) \
         VALUES ($1, $2, $3, $4, $5, $6, $7) \
         RETURNING id, tenant_id, user_id, type, title, body, resource_type, resource_id, is_read, read_at, created_at"
    )
    .bind(claims.tid)
    .bind(payload.user_id)
    .bind(&payload.r#type)
    .bind(&payload.title)
    .bind(&payload.body)
    .bind(&payload.resource_type)
    .bind(payload.resource_id)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(notification)))
}

pub async fn delete_notification(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(notification_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result =
        sqlx::query("DELETE FROM notifications WHERE id = $1 AND tenant_id = $2 AND user_id = $3")
            .bind(notification_id)
            .bind(claims.tid)
            .bind(claims.sub)
            .execute(&state.db)
            .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Notification not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
