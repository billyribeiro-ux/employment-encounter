# Master Work Breakdown Structure (WBS)

> Source of Truth: MASTER_SPEC.md  
> Generated: 2026-02-10

---

## WBS-1: FOUNDATION & INFRASTRUCTURE (Weeks 1-3)

### WBS-1.1: Project Setup
- WBS-1.1.1: GitHub repo, branch protection, conventional commits
- WBS-1.1.2: Monorepo structure (frontend/, backend/, shared/, infra/)
- WBS-1.1.3: Docker Compose local dev environment (Postgres 16, Redis 7, Temporal, Typesense)
- WBS-1.1.4: CI pipeline — cargo check/clippy/test, sqlx prepare --check, frontend typecheck/lint/test
- WBS-1.1.5: CD pipeline — staging deploy on merge to main, smoke tests, production deploy

### WBS-1.2: Database Foundation
- WBS-1.2.1: PostgreSQL 16 provisioning + extensions (pgvector, pg_cron, uuid-ossp)
- WBS-1.2.2: Core schema migration — tenants, users, roles, permissions tables
- WBS-1.2.3: RLS policies on all tenant-scoped tables (fail-safe: zero rows if no tenant context)
- WBS-1.2.4: Audit log table with monthly partitioning
- WBS-1.2.5: Seed data scripts (dev/demo tenants)

### WBS-1.3: Backend Foundation
- WBS-1.3.1: Axum 0.8+ project scaffold with Tower middleware chain
- WBS-1.3.2: SQLx 0.8+ integration with compile-time verified queries
- WBS-1.3.3: Authentication module — Argon2id hashing, JWT RS256 (15min access / 7d refresh)
- WBS-1.3.4: Tenant resolution middleware (extract tenant_id from JWT, set app.current_tenant)
- WBS-1.3.5: RBAC middleware (role + resource + action + field-level checks)
- WBS-1.3.6: Rate limiting middleware via Redis (per-tenant tiers: 100/500/2000 req/min)
- WBS-1.3.7: Error taxonomy and standard error response format
- WBS-1.3.8: Redis 7+ integration via fred crate (sessions, cache, pub/sub)
- WBS-1.3.9: Structured logging (tracing + tracing-subscriber + Sentry + OTel)

### WBS-1.4: Frontend Foundation
- WBS-1.4.1: Next.js 15 App Router project scaffold with TypeScript strict
- WBS-1.4.2: Tailwind CSS v4 + shadcn/ui setup
- WBS-1.4.3: Design system tokens (colors, spacing, typography, shadows)
- WBS-1.4.4: TanStack Query v5 provider + Zustand stores
- WBS-1.4.5: Auth flow (login, register, MFA TOTP, password reset)
- WBS-1.4.6: Layout shell (sidebar nav, header, notification bell)
- WBS-1.4.7: Framer Motion page transition wrapper
- WBS-1.4.8: MSW mock server for frontend-first development

---

## WBS-2: CLIENT MANAGEMENT (Weeks 4-6)

### WBS-2.1: Client Data Model & API
- WBS-2.1.1: clients table — profile, contacts, business type, fiscal year, encrypted tax_id
- WBS-2.1.2: client_contacts table — primary/secondary contacts
- WBS-2.1.3: CRUD API endpoints: POST/GET/PUT/DELETE /api/v1/clients
- WBS-2.1.4: Client search via Typesense (name, EIN, address, typo-tolerant)
- WBS-2.1.5: Client list with pagination, sorting, filtering
- WBS-2.1.6: Field-level encryption for Tier 1 data (SSN, EIN, bank accounts) via AES-256-GCM + KMS

### WBS-2.2: Client Workspace (Internal CPA View)
- WBS-2.2.1: Client master dashboard page (profile, quick stats, filing status, action items)
- WBS-2.2.2: Client contacts section
- WBS-2.2.3: Financial overview (3-year revenue, tax liability, fee breakdown, profitability)
- WBS-2.2.4: Activity feed / timeline (color-coded, filterable, searchable)
- WBS-2.2.5: Risk profile / red flags display

