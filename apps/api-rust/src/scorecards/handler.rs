use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::scorecards::model::*;
use crate::AppState;

pub async fn list_scorecards(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListScorecardsQuery>,
) -> AppResult<Json<Vec<Scorecard>>> {
    let application_id_filter = params
        .application_id
        .map(|id| id.to_string())
        .unwrap_or_default();
    let job_id_filter = params.job_id.map(|id| id.to_string()).unwrap_or_default();

    let scorecards: Vec<Scorecard> = sqlx::query_as(
        "SELECT s.* FROM scorecards s \
         LEFT JOIN applications a ON a.id = s.application_id \
         WHERE s.tenant_id = $1 \
         AND ($2 = '' OR s.application_id::text = $2) \
         AND ($3 = '' OR a.job_id::text = $3) \
         ORDER BY s.created_at DESC",
    )
    .bind(claims.tid)
    .bind(&application_id_filter)
    .bind(&job_id_filter)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(scorecards))
}

pub async fn create_scorecard(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateScorecardRequest>,
) -> AppResult<(StatusCode, Json<Scorecard>)> {
    // Validate score range if provided
    if let Some(score) = payload.overall_score {
        if !(1..=5).contains(&score) {
            return Err(AppError::Validation(
                "overall_score must be between 1 and 5".to_string(),
            ));
        }
    }

    // Validate recommendation if provided
    if let Some(ref rec) = payload.recommendation {
        let valid = [
            "strong_hire",
            "hire",
            "neutral",
            "no_hire",
            "strong_no_hire",
        ];
        if !valid.contains(&rec.as_str()) {
            return Err(AppError::Validation(format!(
                "recommendation must be one of: {}",
                valid.join(", ")
            )));
        }
    }

    // Verify application exists and belongs to tenant
    let _: (Uuid,) = sqlx::query_as("SELECT id FROM applications WHERE id = $1 AND tenant_id = $2")
        .bind(payload.application_id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    let criteria_scores = payload.criteria_scores.unwrap_or(serde_json::json!([]));

    let scorecard: Scorecard = sqlx::query_as(
        "INSERT INTO scorecards \
         (tenant_id, application_id, interviewer_id, interview_stage, overall_score, \
          recommendation, strengths, concerns, notes, criteria_scores, submitted_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) \
         RETURNING *",
    )
    .bind(claims.tid)
    .bind(payload.application_id)
    .bind(claims.sub)
    .bind(&payload.interview_stage)
    .bind(payload.overall_score)
    .bind(&payload.recommendation)
    .bind(&payload.strengths)
    .bind(&payload.concerns)
    .bind(&payload.notes)
    .bind(&criteria_scores)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(scorecard)))
}

