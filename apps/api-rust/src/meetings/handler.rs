use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::meetings::model::*;
use crate::AppState;

pub async fn create_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateMeetingRequest>,
) -> AppResult<(StatusCode, Json<MeetingRequest>)> {
    let meeting_type = payload.meeting_type.as_deref().unwrap_or("video");
    let duration_minutes = payload.duration_minutes.unwrap_or(60);
    let proposed_times_json =
        serde_json::to_value(&payload.proposed_times).unwrap_or_else(|_| serde_json::json!([]));

    let meeting: MeetingRequest = sqlx::query_as(
        "INSERT INTO meeting_requests \
         (tenant_id, title, description, requested_by, meeting_type, duration_minutes, \
          location, status, proposed_times, application_id) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9) \
         RETURNING id, tenant_id, title, description, requested_by, meeting_type, \
         duration_minutes, location, meeting_url, status, proposed_times, accepted_time, \
         accepted_timezone, application_id, conversation_id, cancellation_reason, \
         created_at, updated_at",
    )
    .bind(claims.tid)
    .bind(&payload.title)
    .bind(payload.description.as_deref())
    .bind(claims.sub)
    .bind(meeting_type)
    .bind(duration_minutes)
    .bind(payload.location.as_deref())
    .bind(&proposed_times_json)
    .bind(payload.application_id)
    .fetch_one(&state.db)
    .await?;

    // Insert organizer participant
    sqlx::query(
        "INSERT INTO meeting_participants (tenant_id, meeting_id, user_id, role, response_status) \
         VALUES ($1, $2, $3, 'organizer', 'pending')",
    )
    .bind(claims.tid)
    .bind(meeting.id)
    .bind(claims.sub)
    .execute(&state.db)
    .await?;

    // Insert attendee participants
    for user_id in &payload.participant_user_ids {
        if *user_id != claims.sub {
            sqlx::query(
                "INSERT INTO meeting_participants (tenant_id, meeting_id, user_id, role, response_status) \
                 VALUES ($1, $2, $3, 'attendee', 'pending')",
            )
            .bind(claims.tid)
            .bind(meeting.id)
            .bind(user_id)
            .execute(&state.db)
            .await?;
        }
    }

    Ok((StatusCode::CREATED, Json(meeting)))
}

pub async fn list_meetings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListMeetingsQuery>,
) -> AppResult<Json<serde_json::Value>> {
    let per_page = params.per_page.unwrap_or(50).min(100);
    let page = params.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;
    let status_filter = params.status.as_deref().unwrap_or("");

    let meetings: Vec<MeetingRequest> = sqlx::query_as(
        "SELECT mr.id, mr.tenant_id, mr.title, mr.description, mr.requested_by, \
         mr.meeting_type, mr.duration_minutes, mr.location, mr.meeting_url, mr.status, \
         mr.proposed_times, mr.accepted_time, mr.accepted_timezone, mr.application_id, \
         mr.conversation_id, mr.cancellation_reason, mr.created_at, mr.updated_at \
         FROM meeting_requests mr \
         INNER JOIN meeting_participants mp ON mp.meeting_id = mr.id \
         WHERE mr.tenant_id = $1 AND mp.user_id = $2 \
         AND ($5 = '' OR mr.status = $5) \
         ORDER BY mr.created_at DESC LIMIT $3 OFFSET $4",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(per_page)
    .bind(offset)
    .bind(status_filter)
    .fetch_all(&state.db)
    .await?;

    let (total,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM meeting_requests mr \
         INNER JOIN meeting_participants mp ON mp.meeting_id = mr.id \
         WHERE mr.tenant_id = $1 AND mp.user_id = $2 \
         AND ($3 = '' OR mr.status = $3)",
    )
    .bind(claims.tid)
    .bind(claims.sub)
    .bind(status_filter)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "data": meetings,
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total as f64 / per_page as f64).ceil() as i64
        }
    })))
}

