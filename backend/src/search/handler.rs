use axum::{
    extract::{Extension, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::jwt::Claims;
use crate::error::{AppError, AppResult};
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    #[serde(rename = "type", default = "default_search_type")]
    pub search_type: String,
    pub limit: Option<i64>,
}

fn default_search_type() -> String {
    "all".to_string()
}

#[derive(Debug, Serialize)]
pub struct SearchResult {
    #[serde(rename = "type")]
    pub result_type: String,
    pub id: Uuid,
    pub title: String,
    pub subtitle: Option<String>,
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
    pub total: usize,
    pub query: String,
}

pub async fn global_search(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<SearchQuery>,
) -> AppResult<Json<SearchResponse>> {
    let query_str = params.q.unwrap_or_default().trim().to_string();
    if query_str.is_empty() {
        return Err(AppError::Validation(
            "Search query 'q' parameter is required".to_string(),
        ));
    }

    if query_str.len() > 200 {
        return Err(AppError::Validation(
            "Search query must be 200 characters or less".to_string(),
        ));
    }

    let limit = params.limit.unwrap_or(20).clamp(1, 100);
    let search_type = params.search_type.as_str();

    let valid_types = ["all", "clients", "documents", "invoices"];
    if !valid_types.contains(&search_type) {
        return Err(AppError::Validation(format!(
            "Invalid search type '{}'. Must be one of: {}",
            search_type,
            valid_types.join(", ")
        )));
    }

    // Convert query to tsquery format: split words and join with &
    let ts_query = query_str
        .split_whitespace()
        .map(|w| format!("{}:*", w))
        .collect::<Vec<_>>()
        .join(" & ");

    let mut results = Vec::new();

    // Search clients
    if search_type == "all" || search_type == "clients" {
        let client_results: Vec<(Uuid, String, String)> = sqlx::query_as(
            "SELECT id, name, COALESCE(business_type, '') as business_type \
             FROM clients \
             WHERE tenant_id = $1 AND deleted_at IS NULL \
               AND to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(business_type, '')) @@ to_tsquery('english', $2) \
             ORDER BY ts_rank(to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(business_type, '')), to_tsquery('english', $2)) DESC \
             LIMIT $3",
        )
        .bind(claims.tid)
        .bind(&ts_query)
        .bind(limit)
        .fetch_all(&state.db)
        .await?;

        for (id, name, business_type) in client_results {
            results.push(SearchResult {
                result_type: "client".to_string(),
                id,
                title: name,
                subtitle: if business_type.is_empty() {
                    None
                } else {
                    Some(business_type)
                },
                url: format!("/clients/{}", id),
            });
        }

        // Also search client contacts for email/name matches
        let contact_results: Vec<(Uuid, String, String, Option<String>)> = sqlx::query_as(
            "SELECT cc.client_id, c.name, cc.first_name || ' ' || cc.last_name as contact_name, cc.email \
             FROM client_contacts cc \
             JOIN clients c ON c.id = cc.client_id \
             WHERE cc.tenant_id = $1 AND c.deleted_at IS NULL \
               AND to_tsvector('english', COALESCE(cc.first_name, '') || ' ' || COALESCE(cc.last_name, '') || ' ' || COALESCE(cc.email, '')) @@ to_tsquery('english', $2) \
             LIMIT $3",
        )
        .bind(claims.tid)
        .bind(&ts_query)
        .bind(limit)
        .fetch_all(&state.db)
        .await?;

        for (client_id, client_name, contact_name, email) in contact_results {
            // Avoid duplicates: skip if we already have this client
            if results.iter().any(|r| r.id == client_id && r.result_type == "client") {
                continue;
            }
            let subtitle = match email {
                Some(e) => format!("{} ({})", contact_name, e),
                None => contact_name,
            };
            results.push(SearchResult {
                result_type: "client".to_string(),
                id: client_id,
                title: client_name,
                subtitle: Some(subtitle),
                url: format!("/clients/{}", client_id),
            });
        }
    }

    // Search documents
    if search_type == "all" || search_type == "documents" {
        let doc_results: Vec<(Uuid, String, Option<String>)> = sqlx::query_as(
            "SELECT id, filename, category \
             FROM documents \
             WHERE tenant_id = $1 AND deleted_at IS NULL \
               AND to_tsvector('english', COALESCE(filename, '') || ' ' || COALESCE(category, '')) @@ to_tsquery('english', $2) \
             ORDER BY ts_rank(to_tsvector('english', COALESCE(filename, '') || ' ' || COALESCE(category, '')), to_tsquery('english', $2)) DESC \
             LIMIT $3",
        )
        .bind(claims.tid)
        .bind(&ts_query)
        .bind(limit)
        .fetch_all(&state.db)
        .await?;

        for (id, filename, category) in doc_results {
            results.push(SearchResult {
                result_type: "document".to_string(),
                id,
                title: filename,
                subtitle: category,
                url: format!("/documents/{}", id),
            });
        }
    }

    // Search invoices
    if search_type == "all" || search_type == "invoices" {
        let invoice_results: Vec<(Uuid, String, String, i64)> = sqlx::query_as(
            "SELECT id, invoice_number, status, total_cents \
             FROM invoices \
             WHERE tenant_id = $1 AND (deleted_at IS NULL OR deleted_at IS NULL) \
               AND to_tsvector('english', COALESCE(invoice_number, '') || ' ' || COALESCE(notes, '')) @@ to_tsquery('english', $2) \
             ORDER BY ts_rank(to_tsvector('english', COALESCE(invoice_number, '') || ' ' || COALESCE(notes, '')), to_tsquery('english', $2)) DESC \
             LIMIT $3",
        )
        .bind(claims.tid)
        .bind(&ts_query)
        .bind(limit)
        .fetch_all(&state.db)
        .await?;

        for (id, invoice_number, status, total_cents) in invoice_results {
            results.push(SearchResult {
                result_type: "invoice".to_string(),
                id,
                title: invoice_number,
                subtitle: Some(format!(
                    "{} - ${:.2}",
                    status,
                    total_cents as f64 / 100.0
                )),
                url: format!("/invoices/{}", id),
            });
        }
    }

    let total = results.len();

    // Limit total results
    results.truncate(limit as usize);

    Ok(Json(SearchResponse {
        results,
        total,
        query: query_str,
    }))
}
