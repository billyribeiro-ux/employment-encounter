use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::conversations::model::*;
use crate::error::{AppError, AppResult};
use crate::ws::WsEventPayload;
use crate::AppState;

pub async fn list_conversations(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListConversationsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let conversations: Vec<Conversation> = sqlx::query_as(
        r#"SELECT c.id, c.tenant_id, c."type", c.title, c.created_by,
           c.last_message_at, c.last_message_preview, c.is_archived,
           c.metadata, c.created_at, c.updated_at
           FROM conversations c
           INNER JOIN conversation_participants cp ON cp.conversation_id = c.id
           WHERE c.tenant_id = $1 AND cp.user_id = $2
           ORDER BY c.last_message_at DESC NULLS LAST
           LIMIT $3 OFFSET $4"#,
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM conversations c \
         INNER JOIN conversation_participants cp ON cp.conversation_id = c.id \
         WHERE c.tenant_id = $1 AND cp.user_id = $2",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "data": conversations,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn create_conversation(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateConversationRequest>,
) -> AppResult<(StatusCode, Json<Conversation>)> {
    let conversation: Conversation = sqlx::query_as(
        r#"INSERT INTO conversations (tenant_id, "type", title, created_by, metadata)
           VALUES ($1, $2, $3, $4, '{}'::jsonb)
           RETURNING id, tenant_id, "type", title, created_by, last_message_at,
           last_message_preview, is_archived, metadata, created_at, updated_at"#,
    )
    .bind(claims.tid)
    .bind(&payload.type_)
    .bind(payload.title.as_deref())
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    // Insert creator as 'owner'
    sqlx::query(
        "INSERT INTO conversation_participants (tenant_id, conversation_id, user_id, role, joined_at) \
         VALUES ($1, $2, $3, 'owner', NOW())",
    )
    .bind(claims.tid)
    .bind(conversation.id)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    // Insert other participants as 'member'
    for user_id in &payload.participant_ids {
        if *user_id != claims.sub {
            sqlx::query(
                "INSERT INTO conversation_participants (tenant_id, conversation_id, user_id, role, joined_at) \
                 VALUES ($1, $2, $3, 'member', NOW())",
            )
            .bind(claims.tid)
            .bind(conversation.id)
            .bind(user_id)
            .execute(&state.db)
            .await?;
        }
    }

    Ok((StatusCode::CREATED, Json(conversation)))
}

pub async fn get_conversation(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let conversation: Conversation = sqlx::query_as(
        r#"SELECT id, tenant_id, "type", title, created_by, last_message_at,
           last_message_preview, is_archived, metadata, created_at, updated_at
           FROM conversations
           WHERE id = $1 AND tenant_id = $2"#,
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Conversation not found".to_string()))?;

    let participants: Vec<ConversationParticipant> = sqlx::query_as(
        "SELECT id, tenant_id, conversation_id, user_id, role, last_read_at, \
         is_muted, joined_at, created_at \
         FROM conversation_participants \
         WHERE conversation_id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "conversation": conversation,
        "participants": participants
    })))
}

pub async fn list_conversation_messages(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Query(params): Query<ListMessagesQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;
    let search = params.search.as_deref().unwrap_or("");
    let search_pattern = format!("%{}%", search.to_lowercase());

    let messages: Vec<ChatMessageWithSender> = sqlx::query_as(
        "SELECT m.id, m.tenant_id, m.conversation_id, m.sender_id, m.content, \
         m.message_type, m.parent_id, m.is_edited, m.is_deleted, m.metadata, \
         m.created_at, m.updated_at, \
         COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') AS sender_name \
         FROM chat_messages m \
         LEFT JOIN users u ON u.id = m.sender_id \
         WHERE m.tenant_id = $1 AND m.conversation_id = $2 \
         AND ($5 = '' OR LOWER(m.content) LIKE $6) \
         ORDER BY m.created_at DESC LIMIT $3 OFFSET $4",
    )
    .bind(claims.tid)
    .bind(id)
    .bind(per_page)
    .bind(offset)
    .bind(search)
    .bind(&search_pattern)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM chat_messages \
         WHERE tenant_id = $1 AND conversation_id = $2 \
         AND ($3 = '' OR LOWER(content) LIKE $4)",
    )
    .bind(claims.tid)
    .bind(id)
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

pub async fn send_message(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<SendMessageRequest>,
) -> AppResult<(StatusCode, Json<ChatMessage>)> {
    let message_type = payload.message_type.as_deref().unwrap_or("text");

    let message: ChatMessage = sqlx::query_as(
        "INSERT INTO chat_messages (tenant_id, conversation_id, sender_id, content, message_type, parent_id, metadata) \
         VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb) \
         RETURNING id, tenant_id, conversation_id, sender_id, content, message_type, \
         parent_id, is_edited, is_deleted, metadata, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(id)
    .bind(claims.sub)
    .bind(&payload.content)
    .bind(message_type)
    .bind(payload.parent_id)
    .fetch_one(&state.db)
    .await?;

    // Update conversation last_message_at and last_message_preview
    let preview = if payload.content.len() > 100 {
        format!("{}...", &payload.content[..100])
    } else {
        payload.content.clone()
    };

    sqlx::query(
        "UPDATE conversations SET last_message_at = NOW(), last_message_preview = $1, updated_at = NOW() \
         WHERE id = $2 AND tenant_id = $3",
    )
    .bind(&preview)
    .bind(id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    // Look up sender name for broadcast
    let sender_name: String = sqlx::query_scalar(
        "SELECT COALESCE(first_name || ' ' || last_name, 'Unknown') FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(&state.db)
    .await?
    .unwrap_or_else(|| "Unknown".to_string());

    // Broadcast via WebSocket
    state.ws_broadcast.send_to_tenant(
        claims.tid,
        WsEventPayload::NewMessage {
            id: message.id,
            client_id: id, // conversation_id used as client_id context
            sender_name,
            preview,
        },
    );

    Ok((StatusCode::CREATED, Json(message)))
}

pub async fn mark_conversation_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    sqlx::query(
        "UPDATE conversation_participants SET last_read_at = NOW() \
         WHERE user_id = $1 AND conversation_id = $2 AND tenant_id = $3",
    )
    .bind(claims.sub)
    .bind(id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    Ok(StatusCode::NO_CONTENT)
}
