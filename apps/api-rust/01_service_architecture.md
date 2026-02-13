# Backend Service Architecture

> Source of Truth: MASTER_SPEC.md > Tech Stack > BACKEND
> Stack: Rust, Axum 0.8+, SQLx 0.8+, Tower middleware, Redis 7+ (fred), Temporal SDK

---

## 1. Architecture Overview

```
                         ┌──────────────────────┐
                         │    Load Balancer      │
                         │   (ALB / CloudFront)  │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │  Axum #1  │  │  Axum #2  │  │  Axum #N  │
              │  (API)    │  │  (API)    │  │  (API)    │
              └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                    │               │               │
         ┌──────────┼───────────────┼───────────────┼──────────┐
         │          │               │               │          │
    ┌────▼────┐ ┌───▼───┐ ┌────────▼────────┐ ┌───▼───┐ ┌───▼────┐
    │Postgres │ │ Redis │ │   Temporal      │ │  S3   │ │Typesense│
    │  16     │ │  7+   │ │   Server        │ │       │ │         │
    │ (RLS)   │ │(fred) │ │ + Workers       │ │(docs) │ │(search) │
    └─────────┘ └───────┘ └─────────────────┘ └───────┘ └─────────┘
```

## 2. Axum Application Structure

```
backend/
├── Cargo.toml
├── Cargo.lock
├── .sqlx/                        # SQLx offline query data
├── migrations/                   # SQLx migrations
│   ├── 001_tenants.sql
│   ├── 002_users_roles.sql
│   ├── 003_clients.sql
│   ├── 004_documents.sql
│   ├── 005_workflows.sql
│   ├── 006_tasks.sql
│   ├── 007_time_entries.sql
│   ├── 008_invoices.sql
│   ├── 009_integrations.sql
│   ├── 010_notifications.sql
│   ├── 011_audit_logs.sql
│   ├── 012_materialized_views.sql
│   └── 013_compliance_deadlines.sql
├── src/
│   ├── main.rs                   # Entry point, server startup
│   ├── config.rs                 # Environment config (envy)
│   ├── app.rs                    # Axum Router assembly
│   ├── error.rs                  # Error types + Into<Response>
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs               # JWT extraction + validation
│   │   ├── tenant.rs             # SET app.current_tenant
│   │   ├── rbac.rs               # Role + resource + action check
│   │   ├── rate_limit.rs         # Redis-based per-tenant rate limiting
│   │   ├── request_id.rs         # X-Request-Id generation
│   │   ├── cors.rs               # Strict origin whitelist
│   │   ├── logging.rs            # Request/response tracing spans
│   │   └── security_headers.rs   # HSTS, CSP, X-Frame-Options
│   ├── auth/
│   │   ├── mod.rs
│   │   ├── handler.rs            # login, register, refresh, logout, mfa
│   │   ├── jwt.rs                # RS256 sign/verify, claims
│   │   ├── password.rs           # Argon2id hash/verify
│   │   ├── mfa.rs                # TOTP generation/verification
│   │   └── session.rs            # Redis session management
│   ├── routes/
│   │   ├── mod.rs                # Route assembly
│   │   ├── health.rs             # GET /api/v1/health
│   │   ├── clients.rs            # /api/v1/clients
│   │   ├── documents.rs          # /api/v1/documents
│   │   ├── workflows.rs          # /api/v1/workflows
│   │   ├── tasks.rs              # /api/v1/tasks
│   │   ├── time_entries.rs       # /api/v1/time-entries
│   │   ├── invoices.rs           # /api/v1/invoices
│   │   ├── payments.rs           # /api/v1/payments
│   │   ├── messages.rs           # /api/v1/messages
│   │   ├── notifications.rs      # /api/v1/notifications
│   │   ├── integrations.rs       # /api/v1/integrations
│   │   ├── dashboard.rs          # /api/v1/dashboard
│   │   ├── reports.rs            # /api/v1/reports
│   │   ├── compliance.rs         # /api/v1/compliance
│   │   ├── team.rs               # /api/v1/team
│   │   ├── settings.rs           # /api/v1/settings
│   │   ├── onboarding.rs         # /api/v1/onboarding
│   │   ├── upload.rs             # /upload (tus endpoint)
│   │   └── webhooks.rs           # /webhooks/stripe, /webhooks/qb
│   ├── services/
│   │   ├── mod.rs
│   │   ├── client_service.rs
│   │   ├── document_service.rs
│   │   ├── workflow_service.rs
│   │   ├── task_service.rs
│   │   ├── time_service.rs
│   │   ├── invoice_service.rs
│   │   ├── payment_service.rs
│   │   ├── message_service.rs
│   │   ├── notification_service.rs
│   │   ├── integration_service.rs
│   │   ├── dashboard_service.rs
│   │   ├── report_service.rs
│   │   ├── compliance_service.rs
│   │   ├── search_service.rs     # Typesense client
│   │   ├── ai_service.rs         # Claude API client
│   │   ├── email_service.rs      # Resend client
│   │   ├── storage_service.rs    # S3 client
│   │   └── encryption_service.rs # KMS + AES-256-GCM
│   ├── models/
│   │   ├── mod.rs
│   │   ├── tenant.rs
│   │   ├── user.rs
│   │   ├── client.rs
│   │   ├── document.rs
│   │   ├── workflow.rs
│   │   ├── task.rs
│   │   ├── time_entry.rs
│   │   ├── invoice.rs
│   │   ├── message.rs
│   │   ├── notification.rs
│   │   ├── integration.rs
│   │   ├── audit_log.rs
│   │   └── compliance_deadline.rs
│   ├── db/
│   │   ├── mod.rs
│   │   ├── pool.rs               # SQLx PgPool setup
│   │   └── queries/              # SQLx query files (compile-time verified)
│   ├── websocket/
│   │   ├── mod.rs
│   │   ├── handler.rs            # WS upgrade + connection management
│   │   ├── channels.rs           # Tenant-scoped pub/sub channels
│   │   └── events.rs             # Event types
│   ├── temporal/
│   │   ├── mod.rs
│   │   ├── client.rs             # Temporal client setup
│   │   ├── workflows/
│   │   │   ├── document_ingestion.rs
│   │   │   ├── tax_season.rs
│   │   │   ├── compliance_reminders.rs
│   │   │   ├── invoice_generation.rs
│   │   │   ├── nightly_insights.rs
│   │   │   └── integration_sync.rs
│   │   └── activities/
│   │       ├── ai_categorize.rs
│   │       ├── send_email.rs
│   │       ├── sync_quickbooks.rs
│   │       ├── sync_google_drive.rs
│   │       ├── generate_insights.rs
│   │       └── calculate_metrics.rs
│   └── integrations/
│       ├── mod.rs
│       ├── oauth2.rs             # Generic OAuth2 flow
│       ├── quickbooks.rs         # QB API client
│       ├── google_drive.rs       # Drive API client
│       ├── stripe.rs             # Stripe API client
│       └── webhook_handler.rs    # Signature verification
└── tests/
    ├── common/                   # Test helpers
    ├── integration/              # API integration tests
    └── unit/                     # Unit tests
```