### WBS-2.3: Client Portal (Client-Facing)
- WBS-2.3.1: Client auth flow (separate JWT claims, Client role)
- WBS-2.3.2: Client dashboard (tax status, documents needed, deadlines, balance)
- WBS-2.3.3: Document upload portal (drag-drop, tus resumable)
- WBS-2.3.4: Invoice & payment history with online payment (Stripe)
- WBS-2.3.5: Tax filing status tracker
- WBS-2.3.6: Self-service tax questionnaire (structured intake forms)
- WBS-2.3.7: Mobile-responsive PWA shell

### WBS-2.4: Secure Messaging
- WBS-2.4.1: messages table — threaded conversations, per-client
- WBS-2.4.2: WebSocket real-time message delivery
- WBS-2.4.3: File attachments in messages (S3-backed)
- WBS-2.4.4: @mentions for team collaboration
- WBS-2.4.5: Read receipts with timestamps
- WBS-2.4.6: Canned response templates
- WBS-2.4.7: Message search (Typesense)

---

## WBS-3: DOCUMENT MANAGEMENT & AI (Weeks 4-6)

### WBS-3.1: Document Storage
- WBS-3.1.1: documents table — metadata, category, confidence, tenant_id, client_id
- WBS-3.1.2: AWS S3 storage with per-tenant bucket prefixes
- WBS-3.1.3: tus server endpoint for resumable uploads (backend Rust)
- WBS-3.1.4: tus-js-client integration (frontend)
- WBS-3.1.5: File validation (type, size < 50MB, ClamAV virus scan)
- WBS-3.1.6: Encryption at rest (AES-256, per-tenant keys via KMS)
- WBS-3.1.7: Version history tracking
- WBS-3.1.8: Secure sharing (encrypted links with expiration)

### WBS-3.2: AI Categorization Pipeline
- WBS-3.2.1: Temporal workflow — document ingestion pipeline
- WBS-3.2.2: Claude Vision API integration (categorize W-2, 1099-*, receipts, K-1, etc.)
- WBS-3.2.3: Confidence scoring (>95% auto-accept, 75-95% flag, <75% require verification)
- WBS-3.2.4: Data extraction (date, amount, category, payer/payee, tax treatment)
- WBS-3.2.5: CPA override + feedback loop
- WBS-3.2.6: Typesense indexing for full-text document search
- WBS-3.2.7: Google Drive backup sync (if connected)

### WBS-3.3: Document UI
- WBS-3.3.1: Drag-drop upload interface with batch progress
- WBS-3.3.2: Document list view (organized by category, AI metadata)
- WBS-3.3.3: Document preview (React-PDF, view without downloading)
- WBS-3.3.4: Batch operations (select multiple, re-categorize, download)
- WBS-3.3.5: Document linking (to client, tax year, form, workflow step)
- WBS-3.3.6: Semantic search UI (Typesense InstantSearch)

---

## WBS-4: WORKFLOW & TASK MANAGEMENT (Weeks 7-9)

### WBS-4.1: Workflow Engine
- WBS-4.1.1: workflow_templates, workflow_instances, workflow_steps tables
- WBS-4.1.2: Temporal workflow definitions for tax season pipeline (7 steps)
- WBS-4.1.3: Step transitions with conditional branching
- WBS-4.1.4: Automatic triggers ("when all docs uploaded, advance to Step 2")
- WBS-4.1.5: Approval requirements (partner review gate)
- WBS-4.1.6: Workflow API — CRUD templates, instantiate per client, advance steps

### WBS-4.2: Workflow UI
- WBS-4.2.1: Workflow template builder (drag-and-drop steps, assignees, deadlines)
- WBS-4.2.2: Active workflow tracker (progress bar per client)
- WBS-4.2.3: Workflow dashboard (all active workflows, filterable by status/CPA/client)

### WBS-4.3: Task Management
- WBS-4.3.1: tasks table — title, assignee, due date, priority, status, client_id
- WBS-4.3.2: Task CRUD API
- WBS-4.3.3: Kanban board view (To Do, In Progress, Review, Done)
- WBS-4.3.4: List view with sorting/filtering
- WBS-4.3.5: Calendar view (tasks overlaid on deadlines)
- WBS-4.3.6: Recurring tasks

