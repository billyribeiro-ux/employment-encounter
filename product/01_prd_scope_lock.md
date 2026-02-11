# Product Requirements Document — Scope Lock

> Source of Truth: MASTER_SPEC.md
> Status: LOCKED for MVP (Weeks 1-16)

---

## 1. Functional Requirements Catalog

### FR-100: Authentication & Authorization

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-101 | User registration with email/password | Must | MVP |
| FR-102 | Password hashing via Argon2id | Must | MVP |
| FR-103 | JWT RS256 access tokens (15 min) + refresh tokens (7 days) | Must | MVP |
| FR-104 | MFA via TOTP required for Partner/Admin roles | Must | MVP |
| FR-105 | Session management: Redis-backed, per-device, remote logout | Must | MVP |
| FR-106 | Rate limiting: 5 failed logins → 15 min lockout | Must | MVP |
| FR-107 | Password policy: 12 char min, HaveIBeenPwned check | Must | MVP |
| FR-108 | Role-based access: Staff, Senior, Manager, Partner, Admin, Client | Must | MVP |
| FR-109 | Resource-level authorization (per-client data access) | Must | MVP |
| FR-110 | Field-level authorization (SSN visible to Partner/Admin only) | Must | MVP |

### FR-200: Multi-Tenancy

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-201 | Every table includes tenant_id (UUID, NOT NULL, indexed) | Must | MVP |
| FR-202 | RLS policies on all tenant-scoped tables | Must | MVP |
| FR-203 | Fail-safe: missing tenant context returns zero rows | Must | MVP |
| FR-204 | tenant_id derived from JWT only, never from client payload | Must | MVP |
| FR-205 | Redis caching tenant-scoped (tenant:{id}: prefix) | Must | MVP |
| FR-206 | Background jobs carry tenant context in payload | Must | MVP |
| FR-207 | Per-tenant encryption keys via AWS KMS envelope encryption | Must | MVP |
| FR-208 | Tenant onboarding: create tenant → admin user → default templates → wizard | Must | MVP |
| FR-209 | Tenant offboarding: 30d grace → export → 60d soft delete → 150d hard delete | Must | MVP |

### FR-300: Client Management

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-301 | Client CRUD (create, read, update, soft-delete) | Must | MVP |
| FR-302 | Client profile: name, contact, business type, fiscal year, encrypted tax_id | Must | MVP |
| FR-303 | Client contacts: primary + secondary with contact history | Must | MVP |
| FR-304 | Client search via Typesense (name, EIN, address, typo-tolerant) | Must | MVP |
| FR-305 | Client workspace: master dashboard, quick stats, filing status | Must | MVP |
| FR-306 | Financial overview: 3-year revenue, tax liability, fee breakdown, profitability | Must | MVP |
| FR-307 | Activity feed / timeline: all interactions logged, color-coded, filterable | Must | MVP |
| FR-308 | Risk profile / red flags (late payments, compliance issues) | Must | MVP |
| FR-309 | Assigned team member per client | Must | MVP |

### FR-400: Client Portal

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-401 | Client-facing dashboard: tax status, documents needed, deadlines, balance | Must | MVP |
| FR-402 | Document upload portal with AI auto-categorization | Must | MVP |
| FR-403 | Secure messaging to CPA (threaded, read receipts) | Must | MVP |
| FR-404 | Tax filing status tracker (pending → submitted → completed) | Must | MVP |
| FR-405 | Invoice & payment history with online payment | Must | MVP |
| FR-406 | Tax documents download (final returns) | Must | MVP |
| FR-407 | Self-service tax questionnaire (structured intake forms) | Should | MVP |
| FR-408 | Mobile-responsive PWA | Must | MVP |
| FR-409 | Missing document alerts | Must | MVP |
| FR-410 | Smart document request lists (AI-powered) | Should | MVP |
| FR-411 | Multi-person access (client invites accountant, partner) | Should | MVP |
| FR-412 | Secure sharing (encrypted links with expiration) | Must | MVP |
| FR-413 | White-label: custom domain, logo, colors (Scale tier only) | Should | MVP |

