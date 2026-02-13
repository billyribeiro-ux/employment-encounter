use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::video_rooms::model::*;
use crate::AppState;

/// Generate an 8-character alphanumeric room code.
fn generate_room_code() -> String {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();
    (0..8)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

pub async fn create_room(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateRoomRequest>,
) -> AppResult<(StatusCode, Json<VideoRoom>)> {
    let room_code = generate_room_code();
    let max_participants = payload.max_participants.unwrap_or(10);
    let recording_enabled = payload.recording_enabled.unwrap_or(false);

    let room: VideoRoom = sqlx::query_as(
        "INSERT INTO video_rooms \
         (tenant_id, name, meeting_id, room_code, status, max_participants, \
          recording_enabled, created_by, metadata) \
         VALUES ($1, $2, $3, $4, 'created', $5, $6, $7, '{}'::jsonb) \
         RETURNING id, tenant_id, name, meeting_id, room_code, status, max_participants, \
         recording_enabled, created_by, started_at, ended_at, metadata, created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(payload.name.as_deref())
    .bind(payload.meeting_id)
    .bind(&room_code)
    .bind(max_participants)
    .bind(recording_enabled)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(room)))
}

pub async fn list_rooms(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListRoomsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;
    let status_filter = params.status.as_deref().unwrap_or("");

    let rooms: Vec<VideoRoom> = sqlx::query_as(
        "SELECT id, tenant_id, name, meeting_id, room_code, status, max_participants, \
         recording_enabled, created_by, started_at, ended_at, metadata, created_at, updated_at \
         FROM video_rooms \
         WHERE tenant_id = $1 \
         AND ($4 = '' OR status = $4) \
         ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(claims.tid)
    .bind(per_page)
    .bind(offset)
    .bind(status_filter)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM video_rooms \
         WHERE tenant_id = $1 AND ($2 = '' OR status = $2)",
    )
    .bind(claims.tid)
    .bind(status_filter)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "data": rooms,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn get_room(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<VideoRoom>> {
    let room: VideoRoom = sqlx::query_as(
        "SELECT id, tenant_id, name, meeting_id, room_code, status, max_participants, \
         recording_enabled, created_by, started_at, ended_at, metadata, created_at, updated_at \
         FROM video_rooms \
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Video room not found".to_string()))?;

    Ok(Json(room))
}

pub async fn join_room(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    // Verify room exists
    let room: VideoRoom = sqlx::query_as(
        "SELECT id, tenant_id, name, meeting_id, room_code, status, max_participants, \
         recording_enabled, created_by, started_at, ended_at, metadata, created_at, updated_at \
         FROM video_rooms \
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Video room not found".to_string()))?;

    // Generate token
    let token_hash = Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(4);

    // Insert token
    let token: VideoRoomToken = sqlx::query_as(
        "INSERT INTO video_room_tokens \
         (tenant_id, room_id, user_id, token_hash, role, expires_at) \
         VALUES ($1, $2, $3, $4, 'participant', $5) \
         RETURNING id, tenant_id, room_id, user_id, token_hash, role, \
         expires_at, used_at, revoked_at, created_at",
    )
    .bind(claims.tid)
    .bind(id)
    .bind(claims.sub)
    .bind(&token_hash)
    .bind(expires_at)
    .fetch_one(&state.db)
    .await?;

    // If room is in 'created' state, activate it
    if room.status == "created" {
        sqlx::query(
            "UPDATE video_rooms SET status = 'active', started_at = NOW(), updated_at = NOW() \
             WHERE id = $1 AND tenant_id = $2",
        )
        .bind(id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;
    }

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "token": token.token_hash,
            "room_id": id,
            "expires_at": token.expires_at
        })),
    ))
}

pub async fn end_room(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<VideoRoom>> {
    // End the room
    let room: VideoRoom = sqlx::query_as(
        "UPDATE video_rooms SET status = 'ended', ended_at = NOW(), updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, name, meeting_id, room_code, status, max_participants, \
         recording_enabled, created_by, started_at, ended_at, metadata, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Video room not found".to_string()))?;

    // Calculate duration and participant count for session record
    let duration_seconds = match (room.started_at, room.ended_at) {
        (Some(start), Some(end)) => Some((end - start).num_seconds() as i32),
        _ => None,
    };

    let (participant_count,): (i64,) = sqlx::query_as(
        "SELECT COUNT(DISTINCT user_id) FROM video_room_tokens \
         WHERE room_id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    // Create session record
    sqlx::query(
        "INSERT INTO video_sessions \
         (tenant_id, room_id, started_at, ended_at, duration_seconds, participant_count, metadata) \
         VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb)",
    )
    .bind(claims.tid)
    .bind(id)
    .bind(room.started_at.unwrap_or_else(chrono::Utc::now))
    .bind(room.ended_at)
    .bind(duration_seconds)
    .bind(participant_count as i32)
    .execute(&state.db)
    .await?;

    Ok(Json(room))
}

pub async fn list_sessions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Vec<VideoSession>>> {
    let sessions: Vec<VideoSession> = sqlx::query_as(
        "SELECT id, tenant_id, room_id, started_at, ended_at, duration_seconds, \
         participant_count, quality_score, metadata, created_at \
         FROM video_sessions \
         WHERE room_id = $1 AND tenant_id = $2 \
         ORDER BY created_at DESC",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(sessions))
}
