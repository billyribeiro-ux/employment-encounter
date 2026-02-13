use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::interviews::model::*;
use crate::AppState;

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

/// POST /interviews/rooms
pub async fn create_room(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateInterviewRoomRequest>,
) -> AppResult<(StatusCode, Json<InterviewRoom>)> {
    let room_code = generate_room_code();
    let max_participants = payload.max_participants.unwrap_or(10);
    let recording_enabled = payload.recording_enabled.unwrap_or(false);

    let room: InterviewRoom = sqlx::query_as(
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

/// POST /interviews/rooms/:id/token
pub async fn issue_token(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(room_id): Path<Uuid>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    // Verify room exists
    let _room: InterviewRoom = sqlx::query_as(
        "SELECT id, tenant_id, name, meeting_id, room_code, status, max_participants, \
         recording_enabled, created_by, started_at, ended_at, metadata, created_at, updated_at \
         FROM video_rooms WHERE id = $1 AND tenant_id = $2",
    )
    .bind(room_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Interview room not found".to_string()))?;

    let token_hash = Uuid::new_v4().to_string();
    let expires_at = chrono::Utc::now() + chrono::Duration::hours(4);

    let token: InterviewRoomToken = sqlx::query_as(
        "INSERT INTO video_room_tokens \
         (tenant_id, room_id, user_id, token_hash, role, expires_at) \
         VALUES ($1, $2, $3, $4, 'participant', $5) \
         RETURNING id, tenant_id, room_id, user_id, token_hash, role, \
         expires_at, used_at, revoked_at, created_at",
    )
    .bind(claims.tid)
    .bind(room_id)
    .bind(claims.sub)
    .bind(&token_hash)
    .bind(expires_at)
    .fetch_one(&state.db)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "token": token.token_hash,
            "room_id": room_id,
            "expires_at": token.expires_at
        })),
    ))
}

/// POST /interviews/sessions/:id/events
pub async fn record_session_event(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(session_id): Path<Uuid>,
    Json(payload): Json<SessionEventRequest>,
) -> AppResult<(StatusCode, Json<SessionEvent>)> {
    // Verify session exists
    let (exists,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM video_sessions WHERE id = $1 AND tenant_id = $2",
    )
    .bind(session_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    if exists == 0 {
        return Err(AppError::NotFound("Session not found".to_string()));
    }

    let event_payload = payload.payload.unwrap_or(serde_json::json!({}));

    let event: SessionEvent = sqlx::query_as(
        "INSERT INTO video_session_events \
         (tenant_id, session_id, user_id, event_type, payload) \
         VALUES ($1, $2, $3, $4, $5) \
         RETURNING id, tenant_id, session_id, user_id, event_type, payload, created_at",
    )
    .bind(claims.tid)
    .bind(session_id)
    .bind(claims.sub)
    .bind(&payload.event_type)
    .bind(&event_payload)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(event)))
}

/// POST /interviews/sessions/:id/feedback
pub async fn submit_feedback(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(session_id): Path<Uuid>,
    Json(payload): Json<SubmitFeedbackRequest>,
) -> AppResult<(StatusCode, Json<serde_json::Value>)> {
    // Verify session exists
    let (exists,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM video_sessions WHERE id = $1 AND tenant_id = $2",
    )
    .bind(session_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    if exists == 0 {
        return Err(AppError::NotFound("Session not found".to_string()));
    }

    let feedback_data = serde_json::json!({
        "overall_rating": payload.overall_rating,
        "technical_rating": payload.technical_rating,
        "communication_rating": payload.communication_rating,
        "notes": payload.notes,
        "recommendation": payload.recommendation,
    });

    // Store feedback as a session event with type 'feedback'
    let event: SessionEvent = sqlx::query_as(
        "INSERT INTO video_session_events \
         (tenant_id, session_id, user_id, event_type, payload) \
         VALUES ($1, $2, $3, 'feedback', $4) \
         RETURNING id, tenant_id, session_id, user_id, event_type, payload, created_at",
    )
    .bind(claims.tid)
    .bind(session_id)
    .bind(claims.sub)
    .bind(&feedback_data)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(serde_json::json!({
        "id": event.id,
        "session_id": session_id,
        "submitted_by": claims.sub,
        "feedback": feedback_data,
        "created_at": event.created_at,
    }))))
}
