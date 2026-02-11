# Developer Handbook & Documentation

> Source of Truth: MASTER_SPEC.md
> Audience: Development agents, human reviewers, support staff

---

## 1. Project Overview

### What We're Building

A multi-tenant SaaS platform for CPA firms (1-50 users) that unifies client management, document AI, workflow automation, time/billing, analytics, and integrations into a single platform.

### Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Rust, Axum 0.8+, SQLx 0.8+ (compile-time verified queries) |
| Database | PostgreSQL 16 (RLS, pgvector, pg_cron), Redis 7+ (fred) |
| Search | Typesense (typo-tolerant, instant search) |
| Workflows | Temporal (self-hosted, Rust SDK) |
| AI | Claude API (document categorization, nightly insights) |
| Storage | AWS S3 (documents), tus protocol (resumable uploads) |
| Payments | Stripe (PaymentIntents, webhooks) |
| Integrations | QuickBooks Online, Google Drive, Stripe |
| Email | Resend (transactional) |
| Auth | JWT RS256, Argon2id, TOTP MFA |
| Encryption | AES-256-GCM (per-tenant keys), AWS KMS (envelope) |
| Observability | Prometheus, Grafana, Loki, Tempo, Sentry |
| CI/CD | GitHub Actions, Docker, AWS ECS Fargate |
| IaC | Terraform |

---

## 2. Getting Started

### Prerequisites

- Rust (latest stable via rustup)
- Node.js 20+ (via nvm)
- Docker + Docker Compose
- sqlx-cli (`cargo install sqlx-cli`)

### Setup

```bash
# Clone repository
git clone <repo-url>

# Start infrastructure
docker compose up -d postgres redis temporal typesense localstack clamav

# Backend
cd backend
cp .env.example .env.local
sqlx database create
sqlx migrate run
cargo run

# Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### Environment Variables

```bash
# Backend (.env.local)
DATABASE_URL=postgres://cpa:cpa@localhost:5432/cpa_dev
REDIS_URL=redis://localhost:6379
TEMPORAL_URL=localhost:7233
TYPESENSE_URL=http://localhost:8108
TYPESENSE_API_KEY=dev_key
S3_ENDPOINT=http://localhost:4566
S3_BUCKET=cpa-documents
KMS_KEY_ID=alias/cpa-dev
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
CLAUDE_API_KEY=<your-key>
RESEND_API_KEY=<your-key>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 3. Development Conventions

### Backend (Rust)

- **Error handling**: Use `thiserror` for domain errors, `anyhow` for infrastructure
- **Validation**: Validate all inputs at handler level before passing to service
- **SQL**: All queries compile-time verified via SQLx (`sqlx::query!` / `sqlx::query_as!`)
- **Logging**: Use `tracing` crate, structured fields, never log Tier 1 data
- **Testing**: Unit tests in same file (`#[cfg(test)]`), integration tests in `tests/`
- **Naming**: snake_case for functions/variables, PascalCase for types/structs

### Frontend (TypeScript/React)

- **Components**: Server Components by default, `"use client"` only when needed
- **Data fetching**: TanStack Query for all server data, Zustand for UI-only state
- **Forms**: React Hook Form + Zod validation (schemas shared with backend)
- **Styling**: Tailwind CSS utility classes, no custom CSS unless necessary
- **Icons**: Lucide React exclusively
- **Animations**: Framer Motion for UI, GSAP via ECharts for charts
- **Testing**: Vitest + React Testing Library for unit, Playwright for E2E

### Git Conventions

- **Branch naming**: `feat/FR-XXX-short-description`, `fix/BUG-XXX-description`, `chore/description`
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`)
- **PR requirements**: Passing CI, 1 approval, linked to requirement ID
- **No force push** to main or staging branches

---

## 4. API Documentation

### Base URL

- Local: `http://localhost:8080/api/v1`
- Staging: `https://staging.cpaplatform.io/api/v1`
- Production: `https://app.cpaplatform.io/api/v1`

### Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```
Or httpOnly cookie (set automatically on login).

### Standard Headers

| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes (mutations) | `application/json` |
| `Authorization` | Yes (auth'd) | `Bearer <token>` |
| `Idempotency-Key` | Recommended (mutations) | UUID for idempotent operations |
| `X-Request-Id` | Auto-generated | Returned in response for debugging |

### Pagination

All list endpoints support:
```
GET /api/v1/clients?page=1&per_page=25&sort=name&order=asc
```

Response includes `meta`:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "per_page": 25,
    "total": 142,
    "total_pages": 6
  }
}
```

### Filtering

```
GET /api/v1/clients?filter[status]=active&filter[business_type]=1040
GET /api/v1/invoices?filter[status]=overdue&filter[date_from]=2026-01-01
```

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "email": ["Invalid email format"],
      "name": ["Name is required"]
    },
    "request_id": "req_abc123"
  }
}
```

---

## 5. Admin Operations

### Database Migrations

```bash
# Create new migration
sqlx migrate add <name>

# Run migrations
sqlx migrate run --database-url $DATABASE_URL

# Revert last migration
sqlx migrate revert --database-url $DATABASE_URL

# Verify migrations match compiled queries
sqlx prepare --check
```

### Tenant Management

```bash
# Create tenant (via admin API)
POST /api/v1/admin/tenants
{ "name": "New Firm", "tier": "growing", "admin_email": "admin@firm.com" }

# Suspend tenant
PUT /api/v1/admin/tenants/:id/suspend

# Offboard tenant (30-day grace period)
POST /api/v1/admin/tenants/:id/offboard
```

### Key Rotation

```bash
# Rotate JWT signing keys
1. Generate new key pair
2. Add new public key to verification set
3. Deploy backend with new private key
4. After max token lifetime (15 min), remove old public key

# Rotate tenant encryption keys (DEK)
1. Generate new DEK via KMS
2. Background job: re-encrypt all Tier 1 fields with new DEK
3. Update tenant_settings with new encrypted DEK
4. Verify decryption works
5. Delete old DEK reference
```

---

## 6. Support Playbooks

### SP-01: User Locked Out

1. Check `users.failed_login_count` and `users.locked_until`
2. If locked: reset via admin API `PUT /admin/users/:id/unlock`
3. If MFA lost: verify identity, reset MFA via admin API
4. If password forgotten: standard reset flow

### SP-02: Integration Sync Failure

1. Check `integration_connections.status` and `error_count`
2. Check `integration_sync_logs` for error details
3. If token expired: guide user to reconnect (Settings → Integrations)
4. If API error: check QB/Drive status page
5. If persistent: escalate to engineering

### SP-03: Document AI Misclassification

1. User can manually re-categorize (Documents → Edit → Category)
2. Check AI confidence score — if low, expected behavior
3. If systematic errors: log for AI benchmark review
4. No automated re-training in MVP (manual review only)

### SP-04: Invoice Payment Issue

1. Check Stripe dashboard for payment intent status
2. Check `invoices.stripe_payment_intent_id`
3. If webhook missed: manual reconciliation via admin API
4. If card declined: client needs to retry with different payment method
5. If refund needed: Partner role processes via admin API

### SP-05: Performance Degradation

1. Check Grafana dashboards (Service Health)
2. Check DB connection pool and query latency
3. Check Redis memory and hit rate
4. Check Temporal queue depth
5. If load-related: scale ECS tasks
6. If query-related: check slow query log, refresh materialized views

---

## 7. Onboarding Guide (New Firm)

### 7-Step Wizard

1. **Firm Profile**: Name, address, logo, timezone
2. **Subscription**: Choose tier (Solo/Growing/Scale)
3. **Team Setup**: Invite team members with roles
4. **Import Clients**: CSV upload or QuickBooks import
5. **Connect Integrations**: QuickBooks, Google Drive, Stripe
6. **Upload Documents**: Bulk upload existing documents
7. **Review & Launch**: Verify setup, start using platform

### CSV Import Format

```csv
name,business_type,fiscal_year_end,contact_first,contact_last,contact_email,contact_phone
"Acme Corp","1120-S","Calendar","John","Doe","john@acme.com","555-0100"
"Jane Smith","1040","Calendar","Jane","Smith","jane@email.com","555-0101"
```

### Post-Onboarding Checklist

- [ ] At least 1 client created
- [ ] At least 1 document uploaded
- [ ] QuickBooks connected (if applicable)
- [ ] Team members invited (if multi-user)
- [ ] First workflow created
- [ ] Timer tested