pub async fn get_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    let meeting: MeetingRequest = sqlx::query_as(
        "SELECT id, tenant_id, title, description, requested_by, meeting_type, \
         duration_minutes, location, meeting_url, status, proposed_times, accepted_time, \
         accepted_timezone, application_id, conversation_id, cancellation_reason, \
         created_at, updated_at \
         FROM meeting_requests \
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Meeting not found".to_string()))?;

    let participants: Vec<MeetingParticipant> = sqlx::query_as(
        "SELECT id, tenant_id, meeting_id, user_id, role, response_status, \
         responded_at, created_at \
         FROM meeting_participants \
         WHERE meeting_id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(serde_json::json!({
        "meeting": meeting,
        "participants": participants
    })))
}

pub async fn accept_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<AcceptMeetingRequest>,
) -> AppResult<Json<MeetingRequest>> {
    let accepted_time = chrono::DateTime::parse_from_rfc3339(&payload.accepted_time)
        .map_err(|e| AppError::Validation(format!("Invalid datetime format: {}", e)))?
        .with_timezone(&chrono::Utc);

    let meeting: MeetingRequest = sqlx::query_as(
        "UPDATE meeting_requests \
         SET status = 'accepted', accepted_time = $3, accepted_timezone = $4, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, title, description, requested_by, meeting_type, \
         duration_minutes, location, meeting_url, status, proposed_times, accepted_time, \
         accepted_timezone, application_id, conversation_id, cancellation_reason, \
         created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(accepted_time)
    .bind(&payload.timezone)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Meeting not found".to_string()))?;

    // Update the current user's participant response
    sqlx::query(
        "UPDATE meeting_participants SET response_status = 'accepted', responded_at = NOW() \
         WHERE meeting_id = $1 AND user_id = $2 AND tenant_id = $3",
    )
    .bind(id)
    .bind(claims.sub)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    Ok(Json(meeting))
}

pub async fn deny_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<DenyMeetingRequest>,
) -> AppResult<Json<MeetingRequest>> {
    let meeting: MeetingRequest = sqlx::query_as(
        "UPDATE meeting_requests \
         SET status = 'denied', cancellation_reason = $3, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, title, description, requested_by, meeting_type, \
         duration_minutes, location, meeting_url, status, proposed_times, accepted_time, \
         accepted_timezone, application_id, conversation_id, cancellation_reason, \
         created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.reason.as_deref())
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Meeting not found".to_string()))?;

    // Update the current user's participant response
    sqlx::query(
        "UPDATE meeting_participants SET response_status = 'declined', responded_at = NOW() \
         WHERE meeting_id = $1 AND user_id = $2 AND tenant_id = $3",
    )
    .bind(id)
    .bind(claims.sub)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    Ok(Json(meeting))
}

pub async fn reschedule_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<RescheduleMeetingRequest>,
) -> AppResult<Json<MeetingRequest>> {
    let new_proposed_times =
        serde_json::to_value(&payload.proposed_times).unwrap_or_else(|_| serde_json::json!([]));

    // Insert reschedule event
    sqlx::query(
        "INSERT INTO meeting_reschedule_events (tenant_id, meeting_id, rescheduled_by, reason, new_proposed_times) \
         VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(claims.tid)
    .bind(id)
    .bind(claims.sub)
    .bind(payload.reason.as_deref())
    .bind(&new_proposed_times)
    .execute(&state.db)
    .await?;

    // Update meeting status and proposed times
    let meeting: MeetingRequest = sqlx::query_as(
        "UPDATE meeting_requests \
         SET status = 'rescheduled', proposed_times = $3, updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, title, description, requested_by, meeting_type, \
         duration_minutes, location, meeting_url, status, proposed_times, accepted_time, \
         accepted_timezone, application_id, conversation_id, cancellation_reason, \
         created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&new_proposed_times)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Meeting not found".to_string()))?;

    Ok(Json(meeting))
}

pub async fn cancel_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<MeetingRequest>> {
    let meeting: MeetingRequest = sqlx::query_as(
        "UPDATE meeting_requests \
         SET status = 'cancelled', updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING id, tenant_id, title, description, requested_by, meeting_type, \
         duration_minutes, location, meeting_url, status, proposed_times, accepted_time, \
         accepted_timezone, application_id, conversation_id, cancellation_reason, \
         created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Meeting not found".to_string()))?;

    Ok(Json(meeting))
}