### FR-500: Document Management & AI

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-501 | Drag-drop upload + click to browse | Must | MVP |
| FR-502 | Resumable uploads via tus protocol | Must | MVP |
| FR-503 | File validation: type, size < 50MB, virus scan (ClamAV) | Must | MVP |
| FR-504 | Multiple formats: PDF, image, Excel, Word | Must | MVP |
| FR-505 | Batch upload with progress indicator | Must | MVP |
| FR-506 | AWS S3 storage with per-tenant bucket prefixes | Must | MVP |
| FR-507 | Encryption at rest (AES-256, per-tenant keys) | Must | MVP |
| FR-508 | Version history | Must | MVP |
| FR-509 | AI categorization via Claude Vision (W-2, 1099-*, receipts, K-1, etc.) | Must | MVP |
| FR-510 | Confidence scoring: >95% auto-accept, 75-95% flag, <75% manual | Must | MVP |
| FR-511 | Data extraction: date, amount, category, payer, description, tax treatment | Must | MVP |
| FR-512 | CPA override with feedback loop | Must | MVP |
| FR-513 | Semantic search via Typesense + pgvector | Must | MVP |
| FR-514 | Document linking: to client, tax year, form, workflow step | Must | MVP |
| FR-515 | Document preview (React-PDF, view without downloading) | Must | MVP |
| FR-516 | Batch operations (select multiple, re-categorize, download) | Must | MVP |
| FR-517 | Compliance audit trail: who uploaded, viewed, changed, deleted | Must | MVP |
| FR-518 | Retention: 7-year auto-archive, S3 Glacier cold storage | Must | MVP |
| FR-519 | Google Drive backup sync | Must | MVP |

### FR-600: Tax Workflow Automation

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-601 | 7-step tax season workflow template | Must | MVP |
| FR-602 | Custom workflow builder (drag-and-drop steps, assignees, deadlines) | Must | MVP |
| FR-603 | Conditional branching | Must | MVP |
| FR-604 | Approval requirements (partner review gate) | Must | MVP |
| FR-605 | Automatic triggers (e.g., all docs uploaded → advance step) | Must | MVP |
| FR-606 | Workflow template reuse and cloning | Must | MVP |
| FR-607 | Durable execution (survives server restarts via Temporal) | Must | MVP |

### FR-700: Task Management

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-701 | Ad-hoc task CRUD with assignee, due date, priority | Must | MVP |
| FR-702 | Kanban board view (To Do, In Progress, Review, Done) | Must | MVP |
| FR-703 | List view with sorting/filtering | Must | MVP |
| FR-704 | Calendar view (tasks overlaid on deadlines) | Must | MVP |
| FR-705 | Recurring tasks | Must | MVP |

### FR-800: Deadline & Compliance Tracking

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-801 | Auto-generate compliance calendar per client filing type (1040, 1120-S, 1065) | Must | MVP |
| FR-802 | State-specific deadlines with multi-state support | Must | MVP |
| FR-803 | Reminder sequence: 30d, 14d, 7d, 1d, day-of, missed | Must | MVP |
| FR-804 | Missed deadline: auto-escalate to partner, audit trail, compliance report | Must | MVP |
| FR-805 | Extension filing: update calendar, restart reminders | Must | MVP |
| FR-806 | Compliance report generation for E&O insurance | Must | MVP |

### FR-900: Time Tracking & Invoicing

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-901 | Time entry: client, hours, rate, description, billable flag, date | Must | MVP |
| FR-902 | Start/stop timer with pause/resume | Must | MVP |
| FR-903 | Desktop notification if timer > 4 hours | Should | MVP |
| FR-904 | Weekly timesheet view with bulk entry | Must | MVP |
| FR-905 | Invoice generation: hourly, flat fee, hybrid | Must | MVP |
| FR-906 | Auto-generate at threshold ($2,500) or monthly cycle | Must | MVP |
| FR-907 | Recurring invoices (monthly bookkeeping) | Must | MVP |
| FR-908 | Invoice PDF generation (React-PDF) | Must | MVP |
| FR-909 | Invoice email via Resend | Must | MVP |
| FR-910 | Invoice status: Draft → Sent → Viewed → Paid / Overdue / Disputed | Must | MVP |
| FR-911 | Stripe payment: credit card + ACH | Must | MVP |
| FR-912 | Automated collection emails: 15d, 30d, 45d | Must | MVP |
| FR-913 | Aging report: 0-30, 31-60, 61-90, 90+ days | Must | MVP |
| FR-914 | Late fee configuration | Should | MVP |
| FR-915 | Expense tracking with receipt attachment | Must | MVP |
| FR-916 | Utilization analytics: per-CPA and team-wide | Must | MVP |

