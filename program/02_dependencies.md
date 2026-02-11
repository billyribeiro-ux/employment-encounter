# Dependency Graph

> Source of Truth: MASTER_SPEC.md
> All WBS IDs reference program/01_wbs.md

---

## Legend

- `→` means "must complete before"
- `||` means "can run in parallel"
- `⊕` means "partial dependency — can start after subset completes"

---

## LAYER 0: ABSOLUTE PREREQUISITES (Nothing starts without these)

```
WBS-1.1 (Project Setup) → ALL
WBS-1.2 (Database Foundation) → ALL data-dependent work
WBS-1.3 (Backend Foundation) → ALL API work
WBS-1.4 (Frontend Foundation) → ALL UI work
```

### Internal ordering within Layer 0:

```
WBS-1.1.1 (GitHub repo) → WBS-1.1.4 (CI pipeline) → WBS-1.1.5 (CD pipeline)
WBS-1.1.2 (Monorepo structure) → WBS-1.3.1 (Axum scaffold) || WBS-1.4.1 (Next.js scaffold)
WBS-1.1.3 (Docker Compose) → WBS-1.2.1 (Postgres provisioning)
WBS-1.2.1 (Postgres + extensions) → WBS-1.2.2 (Core schema) → WBS-1.2.3 (RLS policies)
WBS-1.2.2 (Core schema) → WBS-1.3.2 (SQLx integration)
WBS-1.3.3 (Auth module) → WBS-1.3.4 (Tenant middleware) → WBS-1.3.5 (RBAC middleware)
WBS-1.3.8 (Redis integration) → WBS-1.3.6 (Rate limiting)
WBS-1.4.1 (Next.js scaffold) → WBS-1.4.2 (Tailwind + shadcn) → WBS-1.4.3 (Design tokens)
WBS-1.4.4 (TanStack Query + Zustand) → WBS-1.4.5 (Auth flow UI)
WBS-1.4.5 (Auth flow UI) ⊕ WBS-1.3.3 (Auth module backend)
```

---

## LAYER 1: CORE FEATURES (Weeks 4-6)

### Client Management (WBS-2) dependencies:

```
WBS-1.2.2 (Core schema) → WBS-2.1.1 (clients table)
WBS-1.3.5 (RBAC) → WBS-2.1.3 (Client CRUD API)
WBS-1.3.8 (Redis) → WBS-2.1.4 (Typesense client search)
WBS-2.1.1 (clients table) → WBS-2.1.6 (Field-level encryption)
WBS-2.1.3 (Client CRUD API) → WBS-2.2.1 (Client workspace UI)
WBS-1.3.3 (Auth) → WBS-2.3.1 (Client portal auth)
WBS-2.3.1 (Client portal auth) → WBS-2.3.2 (Client dashboard)
WBS-2.4.1 (messages table) → WBS-2.4.2 (WebSocket messaging)
WBS-1.3.8 (Redis pub/sub) → WBS-2.4.2 (WebSocket messaging)
```

### Document Management (WBS-3) dependencies:

```
WBS-2.1.1 (clients table) → WBS-3.1.1 (documents table — needs client_id FK)
WBS-1.3.8 (Redis) → WBS-3.2.1 (Temporal workflow — needs job queue)
WBS-3.1.1 (documents table) → WBS-3.1.2 (S3 storage setup)
WBS-3.1.2 (S3 storage) → WBS-3.1.3 (tus server endpoint)
WBS-3.1.3 (tus server) → WBS-3.1.4 (tus-js-client frontend)
WBS-3.1.1 (documents table) → WBS-3.2.1 (Temporal ingestion workflow)
WBS-3.2.1 (Temporal workflow) → WBS-3.2.2 (Claude Vision integration)
WBS-3.2.2 (Claude Vision) → WBS-3.2.3 (Confidence scoring)
WBS-3.2.6 (Typesense indexing) ⊕ WBS-3.2.2 (Claude Vision — needs extracted data)
WBS-3.1.4 (tus frontend) → WBS-3.3.1 (Upload UI)
WBS-3.2.3 (Confidence scoring) → WBS-3.3.2 (Document list with AI metadata)
```

### Parallel tracks in Layer 1:

```
WBS-2 (Client Management) || WBS-3 (Document Management)
  — except WBS-3.1.1 depends on WBS-2.1.1 (client_id FK)
```

---

## LAYER 2: WORKFLOW & BILLING (Weeks 7-9)

### Workflow (WBS-4) dependencies:

```
WBS-2.1.1 (clients table) → WBS-4.1.1 (workflow tables — needs client_id FK)
WBS-3.2.1 (Temporal setup from doc pipeline) → WBS-4.1.2 (Temporal workflow definitions)
WBS-4.1.1 (workflow tables) → WBS-4.1.6 (Workflow API)
WBS-4.1.6 (Workflow API) → WBS-4.2.1 (Workflow builder UI)
WBS-2.1.1 (clients table) → WBS-4.4.1 (compliance_deadlines table)
WBS-4.4.1 (compliance_deadlines) → WBS-4.4.2 (Auto-generate calendar)
WBS-4.4.2 (Calendar generation) → WBS-4.4.3 (Temporal reminder workflows)
```

### Time/Invoicing (WBS-5) dependencies:

