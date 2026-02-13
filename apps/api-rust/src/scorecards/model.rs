use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Scorecard {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub application_id: Uuid,
    pub interviewer_id: Uuid,
    pub interview_stage: Option<String>,
    pub overall_score: Option<i16>,
    pub recommendation: Option<String>,
    pub strengths: Option<String>,
    pub concerns: Option<String>,
    pub notes: Option<String>,
    pub criteria_scores: Value,
    pub submitted_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScorecardRequest {
    pub application_id: Uuid,
    pub interview_stage: Option<String>,
    pub overall_score: Option<i16>,
    pub recommendation: Option<String>,
    pub strengths: Option<String>,
    pub concerns: Option<String>,
    pub notes: Option<String>,
    pub criteria_scores: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateScorecardRequest {
    pub interview_stage: Option<String>,
    pub overall_score: Option<i16>,
    pub recommendation: Option<String>,
    pub strengths: Option<String>,
    pub concerns: Option<String>,
    pub notes: Option<String>,
    pub criteria_scores: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct ListScorecardsQuery {
    pub application_id: Option<Uuid>,
    pub job_id: Option<Uuid>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct DecisionRecord {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub application_id: Uuid,
    pub decision: String,
    pub decided_by: Uuid,
    pub rationale: String,
    pub evidence_refs: Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDecisionRecordRequest {
    pub application_id: Uuid,
    pub decision: String,
    pub rationale: String,
    pub evidence_refs: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct ListDecisionRecordsQuery {
    pub application_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct ScorecardSummary {
    pub application_id: Uuid,
    pub total_scorecards: i64,
    pub average_score: Option<f64>,
    pub score_breakdown: ScoreBreakdown,
    pub recommendation_counts: RecommendationCounts,
}

#[derive(Debug, Serialize)]
pub struct ScoreBreakdown {
    pub score_1: i64,
    pub score_2: i64,
    pub score_3: i64,
    pub score_4: i64,
    pub score_5: i64,
}

#[derive(Debug, Serialize)]
pub struct RecommendationCounts {
    pub strong_hire: i64,
    pub hire: i64,
    pub neutral: i64,
    pub no_hire: i64,
    pub strong_no_hire: i64,
}