### WBS-4.4: Deadline & Compliance Tracking
- WBS-4.4.1: compliance_deadlines table — filing type, dates, state, extension status
- WBS-4.4.2: Auto-generate compliance calendar per client (1040, 1120-S, 1065, state-specific)
- WBS-4.4.3: Temporal scheduled workflows for reminder sequences (30d, 14d, 7d, 1d, day-of, missed)
- WBS-4.4.4: Escalation logic (missed → auto-escalate to partner, audit trail)
- WBS-4.4.5: Compliance calendar UI
- WBS-4.4.6: Compliance report generation (E&O insurance documentation)

---

## WBS-5: TIME TRACKING & INVOICING (Weeks 7-9)

### WBS-5.1: Time Tracking
- WBS-5.1.1: time_entries table — client_id, user_id, hours, rate, description, billable, date
- WBS-5.1.2: Time entry CRUD API
- WBS-5.1.3: Start/stop timer with pause/resume
- WBS-5.1.4: Weekly timesheet view with bulk entry
- WBS-5.1.5: Desktop notification if timer > 4 hours
- WBS-5.1.6: Utilization metrics (Redis cache + DB materialized view)

### WBS-5.2: Invoice Generation
- WBS-5.2.1: invoices, invoice_line_items tables
- WBS-5.2.2: Invoice generation — hourly, flat fee, hybrid
- WBS-5.2.3: Auto-generate rules (threshold, monthly cycle, workflow completion)
- WBS-5.2.4: Recurring invoices (monthly bookkeeping clients)
- WBS-5.2.5: Invoice PDF generation (React-PDF)
- WBS-5.2.6: Invoice email delivery via Resend

### WBS-5.3: Payment Processing
- WBS-5.3.1: Stripe integration — credit card + ACH
- WBS-5.3.2: Stripe webhook handler (payment confirmation, idempotency keys)
- WBS-5.3.3: Invoice status lifecycle (Draft → Sent → Viewed → Paid / Overdue / Disputed)
- WBS-5.3.4: Automated collection emails (15d, 30d, 45d reminders)
- WBS-5.3.5: Aging report (0-30, 31-60, 61-90, 90+ days)
- WBS-5.3.6: Late fee configuration

### WBS-5.4: Expense Tracking
- WBS-5.4.1: expenses table — date, category, amount, client_id, receipt_document_id
- WBS-5.4.2: Expense CRUD API + UI
- WBS-5.4.3: P&L impact tracking

---

## WBS-6: ANALYTICS & DASHBOARD (Weeks 10-12)

### WBS-6.1: Firm Dashboard
- WBS-6.1.1: Materialized views for dashboard metrics (revenue, growth, utilization, AR)
- WBS-6.1.2: pg_cron refresh schedule (every 5 min for hot metrics)
- WBS-6.1.3: Redis caching layer for dashboard data
- WBS-6.1.4: Dashboard API endpoints
- WBS-6.1.5: Key metrics cards (revenue YTD, MoM growth, active clients, utilization, outstanding invoices)
- WBS-6.1.6: AI Insights section (upsell, churn risk, deadline alerts)

### WBS-6.2: Charts (Apache ECharts)
- WBS-6.2.1: Revenue Trend — line + area, 800ms animated draw, hover tooltips, click filter
- WBS-6.2.2: Revenue by Service — donut, 600ms animated slices, drill-down
- WBS-6.2.3: Team Utilization — bar chart, color-coded (green/yellow/red), staggered animation
- WBS-6.2.4: Filing Status — donut, real-time updates
- WBS-6.2.5: Client Profitability Scatter — quadrant analysis, hover details
- WBS-6.2.6: Cash Flow Forecast — area chart, 30/60/90-day projections
- WBS-6.2.7: Custom ECharts theme matching design system

### WBS-6.3: Client Analytics
- WBS-6.3.1: Per-client analytics page (fees, profitability, engagement, risk, churn prediction)
- WBS-6.3.2: Cohort analysis (by industry, revenue size, service type, location, tenure)
- WBS-6.3.3: Upsell opportunity scoring (AI-powered)