## 3. Tower Middleware Chain (Order Matters)

```rust
// Applied in this order (outermost to innermost):
Router::new()
    .layer(SecurityHeadersLayer)       // 1. Security headers (HSTS, CSP, etc.)
    .layer(CorsLayer::strict())        // 2. CORS (strict origin whitelist)
    .layer(RequestIdLayer)             // 3. Generate X-Request-Id
    .layer(TraceLayer::new())          // 4. Request/response tracing
    .layer(RateLimitLayer::new(redis)) // 5. Per-tenant rate limiting
    .layer(AuthLayer::new(jwt_keys))   // 6. JWT extraction + validation
    .layer(TenantLayer::new())         // 7. SET app.current_tenant on PG connection
    .layer(RbacLayer::new())           // 8. Role-based access control
    .layer(CompressionLayer::new())    // 9. Response compression
    .layer(TimeoutLayer::new(30s))     // 10. Request timeout
```

## 4. Request Lifecycle

```
Client Request
  │
  ▼
1. Security Headers (add HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
  │
  ▼
2. CORS Check (reject if origin not in whitelist)
  │
  ▼
3. Request ID (generate UUID, set X-Request-Id header)
  │
  ▼
4. Tracing (create span with method, path, request_id)
  │
  ▼
5. Rate Limit Check
   - Extract tenant_id from JWT (or IP for unauthenticated)
   - Check Redis: tenant:{id}:rate_limit
   - Solo: 100/min, Growing: 500/min, Scale: 2000/min
   - If exceeded → 429 Too Many Requests
  │
  ▼
6. Auth (extract JWT from Authorization header or httpOnly cookie)
   - Verify RS256 signature
   - Check expiry
   - Extract claims: user_id, tenant_id, role, permissions
   - If invalid → 401 Unauthorized
  │
  ▼
7. Tenant Context
   - SET LOCAL app.current_tenant = '{tenant_id}' on PG connection
   - All subsequent queries filtered by RLS automatically
   - If no tenant_id → zero rows returned (fail-safe)
  │
  ▼
8. RBAC Check
   - Match route to resource + action
   - Check user role against permission matrix
   - Check field-level permissions (e.g., SSN visibility)
   - If denied → 403 Forbidden
  │
  ▼
9. Handler (business logic)
   - Validate input (Zod-equivalent Rust validation)
   - Call service layer
   - Service calls DB via SQLx (compile-time verified)
   - Return response
  │
  ▼
10. Audit Log (async, non-blocking)
    - Log action, user, resource, tenant, timestamp
    - Sensitive data redacted
  │
  ▼
11. Response (JSON with standard envelope)
```