```
WBS-2.1.1 (clients table) → WBS-5.1.1 (time_entries table)
WBS-5.1.1 (time_entries) → WBS-5.1.2 (Time entry API)
WBS-5.1.2 (Time entry API) → WBS-5.2.2 (Invoice generation logic)
WBS-5.2.1 (invoices table) → WBS-5.2.2 (Invoice generation)
WBS-5.2.2 (Invoice generation) → WBS-5.2.5 (Invoice PDF — React-PDF)
WBS-5.2.5 (Invoice PDF) → WBS-5.2.6 (Invoice email — Resend)
WBS-5.3.1 (Stripe integration) → WBS-5.3.2 (Webhook handler)
WBS-5.3.2 (Webhook handler) → WBS-5.3.3 (Invoice status lifecycle)
WBS-1.3.8 (Redis) → WBS-5.1.6 (Utilization metrics cache)
```

### Parallel tracks in Layer 2:

```
WBS-4 (Workflows) || WBS-5 (Time/Invoicing)
  — independent feature pillars, share only client table dependency
```

---

## LAYER 3: ANALYTICS & INTEGRATIONS (Weeks 10-12)

### Analytics (WBS-6) dependencies:

```
WBS-5.1.1 (time_entries) + WBS-5.2.1 (invoices) → WBS-6.1.1 (Materialized views)
WBS-6.1.1 (Materialized views) → WBS-6.1.2 (pg_cron refresh)
WBS-6.1.1 (Materialized views) → WBS-6.1.3 (Redis caching layer)
WBS-6.1.3 (Redis cache) → WBS-6.1.4 (Dashboard API)
WBS-6.1.4 (Dashboard API) → WBS-6.1.5 (Key metrics cards UI)
WBS-6.1.5 (Metrics UI) → WBS-6.2.* (All ECharts implementations)
WBS-6.6.1 (Temporal cron) ⊕ WBS-3.2.2 (Claude API setup already done)
WBS-6.6.2 (Client metrics calc) → WBS-6.6.3 (Claude recommendations)
```

### Integrations (WBS-7) dependencies:

```
WBS-1.3.8 (Redis) → WBS-7.1.5 (Webhook ingestion framework)
WBS-7.1.1 (integration_connections table) → WBS-7.1.2 (OAuth2 framework)
WBS-7.1.2 (OAuth2 framework) → WBS-7.2.1 (QB OAuth) || WBS-7.3.1 (Drive OAuth)
WBS-7.1.3 (Encrypted token storage) → WBS-7.1.4 (Token refresh)
WBS-7.2.1 (QB OAuth) → WBS-7.2.2 (QB historical sync)
WBS-7.2.2 (QB sync) → WBS-7.2.3 (Ongoing sync via Temporal cron)
WBS-5.3.1 (Stripe setup) → WBS-7.4.1 (Stripe Connect — already done in WBS-5)
```

### Notifications (WBS-8) dependencies:

```
WBS-1.3.8 (Redis pub/sub) → WBS-8.2.1 (WebSocket server)
WBS-8.1.1 (notifications table) → WBS-8.1.2 (Multi-channel delivery)
WBS-8.1.2 (Delivery engine) → WBS-8.1.4 (In-app notification bell)
WBS-8.2.1 (WebSocket server) → WBS-8.2.2 (SSE for dashboard)
```

### Parallel tracks in Layer 3:

```
WBS-6 (Analytics) || WBS-7 (Integrations) || WBS-8 (Notifications)
  — WBS-6 needs WBS-5 data; WBS-7 and WBS-8 are independent
```

---

## LAYER 4: HARDENING (Weeks 13-14)

```
WBS-9 (Onboarding) ⊕ WBS-2 + WBS-3 + WBS-7 (needs client import, doc upload, integrations)
WBS-10 (Security Hardening) ⊕ WBS-1.3 (builds on auth foundation)
WBS-11 (Demo Mode) ⊕ ALL feature pillars (needs working product to demo)

WBS-9 || WBS-10 || WBS-11 — all three can run in parallel
```

---

## LAYER 5: TESTING & LAUNCH (Weeks 15-17)

```
WBS-12 (Testing) → requires ALL WBS-1 through WBS-11 substantially complete
WBS-12.1.1-12.1.3 (Unit/Integration/E2E) || WBS-12.1.4 (Security tests) || WBS-12.1.5 (Load tests)
WBS-12.2 (Performance optimization) ⊕ WBS-12.1 (test results inform optimization)
WBS-13 (Launch) → requires WBS-12 pass criteria met
WBS-13.1.1 (Pen test) → WBS-13.2.1 (Production deploy)
WBS-13.1.4 (Monitoring setup) → WBS-13.2.3 (On-call rotation)
```

---

## CROSS-CUTTING DEPENDENCIES

| Dependency | Blocks | Risk |
|---|---|---|
| AWS KMS setup | All Tier 1 encryption (WBS-2.1.6, WBS-3.1.6, WBS-7.1.3) | High — must be done in Week 1 |
| Temporal cluster | All workflows (WBS-3.2, WBS-4.1, WBS-4.4, WBS-5.2, WBS-6.6, WBS-7.2) | High — must be in Docker Compose Day 1 |
| Typesense cluster | All search (WBS-2.1.4, WBS-3.2.6, WBS-3.3.6) | Medium — can use PG full-text as fallback |
| Claude API key | AI categorization (WBS-3.2.2), insights (WBS-6.6.3) | High — no fallback for categorization |
| Stripe account | Payments (WBS-5.3, WBS-7.4) | Medium — can use test mode |
| Resend account | All email (WBS-5.2.6, WBS-8.1.2) | Low — can stub in dev |
| S3 bucket | Document storage (WBS-3.1.2) | High — core feature |
