# Critical Path — 16-Week MVP

> Source of Truth: MASTER_SPEC.md
> References: program/01_wbs.md, program/02_dependencies.md

---

## Critical Path Definition

The critical path is the longest sequence of dependent tasks that determines the minimum project duration. Any delay on the critical path delays launch.

---

## THE CRITICAL PATH (16 Weeks + 1 Week Launch)

```
Week 1 ──────────────────────────────────────────────────────────────
│
├─ WBS-1.1.1: GitHub repo + branch protection (0.5d)
├─ WBS-1.1.2: Monorepo structure (0.5d)
├─ WBS-1.1.3: Docker Compose (Postgres, Redis, Temporal, Typesense) (1d)
├─ WBS-1.2.1: PostgreSQL 16 + extensions (0.5d)
├─ WBS-1.2.2: Core schema (tenants, users, roles, permissions) (2d)
├─ WBS-1.2.3: RLS policies on all tenant tables (1d)
│
Week 2 ──────────────────────────────────────────────────────────────
│
├─ WBS-1.3.1: Axum scaffold + Tower middleware chain (1d)
├─ WBS-1.3.2: SQLx integration with compile-time queries (1d)
├─ WBS-1.3.3: Auth module (Argon2id, JWT RS256) (2d)
├─ WBS-1.3.4: Tenant resolution middleware (0.5d)
├─ WBS-1.3.5: RBAC middleware (1.5d)
│
Week 3 ──────────────────────────────────────────────────────────────
│
├─ WBS-1.3.6: Rate limiting via Redis (0.5d)
├─ WBS-1.3.7: Error taxonomy (0.5d)
├─ WBS-1.3.8: Redis integration (sessions, cache, pub/sub) (1d)
├─ WBS-1.3.9: Structured logging (tracing + Sentry + OTel) (0.5d)
├─ WBS-1.4.1: Next.js 15 scaffold (0.5d)
├─ WBS-1.4.2-1.4.3: Tailwind + shadcn + design tokens (1d)
├─ WBS-1.4.4-1.4.5: TanStack Query + Zustand + Auth UI (1.5d)
├─ WBS-1.4.6-1.4.8: Layout shell + Framer Motion + MSW (1d)
├─ WBS-1.1.4-1.1.5: CI/CD pipelines (1d) [parallel]
│
Week 4 ──────────────────────────────────────────────────────────────
│  *** CRITICAL: Client + Document foundations start ***
│
├─ WBS-2.1.1: clients table + schema (0.5d)
├─ WBS-2.1.3: Client CRUD API (1.5d)
├─ WBS-2.1.6: Field-level encryption (AES-256-GCM + KMS) (1d)
├─ WBS-3.1.1: documents table (0.5d)
├─ WBS-3.1.2: S3 storage setup (0.5d)
├─ WBS-3.1.3: tus server endpoint (1d)
│
Week 5 ──────────────────────────────────────────────────────────────
│
├─ WBS-3.2.1: Temporal document ingestion workflow (2d)
├─ WBS-3.2.2: Claude Vision API integration (2d)
├─ WBS-3.2.3: Confidence scoring logic (0.5d)
├─ WBS-2.2.1: Client workspace UI (1.5d) [parallel]
├─ WBS-2.3.1-2.3.2: Client portal auth + dashboard (1.5d) [parallel]
│
Week 6 ──────────────────────────────────────────────────────────────
│
├─ WBS-3.2.6: Typesense indexing (1d)
├─ WBS-3.3.1-3.3.6: Document UI (upload, list, preview, search) (3d)
├─ WBS-2.4.1-2.4.7: Secure messaging (WebSocket + UI) (2d) [parallel]
├─ WBS-2.3.3-2.3.7: Client portal features (upload, invoices, status) (2d) [parallel]
│
Week 7 ──────────────────────────────────────────────────────────────
│  *** CRITICAL: Workflow engine + Time tracking start ***
│
├─ WBS-4.1.1: workflow tables (0.5d)
├─ WBS-4.1.2: Temporal tax season workflow definitions (2d)
├─ WBS-4.1.3-4.1.5: Step transitions, triggers, approvals (1.5d)
├─ WBS-5.1.1: time_entries table (0.5d)
├─ WBS-5.1.2: Time entry API (1d) [parallel]
│
Week 8 ──────────────────────────────────────────────────────────────
│
├─ WBS-4.1.6: Workflow API (1d)
├─ WBS-4.2.1-4.2.3: Workflow UI (builder, tracker, dashboard) (3d)
├─ WBS-5.2.1-5.2.2: Invoice tables + generation logic (1.5d) [parallel]
├─ WBS-5.1.3-5.1.5: Timer UI + timesheet (1.5d) [parallel]
│
Week 9 ──────────────────────────────────────────────────────────────
│
├─ WBS-4.3.1-4.3.6: Task management (Kanban, list, calendar) (2d)
├─ WBS-4.4.1-4.4.6: Deadline tracking + compliance calendar (2d)
├─ WBS-5.2.5-5.2.6: Invoice PDF + email (1d) [parallel]
├─ WBS-5.3.1-5.3.6: Stripe payments + webhooks + aging (2d) [parallel]
├─ WBS-5.4.1-5.4.3: Expense tracking (1d) [parallel]
│
Week 10 ─────────────────────────────────────────────────────────────
│  *** CRITICAL: Analytics + Integrations start ***
│
├─ WBS-6.1.1: Materialized views for dashboard metrics (1.5d)
├─ WBS-6.1.2-6.1.3: pg_cron + Redis caching (1d)
├─ WBS-6.1.4-6.1.5: Dashboard API + metrics cards UI (1.5d)
├─ WBS-7.1.1-7.1.4: Integration framework (tables, OAuth, tokens) (2d) [parallel]
│
Week 11 ─────────────────────────────────────────────────────────────
│
├─ WBS-6.2.1-6.2.7: All ECharts implementations (3d)
├─ WBS-7.2.1-7.2.6: QuickBooks integration (3d) [parallel]
├─ WBS-7.3.1-7.3.3: Google Drive integration (1.5d) [parallel]
├─ WBS-8.1.1-8.1.5: Notification system (2d) [parallel]
│
Week 12 ─────────────────────────────────────────────────────────────
│
├─ WBS-6.3-6.5: Client analytics, team analytics, financial reports (3d)
├─ WBS-6.6.1-6.6.5: Nightly AI insights pipeline (2d)
├─ WBS-7.1.5-7.1.6: Webhook framework + health dashboard (1.5d) [parallel]
├─ WBS-8.2.1-8.2.4: Real-time architecture (WebSocket + SSE) (1.5d) [parallel]
│
Week 13 ─────────────────────────────────────────────────────────────
│  *** CRITICAL: Hardening phase starts ***
│
├─ WBS-9.1.1-9.1.2: Onboarding wizard (2d)
├─ WBS-9.2.1-9.2.6: Data migration (CSV, QB import, bulk upload) (3d)
├─ WBS-10.1.1-10.1.6: Security controls (MFA, password policy, CORS) (2d) [parallel]
│
Week 14 ─────────────────────────────────────────────────────────────
│
├─ WBS-10.2.1-10.2.5: Compliance (audit trail, retention, GDPR, IRS) (2d)
├─ WBS-11.1.1-11.1.5: Demo mode (3 firms, 30min sessions, guided tour) (3d)
├─ WBS-6.5.3-6.5.5: Custom report builder + export (2d) [parallel]
│
Week 15 ─────────────────────────────────────────────────────────────
│  *** CRITICAL: Testing phase ***
│
├─ WBS-12.1.1: Unit tests to 75% coverage (3d)
├─ WBS-12.1.2: Integration tests — multi-tenancy, auth, pipelines (2d)
├─ WBS-12.1.4: Security tests (OWASP ZAP, auth bypass, XSS/CSRF) (1d) [parallel]
│
Week 16 ─────────────────────────────────────────────────────────────
│
├─ WBS-12.1.3: E2E tests — critical flows (Playwright) (2d)
├─ WBS-12.1.5: Load testing (200 firms, 2000 users, 2000 WS) (1.5d)
├─ WBS-12.1.6: AI accuracy benchmarks (1d)
├─ WBS-12.2.1-12.2.4: Performance optimization (2d)
├─ Bug fixes from test results (ongoing)
│
Week 17 ─────────────────────────────────────────────────────────────
│  *** LAUNCH ***
│
├─ WBS-13.1.1: Penetration test (external firm) (2d)
├─ WBS-13.1.2-13.1.3: Production provisioning + DNS/SSL/CDN (1d)
├─ WBS-13.1.4: Monitoring + alerting (Prometheus, Grafana, Sentry) (1d)
├─ WBS-13.1.5: Runbooks finalized (0.5d)
├─ WBS-13.1.6: Landing page + pricing page live (0.5d)
├─ WBS-13.2.1: Production deploy (staged rollout) (0.5d)
├─ WBS-13.2.2: Smoke tests on production (0.5d)
├─ WBS-13.2.3: On-call rotation established (0.5d)
├─ WBS-13.1.7 + WBS-13.2.4: Beta program launch (first 50 CPAs) (1d)
```