### FR-1000: Analytics & Dashboard

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-1001 | Firm dashboard: revenue YTD, MoM growth, active clients, utilization, outstanding invoices | Must | MVP |
| FR-1002 | AI Insights section (upsell, churn risk, deadline alerts) | Must | MVP |
| FR-1003 | Revenue Trend chart (line + area, 12 months) | Must | MVP |
| FR-1004 | Revenue by Service chart (donut, drill-down) | Must | MVP |
| FR-1005 | Team Utilization chart (bar, color-coded) | Must | MVP |
| FR-1006 | Filing Status chart (donut, real-time) | Must | MVP |
| FR-1007 | Client Profitability scatter (quadrant analysis) | Must | MVP |
| FR-1008 | Cash Flow Forecast (area, 30/60/90-day) | Must | MVP |
| FR-1009 | Per-client analytics: fees, profitability, engagement, risk, churn prediction | Must | MVP |
| FR-1010 | Cohort analysis (industry, revenue, service, location, tenure) | Should | MVP |
| FR-1011 | Team analytics: per-CPA utilization, workload trend, hiring forecast | Must | MVP |
| FR-1012 | Firm P&L report | Must | MVP |
| FR-1013 | Cash flow report with AR aging | Must | MVP |
| FR-1014 | Custom report builder (drag-and-drop) | Should | MVP |
| FR-1015 | Report scheduling (weekly/monthly email) | Should | MVP |
| FR-1016 | Export: PDF, CSV, Excel | Must | MVP |
| FR-1017 | Nightly AI insights pipeline (Temporal cron, 2 AM) | Must | MVP |
| FR-1018 | Accept/snooze/dismiss actions on insights | Must | MVP |

### FR-1100: Integrations (MVP — Priority 1)

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-1101 | QuickBooks Online: OAuth2, initial historical sync (3 years) | Must | MVP |
| FR-1102 | QB: ongoing sync every 4 hours via Temporal cron | Must | MVP |
| FR-1103 | QB: bi-directional invoice sync | Must | MVP |
| FR-1104 | QB: duplicate detection on transactions | Must | MVP |
| FR-1105 | Google Drive: OAuth2, document backup to folder structure | Must | MVP |
| FR-1106 | Stripe: credit card + ACH payments, webhooks | Must | MVP |
| FR-1107 | Stripe: refund processing, idempotency keys | Must | MVP |
| FR-1108 | Integration health dashboard (last sync, status, error count) | Must | MVP |
| FR-1109 | OAuth2 encrypted token storage with auto-refresh | Must | MVP |
| FR-1110 | Webhook ingestion with signature verification | Must | MVP |
| FR-1111 | Retry logic: exponential backoff, max 3 attempts, then DLQ | Must | MVP |

### FR-1200: Notifications

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-1201 | In-app notifications with unread count (WebSocket push) | Must | MVP |
| FR-1202 | Email notifications via Resend | Must | MVP |
| FR-1203 | Notification preferences per user | Must | MVP |
| FR-1204 | Multi-channel delivery (in-app + email + push) | Must | MVP |

### FR-1300: Onboarding & Migration

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-1301 | 7-step onboarding wizard | Must | MVP |
| FR-1302 | CSV/Excel import with column mapping wizard | Must | MVP |
| FR-1303 | QB historical import (full data pull) | Must | MVP |
| FR-1304 | Document bulk upload (ZIP or Drive folder) | Must | MVP |
| FR-1305 | Import undo within 24 hours | Must | MVP |
| FR-1306 | Import templates (downloadable Excel) | Must | MVP |

### FR-1400: Demo Mode

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-1401 | 3 seeded demo firms (solo, small, medium) | Must | MVP |
| FR-1402 | 30-minute session with auto-reset | Must | MVP |
| FR-1403 | Guided tour with conversion CTAs | Must | MVP |
| FR-1404 | No-signup access (usable without account creation) | Must | MVP |
| FR-1405 | Safeguards: no real payments, no external webhooks | Must | MVP |

---

## 2. Non-Functional Requirements Catalog