## 5. Rate Limiting Tiers

| Tier | Requests/min | Burst | WebSocket Connections |
|---|---|---|---|
| Solo (1-3 users) | 100 | 150 | 10 |
| Growing (4-15 users) | 500 | 750 | 50 |
| Scale (16-50 users) | 2000 | 3000 | 200 |
| Demo | 50 | 75 | 5 |

Implementation: Redis sliding window counter via `fred` crate.

```rust
// Key: rate_limit:{tenant_id}:{window_start}
// TTL: 120 seconds (2 windows)
// Algorithm: Sliding window log
```

## 6. Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "name": ["Name is required"],
      "email": ["Invalid email format"]
    },
    "request_id": "req_abc123"
  }
}
```

### Error Code Taxonomy

| HTTP | Code | Description |
|---|---|---|
| 400 | VALIDATION_ERROR | Input validation failed |
| 400 | INVALID_REQUEST | Malformed request body |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 401 | TOKEN_EXPIRED | JWT has expired |
| 401 | MFA_REQUIRED | MFA verification needed |
| 403 | FORBIDDEN | Insufficient permissions |
| 403 | TENANT_MISMATCH | Cross-tenant access attempt |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Duplicate resource |
| 409 | IDEMPOTENCY_CONFLICT | Duplicate idempotency key |
| 422 | BUSINESS_RULE_VIOLATION | Business logic constraint |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 502 | UPSTREAM_ERROR | External service failure |
| 503 | SERVICE_UNAVAILABLE | Temporary unavailability |

## 7. Idempotency

All mutation endpoints accept `Idempotency-Key` header.

```
POST /api/v1/invoices
Idempotency-Key: idem_abc123

→ First call: process normally, store result in Redis (TTL 24h)
→ Duplicate call: return cached result (HTTP 200, same body)
```

Key storage: `idempotency:{tenant_id}:{key}` in Redis with 24-hour TTL.

Critical for:
- Invoice creation
- Payment processing
- Stripe webhook handling
- Integration sync operations

## 8. Observability

### Structured Logging (tracing)

```rust
// Every request gets a span:
tracing::info_span!(
    "http_request",
    method = %method,
    path = %path,
    request_id = %request_id,
    tenant_id = %tenant_id,
    user_id = %user_id,
);

// Sensitive data NEVER logged:
// - Passwords, tokens, SSN, EIN, bank accounts
// - Request/response bodies containing Tier 1 data
```

### Metrics (Prometheus)

- `http_requests_total{method, path, status}` — Counter
- `http_request_duration_seconds{method, path}` — Histogram
- `active_websocket_connections{tenant_id}` — Gauge
- `db_query_duration_seconds{query}` — Histogram
- `redis_operations_total{operation}` — Counter
- `temporal_workflow_started_total{workflow_type}` — Counter
- `temporal_workflow_completed_total{workflow_type, status}` — Counter
- `ai_categorization_total{result}` — Counter
- `integration_sync_total{provider, status}` — Counter
- `rate_limit_exceeded_total{tenant_id}` — Counter

### Error Tracking (Sentry)

- All 5xx errors reported with full context
- Performance tracing for slow requests (> 500ms)
- Release tracking tied to git SHA
- Sensitive data scrubbed before sending

### Distributed Tracing (OpenTelemetry)

- Trace ID propagated across: Axum → Temporal → External APIs
- Spans for: HTTP handler, DB query, Redis operation, S3 upload, API call
