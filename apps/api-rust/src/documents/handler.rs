use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::auth::jwt::Claims;
use crate::clients::model::{PaginatedResponse, PaginationMeta};
use crate::documents::model::*;
use crate::error::{AppError, AppResult};
use crate::AppState;

pub async fn list_documents(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ListDocumentsQuery>,
) -> AppResult<Json<PaginatedResponse<Document>>> {
    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(25).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let search_pattern = params.search.as_ref().map(|s| format!("%{}%", s.to_lowercase()));

    let sort_col = match params.sort.as_deref() {
        Some("name") => "filename",
        Some("category") => "category",
        Some("size_bytes") => "size_bytes",
        Some("created_at") => "created_at",
        _ => "created_at",
    };
    let sort_dir = match params.order.as_deref() {
        Some("asc") => "ASC",
        _ => "DESC",
    };
    let order_clause = format!("ORDER BY {} {}", sort_col, sort_dir);

    let (total,): (i64,) = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            "SELECT COUNT(*) FROM documents WHERE tenant_id = $1 AND deleted_at IS NULL AND (LOWER(filename) LIKE $2 OR LOWER(COALESCE(category, '')) LIKE $2)",
        )
        .bind(claims.tid)
        .bind(pattern)
        .fetch_one(&state.db)
        .await?
    } else {
        sqlx::query_as(
            "SELECT COUNT(*) FROM documents WHERE tenant_id = $1 AND deleted_at IS NULL",
        )
        .bind(claims.tid)
        .fetch_one(&state.db)
        .await?
    };

    let documents: Vec<Document> = if let Some(ref pattern) = search_pattern {
        sqlx::query_as(
            &format!("SELECT id, tenant_id, client_id, uploaded_by, filename, mime_type, size_bytes, s3_key, category, ai_confidence::FLOAT8 as ai_confidence, ai_extracted_data, verification_status, tax_year, version, created_at, updated_at FROM documents WHERE tenant_id = $1 AND deleted_at IS NULL AND (LOWER(filename) LIKE $2 OR LOWER(COALESCE(category, '')) LIKE $2) {} LIMIT $3 OFFSET $4", order_clause),
        )
        .bind(claims.tid)
        .bind(pattern)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    } else {
        sqlx::query_as(
            &format!("SELECT id, tenant_id, client_id, uploaded_by, filename, mime_type, size_bytes, s3_key, category, ai_confidence::FLOAT8 as ai_confidence, ai_extracted_data, verification_status, tax_year, version, created_at, updated_at FROM documents WHERE tenant_id = $1 AND deleted_at IS NULL {} LIMIT $2 OFFSET $3", order_clause),
        )
        .bind(claims.tid)
        .bind(per_page)
        .bind(offset)
        .fetch_all(&state.db)
        .await?
    };

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(PaginatedResponse {
        data: documents,
        meta: PaginationMeta {
            page,
            per_page,
            total,
            total_pages,
        },
    }))
}

pub async fn get_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(doc_id): Path<Uuid>,
) -> AppResult<Json<Document>> {
    let doc: Document = sqlx::query_as(
        "SELECT id, tenant_id, client_id, uploaded_by, filename, mime_type, size_bytes, s3_key, category, ai_confidence::FLOAT8 as ai_confidence, ai_extracted_data, verification_status, tax_year, version, created_at, updated_at FROM documents WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(doc_id)
    .bind(claims.tid)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Document not found".to_string()))?;

    Ok(Json(doc))
}

pub async fn create_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateDocumentRequest>,
) -> AppResult<(StatusCode, Json<UploadResponse>)> {
    payload
        .validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let id = Uuid::new_v4();
    let s3_key = format!(
        "tenants/{}/documents/{}/{}",
        claims.tid, id, &payload.filename
    );

    let doc: Document = sqlx::query_as(
        "INSERT INTO documents (id, tenant_id, client_id, uploaded_by, filename, mime_type, size_bytes, s3_key, category, tax_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, tenant_id, client_id, uploaded_by, filename, mime_type, size_bytes, s3_key, category, ai_confidence::FLOAT8 as ai_confidence, ai_extracted_data, verification_status, tax_year, version, created_at, updated_at",
    )
    .bind(id)
    .bind(claims.tid)
    .bind(payload.client_id)
    .bind(claims.sub)
    .bind(&payload.filename)
    .bind(&payload.mime_type)
    .bind(payload.size_bytes)
    .bind(&s3_key)
    .bind(payload.category.as_deref())
    .bind(payload.tax_year)
    .fetch_one(&state.db)
    .await?;

    // Generate presigned upload URL via AWS SDK
    let s3_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .endpoint_url(&state.config.s3_endpoint)
        .region(aws_config::Region::new(state.config.s3_region.clone()))
        .load()
        .await;
    let s3_client = aws_sdk_s3::Client::new(&s3_config);

    let upload_url = match s3_client
        .put_object()
        .bucket(&state.config.s3_bucket)
        .key(&s3_key)
        .content_type(&payload.mime_type)
        .presigned(
            aws_sdk_s3::presigning::PresigningConfig::expires_in(std::time::Duration::from_secs(3600))
                .expect("valid presigning config"),
        )
        .await
    {
        Ok(presigned) => presigned.uri().to_string(),
        Err(_) => {
            // Fallback for local dev if presigning fails
            format!(
                "{}/{}/{}",
                state.config.s3_endpoint, state.config.s3_bucket, &s3_key
            )
        }
    };

    Ok((
        StatusCode::CREATED,
        Json(UploadResponse {
            document: doc,
            upload_url,
        }),
    ))
}

pub async fn update_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(doc_id): Path<Uuid>,
    Json(payload): Json<UpdateDocumentRequest>,
) -> AppResult<Json<Document>> {
    let doc: Document = sqlx::query_as(
        "UPDATE documents SET \
         category = COALESCE($3, category), \
         tax_year = COALESCE($4, tax_year), \
         verification_status = COALESCE($5, verification_status), \
         updated_at = NOW() \
         WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL \
         RETURNING id, tenant_id, client_id, uploaded_by, filename, mime_type, size_bytes, s3_key, \
         category, ai_confidence::FLOAT8 as ai_confidence, ai_extracted_data, verification_status, \
         tax_year, version, created_at, updated_at",
    )
    .bind(doc_id)
    .bind(claims.tid)
    .bind(payload.category.as_deref())
    .bind(payload.tax_year)
    .bind(payload.verification_status.as_deref())
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::NotFound("Document not found".to_string()))?;

    Ok(Json(doc))
}

pub async fn delete_document(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(doc_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    let result = sqlx::query(
        "UPDATE documents SET deleted_at = NOW(), verification_status = 'rejected' WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL",
    )
    .bind(doc_id)
    .bind(claims.tid)
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Document not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