| ID | Requirement | Target | Phase |
|---|---|---|---|
| NFR-001 | Lighthouse Performance score | ≥ 90 | MVP |
| NFR-002 | Lighthouse Accessibility score | ≥ 90 | MVP |
| NFR-003 | First Contentful Paint | < 1.5s | MVP |
| NFR-004 | Time to Interactive | < 3s | MVP |
| NFR-005 | Initial JS bundle size | < 200KB | MVP |
| NFR-006 | API p95 response time | < 200ms | MVP |
| NFR-007 | Concurrent user support | 2,000 | MVP |
| NFR-008 | Concurrent WebSocket connections | 2,000 | MVP |
| NFR-009 | Tenant support | 200 firms | MVP |
| NFR-010 | Unit test coverage | ≥ 75% | MVP |
| NFR-011 | Integration test coverage | ≥ 20% | MVP |
| NFR-012 | E2E test coverage (critical flows) | ≥ 5% | MVP |
| NFR-013 | AI document categorization accuracy | ≥ 90% | MVP |
| NFR-014 | Uptime SLA | 99.9% | MVP |
| NFR-015 | Data encryption at rest | AES-256 | MVP |
| NFR-016 | Data encryption in transit | TLS 1.3 | MVP |
| NFR-017 | Tier 1 field encryption | AES-256-GCM per-tenant keys | MVP |
| NFR-018 | Password hashing | Argon2id | MVP |
| NFR-019 | JWT signing | RS256 | MVP |
| NFR-020 | OWASP ZAP scan | Zero high/critical findings | MVP |
| NFR-021 | Penetration test | Completed before launch | MVP |
| NFR-022 | Backup frequency | Daily with point-in-time recovery | MVP |
| NFR-023 | Recovery Time Objective (RTO) | < 4 hours | MVP |
| NFR-024 | Recovery Point Objective (RPO) | < 1 hour | MVP |
| NFR-025 | WCAG 2.1 AA compliance | All interactive elements | MVP |

---

## 3. Out-of-Scope for MVP (Phase 2 & 3)

### Phase 2 Features (Post-MVP)

| ID | Feature | MASTER_SPEC Reference |
|---|---|---|
| OOS-201 | Plaid bank transaction sync | Pillar 6: Plaid (Priority 2) |
| OOS-202 | DocuSign e-signature integration | Pillar 6: DocuSign (Priority 2) |
| OOS-203 | Email integration (Gmail/Outlook sync) | Pillar 6: Email Integration (Phase 2) |
| OOS-204 | Calendar integration (Google/Outlook) | Pillar 6: Calendar Integration (Phase 2) |
| OOS-205 | Tax software export (TurboTax/UltraFM) | Pillar 6: Tax Software Export (Phase 2) |
| OOS-206 | Competitor export import (Karbon, Canopy, TaxDome) | Migration Path 4 (Phase 2) |
| OOS-207 | Tax planning tips (personalized by AI) | Client Portal Smart Features |
| OOS-208 | Estimated tax liability (updated monthly) | Client Portal Smart Features |
| OOS-209 | FAQ knowledge base | Client Portal |
| OOS-210 | SOC 2 Type II certification | Security: Month 9-12 |

### Phase 3 Features (Post-Phase 2)

| ID | Feature | MASTER_SPEC Reference |
|---|---|---|
| OOS-301 | Payroll integration (ADP/Gusto) | Pillar 6: Payroll (Phase 3) |
| OOS-302 | Mobile camera PWA receipt capture | Client Portal |
| OOS-303 | Custom email templates (white-label) | White-Label Capability |

---

## 4. MVP Scope Baseline

### Included in MVP (Weeks 1-16)

- **6 Feature Pillars**: Client Management, Tax Workflow, Analytics, Document AI, Practice Management, Integrations Hub
- **3 Priority 1 Integrations**: QuickBooks Online, Google Drive, Stripe
- **6 Processing Pipelines**: Document Ingestion, Time→Invoice→Payment, Compliance Deadlines, Nightly AI Insights, Bank Sync (framework only), Integration Sync
- **Full Security Stack**: RLS, encryption, RBAC, audit trail, MFA
- **Demo Mode**: 3 firms, 30-min sessions, guided tour
- **Onboarding**: Wizard + CSV/QB/bulk import
- **Testing**: Unit 75%, Integration 20%, E2E 5%, Security, Load, AI benchmarks

### Total Functional Requirements: 139
### Total Non-Functional Requirements: 25
### Total Out-of-Scope Items: 13
