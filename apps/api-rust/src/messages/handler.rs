use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::messages::model::*;
use crate::ws::WsEventPayload;
use crate::AppState;

pub async fn list_messages_for_client(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
    Query(params): Query<ListMessagesQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;
    let search = params.search.as_deref().unwrap_or("");
    let search_pattern = format!("%{}%", search.to_lowercase());

    let messages: Vec<MessageWithSender> = sqlx::query_as(
        "SELECT m.id, m.tenant_id, m.client_id, m.sender_id, m.parent_id, m.content, \
         m.is_internal, m.is_read, m.read_at, m.created_at, m.updated_at, \
         COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS sender_name \
         FROM messages m \
         LEFT JOIN users u ON u.id = m.sender_id \
         WHERE m.tenant_id = $1 AND m.client_id = $2 \
         AND ($5 = '' OR LOWER(m.content) LIKE $6) \
         ORDER BY m.created_at DESC LIMIT $3 OFFSET $4",
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(per_page)
    .bind(offset)
    .bind(search)
    .bind(&search_pattern)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM messages WHERE tenant_id = $1 AND client_id = $2 \
         AND ($3 = '' OR LOWER(content) LIKE $4)",
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(search)
    .bind(&search_pattern)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "data": messages,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn create_message(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateMessageRequest>,
) -> AppResult<(StatusCode, Json<MessageWithSender>)> {
    let is_internal = payload.is_internal.unwrap_or(false);

    let message: Message = sqlx::query_as(
        "INSERT INTO messages (tenant_id, client_id, sender_id, parent_id, content, is_internal) \
         VALUES ($1, $2, $3, $4, $5, $6) \
         RETURNING id, tenant_id, client_id, sender_id, parent_id, content, is_internal, is_read, read_at, created_at, updated_at"
    )
    .bind(claims.tid)
    .bind(payload.client_id)
    .bind(claims.sub)
    .bind(payload.parent_id)
    .bind(&payload.content)
    .bind(is_internal)
    .fetch_one(&state.db)
    .await?;

    // Insert attachments if provided
    if let Some(attachment_ids) = &payload.attachment_ids {
        for doc_id in attachment_ids {
            sqlx::query(
                "INSERT INTO message_attachments (tenant_id, message_id, document_id) VALUES ($1, $2, $3)"
            )
            .bind(claims.tid)
            .bind(message.id)
            .bind(doc_id)
            .execute(&state.db)
            .await?;
        }
    }

    // Look up sender name for response and WebSocket broadcast
    let sender_name: String = sqlx::query_scalar(
        "SELECT COALESCE(first_name || ' ' || last_name, 'Unknown') FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .unwrap_or_else(|| "Unknown".to_string());

    // Broadcast new message to all tenant users via WebSocket
    let preview = if payload.content.len() > 100 {
        format!("{}...", &payload.content[..100])
    } else {
        payload.content.clone()
    };
    state.ws_broadcast.send_to_tenant(
        claims.tid,
        WsEventPayload::NewMessage {
            id: message.id,
            client_id: message.client_id,
            sender_name: sender_name.clone(),
            preview,
        },
    );

    let response = MessageWithSender {
        id: message.id,
        tenant_id: message.tenant_id,
        client_id: message.client_id,
        sender_id: message.sender_id,
        parent_id: message.parent_id,
        content: message.content,
        is_internal: message.is_internal,
        is_read: message.is_read,
        read_at: message.read_at,
        created_at: message.created_at,
        updated_at: message.updated_at,
        sender_name,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn mark_message_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(message_id): Path<Uuid>,
) -> AppResult<Json<Message>> {
    let message: Message = sqlx::query_as(
        "UPDATE messages SET is_read = TRUE, read_at = NOW(), updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, client_id, sender_id, parent_id, content, is_internal, is_read, read_at, created_at, updated_at"
    )
    .bind(message_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Message not found".to_string()))?;

    // Broadcast read receipt
    state.ws_broadcast.send_to_tenant(
        claims.tid,
        WsEventPayload::MessageRead {
            message_id: message.id,
            client_id: message.client_id,
            reader_id: claims.sub,
        },
    );

    Ok(Json(message))
}

pub async fn mark_conversation_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(client_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query(
        "UPDATE messages SET is_read = TRUE, read_at = NOW(), updated_at = NOW() \
         WHERE tenant_id = $1 AND client_id = $2 AND sender_id != $3 AND is_read = FALSE",
    )
    .bind(claims.tid)
    .bind(client_id)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_unread_counts(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> AppResult<Json<serde_json::Value>> {
    let counts: Vec<(Uuid, i64)> = sqlx::query_as(
        "SELECT client_id, COUNT(*) \
         FROM messages \
         WHERE tenant_id = $1 AND sender_id != $2 AND is_read = FALSE \
         GROUP BY client_id",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    let map: std::collections::HashMap<String, i64> = counts
        .into_iter()
        .map(|(cid, count)| (cid.to_string(), count))
        .collect();

    Ok(Json(serde_json::json!(map)))
}

pub async fn delete_message(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(message_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result =
        sqlx::query("DELETE FROM messages WHERE id = $1 AND tenant_id = $2 AND sender_id = $3")
            .bind(message_id)
            .bind(claims.tid)
            .bind(claims.sub)
            .execute(&state.db)
            .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(
            "Message not found or not owned by you".to_string(),
        ));
    }

    Ok(StatusCode::NO_CONTENT)
}