### WBS-6.4: Team Analytics
- WBS-6.4.1: Per-CPA utilization dashboard
- WBS-6.4.2: Workload trend (4-week rolling)
- WBS-6.4.3: Hiring needs forecast (utilization > 85% for 3 months)

### WBS-6.5: Financial Reporting
- WBS-6.5.1: Firm P&L report (by service, client, CPA)
- WBS-6.5.2: Cash flow report (DSO, AR aging)
- WBS-6.5.3: Custom report builder (drag-and-drop, dimensions, measures, chart types)
- WBS-6.5.4: Report scheduling (weekly/monthly email)
- WBS-6.5.5: Export (PDF, CSV, Excel)

### WBS-6.6: Nightly AI Insights Pipeline
- WBS-6.6.1: Temporal cron workflow (2 AM per tenant)
- WBS-6.6.2: Client metrics calculation (revenue, profitability, growth, engagement, risk, churn)
- WBS-6.6.3: Claude API recommendation generation (with rule-based fallback)
- WBS-6.6.4: Daily digest email (top 5 action items)
- WBS-6.6.5: Accept/snooze/dismiss actions with feedback loop

---

## WBS-7: INTEGRATIONS (Weeks 10-12)

### WBS-7.1: Integration Framework
- WBS-7.1.1: integration_connections table — provider, tenant_id, encrypted tokens, status
- WBS-7.1.2: OAuth2 flow framework (oauth2 crate)
- WBS-7.1.3: Encrypted token storage (per-tenant encryption via KMS)
- WBS-7.1.4: Automatic token refresh (30 days before expiry)
- WBS-7.1.5: Webhook ingestion framework (signature verification, replay protection, idempotent processing)
- WBS-7.1.6: Integration health dashboard (last sync, status, error count)

### WBS-7.2: QuickBooks Online (Priority 1 — MVP)
- WBS-7.2.1: QB OAuth2 connection flow
- WBS-7.2.2: Initial historical sync (up to 3 years: transactions, CoA, P&L, BS, cash flow)
- WBS-7.2.3: Ongoing sync (every 4 hours via Temporal cron)
- WBS-7.2.4: Bi-directional invoice sync
- WBS-7.2.5: Duplicate detection on transactions
- WBS-7.2.6: Retry logic (exponential backoff, max 3 attempts)

### WBS-7.3: Google Drive (Priority 1 — MVP)
- WBS-7.3.1: Drive OAuth2 connection flow
- WBS-7.3.2: Document backup sync (Firm / Client / Tax Year / Category folder structure)
- WBS-7.3.3: Background retry on sync failure

### WBS-7.4: Stripe (Priority 1 — MVP)
- WBS-7.4.1: Stripe Connect setup
- WBS-7.4.2: Payment intent creation (credit card + ACH)
- WBS-7.4.3: Webhook handler (payment confirmation, refunds)
- WBS-7.4.4: Idempotency key management

---

## WBS-8: NOTIFICATIONS & REAL-TIME (Weeks 10-12)

### WBS-8.1: Notification System
- WBS-8.1.1: notifications table — type, recipient, channel, status, payload
- WBS-8.1.2: Multi-channel delivery (in-app, email via Resend, push)
- WBS-8.1.3: Notification preferences per user
- WBS-8.1.4: In-app notification bell with unread count (WebSocket push)
- WBS-8.1.5: Email templates (React Email)

### WBS-8.2: Real-Time Architecture
- WBS-8.2.1: WebSocket server (Axum + Redis pub/sub for multi-instance broadcast)
- WBS-8.2.2: Server-Sent Events for dashboard metric updates
- WBS-8.2.3: TanStack Query real-time polling integration
- WBS-8.2.4: Tenant-scoped channels

---

## WBS-9: ONBOARDING & MIGRATION (Weeks 13-14)

### WBS-9.1: Onboarding Wizard
- WBS-9.1.1: 7-step wizard UI (firm profile, invite team, import clients, import docs, integrations, workflows, guided tour)
- WBS-9.1.2: Progress tracking and resume capability