---

## CRITICAL PATH SUMMARY

The single longest chain:

```
Repo Setup (0.5d)
  → Docker Compose (1d)
    → Postgres + Extensions (0.5d)
      → Core Schema (2d)
        → RLS Policies (1d)
          → Axum Scaffold (1d)
            → SQLx Integration (1d)
              → Auth Module (2d)
                → Tenant Middleware (0.5d)
                  → RBAC Middleware (1.5d)
                    → Client CRUD API (1.5d)
                      → Documents Table (0.5d)
                        → Temporal Doc Pipeline (2d)
                          → Claude Vision (2d)
                            → Workflow Tables (0.5d)
                              → Temporal Tax Workflows (2d)
                                → Workflow API (1d)
                                  → Time Entry API (1d)
                                    → Invoice Generation (1.5d)
                                      → Materialized Views (1.5d)
                                        → Dashboard API (1.5d)
                                          → ECharts (3d)
                                            → Onboarding Wizard (2d)
                                              → Unit Tests (3d)
                                                → E2E Tests (2d)
                                                  → Pen Test (2d)
                                                    → Production Deploy (0.5d)

Total critical path: ~35 working days across 17 calendar weeks
```

---

## FLOAT ANALYSIS (Tasks with schedule slack)

| Task Group | Float | Notes |
|---|---|---|
| CI/CD Pipeline (WBS-1.1.4-5) | 2 weeks | Can be done anytime in Weeks 1-3 |
| Client Portal UI (WBS-2.3) | 1 week | Not on critical path, parallel to doc pipeline |
| Messaging (WBS-2.4) | 1 week | Independent of critical path |
| Task Management (WBS-4.3) | 0.5 weeks | Parallel to deadline tracking |
| Expense Tracking (WBS-5.4) | 1.5 weeks | Low complexity, parallel |
| Google Drive Integration (WBS-7.3) | 1 week | Simpler than QB |
| Notification System (WBS-8) | 1.5 weeks | Can start/finish flexibly in Weeks 10-12 |
| Demo Mode (WBS-11) | 0.5 weeks | Must complete by end of Week 14 |
| Custom Report Builder (WBS-6.5.3) | 1 week | Nice-to-have polish |

---

## RISK BUFFERS

| Risk | Mitigation | Buffer |
|---|---|---|
| Claude Vision API latency/reliability | Rule-based fallback, async processing | 2 days in Week 5 |
| Temporal learning curve | Spike in Week 1, pair programming | 3 days across Weeks 4-9 |
| Stripe webhook complexity | Use test mode early, idempotency from Day 1 | 1 day in Week 9 |
| QB API rate limits / data mapping | Start QB integration early in Week 10 | 2 days |
| Performance optimization overruns | Continuous profiling from Week 10 | 3 days in Week 16 |
| Pen test findings | Reserve 2 days for critical fixes | 2 days in Week 17 |