pub async fn get_scorecard(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Scorecard>> {
    let scorecard: Scorecard =
        sqlx::query_as("SELECT * FROM scorecards WHERE id = $1 AND tenant_id = $2")
            .bind(id)
            .bind(claims.tid)
            .fetch_optional(&state.db)
            .await?
            .ok_or_else(|| AppError::NotFound("Scorecard not found".to_string()))?;

    Ok(Json(scorecard))
}

pub async fn update_scorecard(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateScorecardRequest>,
) -> AppResult<Json<Scorecard>> {
    // Validate score range if provided
    if let Some(score) = payload.overall_score {
        if !(1..=5).contains(&score) {
            return Err(AppError::Validation(
                "overall_score must be between 1 and 5".to_string(),
            ));
        }
    }

    // Validate recommendation if provided
    if let Some(ref rec) = payload.recommendation {
        let valid = [
            "strong_hire",
            "hire",
            "neutral",
            "no_hire",
            "strong_no_hire",
        ];
        if !valid.contains(&rec.as_str()) {
            return Err(AppError::Validation(format!(
                "recommendation must be one of: {}",
                valid.join(", ")
            )));
        }
    }

    let scorecard: Scorecard = sqlx::query_as(
        "UPDATE scorecards SET \
         interview_stage = COALESCE($3, interview_stage), \
         overall_score = COALESCE($4, overall_score), \
         recommendation = COALESCE($5, recommendation), \
         strengths = COALESCE($6, strengths), \
         concerns = COALESCE($7, concerns), \
         notes = COALESCE($8, notes), \
         criteria_scores = COALESCE($9, criteria_scores), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 \
         RETURNING *",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(&payload.interview_stage)
    .bind(payload.overall_score)
    .bind(&payload.recommendation)
    .bind(&payload.strengths)
    .bind(&payload.concerns)
    .bind(&payload.notes)
    .bind(&payload.criteria_scores)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Scorecard not found".to_string()))?;

    Ok(Json(scorecard))
}

pub async fn delete_scorecard(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query("DELETE FROM scorecards WHERE id = $1 AND tenant_id = $2")
        .bind(id)
        .bind(claims.tid)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Scorecard not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_scorecard_summary(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(application_id): Path<Uuid>,
) -> AppResult<Json<ScorecardSummary>> {
    // Verify application exists
    let _: (Uuid,) = sqlx::query_as("SELECT id FROM applications WHERE id = $1 AND tenant_id = $2")
        .bind(application_id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    let (total_scorecards,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2",
    )
    .bind(application_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    let (average_score,): (Option<f64>,) = sqlx::query_as(
        "SELECT AVG(overall_score::float) FROM scorecards \
         WHERE application_id = $1 AND tenant_id = $2 AND overall_score IS NOT NULL",
    )
    .bind(application_id)
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await?;

    // Score breakdown
    let (s1,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND overall_score = 1"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (s2,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND overall_score = 2"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (s3,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND overall_score = 3"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (s4,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND overall_score = 4"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (s5,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND overall_score = 5"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;

    // Recommendation counts
    let (strong_hire,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND recommendation = 'strong_hire'"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (hire,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND recommendation = 'hire'"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (neutral,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND recommendation = 'neutral'"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (no_hire,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND recommendation = 'no_hire'"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;
    let (strong_no_hire,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM scorecards WHERE application_id = $1 AND tenant_id = $2 AND recommendation = 'strong_no_hire'"
    ).bind(application_id).bind(claims.tid).fetch_one(&state.db).await?;

    Ok(Json(ScorecardSummary {
        application_id,
        total_scorecards,
        average_score,
        score_breakdown: ScoreBreakdown {
            score_1: s1,
            score_2: s2,
            score_3: s3,
            score_4: s4,
            score_5: s5,
        },
        recommendation_counts: RecommendationCounts {
            strong_hire,
            hire,
            neutral,
            no_hire,
            strong_no_hire,
        },
    }))
}

pub async fn create_decision_record(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateDecisionRecordRequest>,
) -> AppResult<(StatusCode, Json<DecisionRecord>)> {
    // Validate decision value
    let valid_decisions = ["advance", "reject", "hold", "offer", "hire"];
    if !valid_decisions.contains(&payload.decision.as_str()) {
        return Err(AppError::Validation(format!(
            "decision must be one of: {}",
            valid_decisions.join(", ")
        )));
    }

    // Verify application exists and belongs to tenant
    let _: (Uuid,) = sqlx::query_as("SELECT id FROM applications WHERE id = $1 AND tenant_id = $2")
        .bind(payload.application_id)
        .bind(claims.tid)
        .fetch_optional(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".to_string()))?;

    let evidence_refs = payload.evidence_refs.unwrap_or(serde_json::json!([]));

    let record: DecisionRecord = sqlx::query_as(
        "INSERT INTO decision_records \
         (tenant_id, application_id, decision, decided_by, rationale, evidence_refs) \
         VALUES ($1, $2, $3, $4, $5, $6) \
         RETURNING *",
    )
    .bind(claims.tid)
    .bind(payload.application_id)
    .bind(&payload.decision)
    .bind(claims.sub)
    .bind(&payload.rationale)
    .bind(&evidence_refs)
    .fetch_one(&state.db)
    .await?;

    Ok((StatusCode::CREATED, Json(record)))
}

pub async fn list_decision_records(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListDecisionRecordsQuery>,
) -> AppResult<Json<Vec<DecisionRecord>>> {
    let application_id_filter = params
        .application_id
        .map(|id| id.to_string())
        .unwrap_or_default();

    let records: Vec<DecisionRecord> = sqlx::query_as(
        "SELECT * FROM decision_records \
         WHERE tenant_id = $1 \
         AND ($2 = '' OR application_id::text = $2) \
         ORDER BY created_at DESC",
    )
    .bind(claims.tid)
    .bind(&application_id_filter)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(records))
}
