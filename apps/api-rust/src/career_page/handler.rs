use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CareerPage {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub is_published: bool,
    pub hero_headline: Option<String>,
    pub hero_subheadline: Option<String>,
    pub hero_bg_color: Option<String>,
    pub about_text: Option<String>,
    pub mission: Option<String>,
    pub values: Vec<String>,
    pub benefits: Vec<String>,
    pub culture_description: Option<String>,
    pub testimonials: serde_json::Value,
    pub primary_color: Option<String>,
    pub accent_color: Option<String>,
    pub logo_url: Option<String>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub custom_css: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCareerPagePayload {
    pub hero_headline: Option<String>,
    pub hero_subheadline: Option<String>,
    pub hero_bg_color: Option<String>,
    pub about_text: Option<String>,
    pub mission: Option<String>,
    pub values: Option<Vec<String>>,
    pub benefits: Option<Vec<String>>,
    pub culture_description: Option<String>,
    pub testimonials: Option<serde_json::Value>,
    pub primary_color: Option<String>,
    pub accent_color: Option<String>,
    pub logo_url: Option<String>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub custom_css: Option<String>,
}

pub async fn get_career_page(
    State(state): State<AppState>,
    claims: Claims,
) -> AppResult<Json<CareerPage>> {
    // Upsert: create if not exists
    let page = sqlx::query_as::<_, CareerPage>(
        r#"INSERT INTO career_pages (tenant_id)
           VALUES ($1)
           ON CONFLICT (tenant_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id
           RETURNING *"#,
    )
    .bind(claims.tid)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(page))
}

pub async fn update_career_page(
    State(state): State<AppState>,
    claims: Claims,
    Json(payload): Json<UpdateCareerPagePayload>,
) -> AppResult<Json<CareerPage>> {
    let page = sqlx::query_as::<_, CareerPage>(
        r#"INSERT INTO career_pages (tenant_id) VALUES ($1)
           ON CONFLICT (tenant_id) DO UPDATE SET
            hero_headline = COALESCE($2, career_pages.hero_headline),
            hero_subheadline = COALESCE($3, career_pages.hero_subheadline),
            hero_bg_color = COALESCE($4, career_pages.hero_bg_color),
            about_text = COALESCE($5, career_pages.about_text),
            mission = COALESCE($6, career_pages.mission),
            values = COALESCE($7, career_pages.values),
            benefits = COALESCE($8, career_pages.benefits),
            culture_description = COALESCE($9, career_pages.culture_description),
            testimonials = COALESCE($10, career_pages.testimonials),
            primary_color = COALESCE($11, career_pages.primary_color),
            accent_color = COALESCE($12, career_pages.accent_color),
            logo_url = COALESCE($13, career_pages.logo_url),
            meta_title = COALESCE($14, career_pages.meta_title),
            meta_description = COALESCE($15, career_pages.meta_description),
            custom_css = COALESCE($16, career_pages.custom_css),
            updated_at = NOW()
           RETURNING *"#,
    )
    .bind(claims.tid)
    .bind(payload.hero_headline)
    .bind(payload.hero_subheadline)
    .bind(payload.hero_bg_color)
    .bind(payload.about_text)
    .bind(payload.mission)
    .bind(payload.values)
    .bind(payload.benefits)
    .bind(payload.culture_description)
    .bind(payload.testimonials)
    .bind(payload.primary_color)
    .bind(payload.accent_color)
    .bind(payload.logo_url)
    .bind(payload.meta_title)
    .bind(payload.meta_description)
    .bind(payload.custom_css)
    .fetch_one(&state.db)
    .await
    .map_err(AppError::Database)?;

    Ok(Json(page))
}

pub async fn publish_career_page(
    State(state): State<AppState>,
    claims: Claims,
) -> AppResult<Json<CareerPage>> {
    let page = sqlx::query_as::<_, CareerPage>(
        r#"UPDATE career_pages SET is_published = NOT is_published, updated_at = NOW()
           WHERE tenant_id = $1
           RETURNING *"#,
    )
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await
    .map_err(AppError::Database)?
    .ok_or(AppError::NotFound)?;

    Ok(Json(page))
}