### WBS-9.2: Data Migration
- WBS-9.2.1: CSV/Excel import with column mapping wizard
- WBS-9.2.2: Validation report (errors, missing fields, preview first 10)
- WBS-9.2.3: Undo capability (delete imported within 24 hours)
- WBS-9.2.4: QuickBooks historical import (full data pull via OAuth)
- WBS-9.2.5: Document bulk upload (ZIP or Google Drive folder, AI batch processing)
- WBS-9.2.6: Import templates (downloadable Excel with sample data)

---

## WBS-10: SECURITY HARDENING & COMPLIANCE (Weeks 13-14)

### WBS-10.1: Security Controls
- WBS-10.1.1: MFA enforcement for Partner/Admin roles (TOTP)
- WBS-10.1.2: Password policy enforcement (12 char min, HaveIBeenPwned check)
- WBS-10.1.3: Session management (Redis-backed, per-device, remote logout)
- WBS-10.1.4: CORS strict origin whitelist
- WBS-10.1.5: Request signing for webhook deliveries (HMAC-SHA256)
- WBS-10.1.6: Input validation (Zod schemas on every endpoint)

### WBS-10.2: Compliance
- WBS-10.2.1: Audit trail completeness verification
- WBS-10.2.2: Data retention policies (7-year auto-archive, S3 Glacier)
- WBS-10.2.3: Tenant offboarding flow (30d grace → 60d export → 150d hard delete)
- WBS-10.2.4: GDPR data export and right-to-deletion flows
- WBS-10.2.5: IRS Pub 4557 / FTC Safeguards control mapping

---

## WBS-11: DEMO & INTERACTIVE ENVIRONMENT (Weeks 13-14)

### WBS-11.1: Demo Mode
- WBS-11.1.1: Demo tenant strategy (3 seeded firms: solo, small, medium)
- WBS-11.1.2: 30-minute session logic with auto-reset
- WBS-11.1.3: Guided tour (key aha moments, conversion CTA placements)
- WBS-11.1.4: Safeguards (no real payments/webhooks, sandboxed integrations)
- WBS-11.1.5: No-signup access (demo usable without account creation)

---

## WBS-12: TESTING & QA (Weeks 15-16)

### WBS-12.1: Test Execution
- WBS-12.1.1: Unit tests — 75% coverage target (Vitest frontend, cargo test backend)
- WBS-12.1.2: Integration tests — 20% (API + DB, multi-tenancy isolation)
- WBS-12.1.3: E2E tests — 5% critical flows (Playwright)
- WBS-12.1.4: Security tests (OWASP ZAP, auth bypass, XSS/CSRF/SQLi)
- WBS-12.1.5: Load testing (200 firms, 2000 concurrent users, 2000 WebSocket connections)
- WBS-12.1.6: AI accuracy benchmarks (document categorization targets)

### WBS-12.2: Performance Optimization
- WBS-12.2.1: Lighthouse 90+ (Performance, Accessibility, Best Practices)
- WBS-12.2.2: FCP < 1.5s, TTI < 3s, bundle < 200KB initial JS
- WBS-12.2.3: API response times < 200ms p95
- WBS-12.2.4: Query optimization (hot-path index coverage)

---

## WBS-13: LAUNCH PREPARATION (Week 17)

### WBS-13.1: Pre-Launch
- WBS-13.1.1: Penetration test (third-party)
- WBS-13.1.2: Production environment provisioning
- WBS-13.1.3: DNS, SSL, CDN configuration
- WBS-13.1.4: Monitoring + alerting setup (Prometheus, Grafana, Sentry, PagerDuty)
- WBS-13.1.5: Runbooks (incident, deploy rollback, DB migration rollback, degraded mode)
- WBS-13.1.6: Landing page + pricing page live
- WBS-13.1.7: Beta program launch (first 50 CPAs)

### WBS-13.2: Launch
- WBS-13.2.1: Production deploy with staged rollout
- WBS-13.2.2: Smoke tests on production
- WBS-13.2.3: On-call rotation established
- WBS-13.2.4: Beta user onboarding support
