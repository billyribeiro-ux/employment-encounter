# RACI Matrix

> Source of Truth: MASTER_SPEC.md
> R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## Roles / Agents

| ID | Role / Agent | Description |
|---|---|---|
| PO | Program Orchestrator | Overall delivery, cross-workstream coordination |
| PRD | Product Requirements Agent | Scope lock, requirements, acceptance criteria |
| FE | Frontend System Agent | Next.js, React, UI/UX, client-side logic |
| BE | Backend Platform Agent | Rust/Axum, APIs, business logic, middleware |
| DA | Data Architecture Agent | PostgreSQL, schema, RLS, migrations, performance |
| WF | Workflow Orchestration Agent | Temporal workflows, pipelines, scheduling |
| INT | Integrations Agent | Third-party APIs, OAuth, webhooks, sync |
| SEC | Security/Compliance Agent | Threat model, controls, audit, compliance |
| QA | QA/Reliability Agent | Testing, load, security scans, release gates |
| DOP | DevOps/Platform Ops Agent | CI/CD, infra, monitoring, environments |
| DMO | Demo + GTM Agent | Demo mode, landing page, beta program |
| DOC | Documentation/DX Agent | Eng handbook, API docs, support playbooks |

---

## WBS-1: Foundation & Infrastructure (Weeks 1-3)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| GitHub repo + branch protection | A | | | | | | | | | R | | |
| Monorepo structure | A | | C | C | | | | | | R | | |
| Docker Compose (all services) | A | | I | C | C | C | | | | R | | |
| PostgreSQL 16 + extensions | I | | | C | R | | | | | A | | |
| Core schema (tenants, users, roles) | I | C | | C | R | | | C | | | | |
| RLS policies | I | | | C | R | | | A | | | | |
| Audit log partitioning | I | | | C | R | | | C | | | | |
| Axum scaffold + middleware | I | | | R | | | | C | | A | | |
| SQLx integration | I | | | R | A | | | | | | | |
| Auth module (Argon2, JWT RS256) | I | | | R | | | | A | | | | |
| Tenant resolution middleware | I | | | R | C | | | A | | | | |
| RBAC middleware | I | C | | R | | | | A | | | | |
| Rate limiting (Redis) | I | | | R | | | | C | | | | |
| Error taxonomy | A | | C | R | | | | | C | | | |
| Redis integration | I | | | R | | | | | | C | | |
| Structured logging (tracing+Sentry) | I | | | R | | | | | | A | | |
| Next.js 15 scaffold | I | | R | | | | | | | A | | |
| Tailwind + shadcn + design tokens | I | C | R | | | | | | | | | |
| TanStack Query + Zustand setup | I | | R | | | | | | | | | |
| Auth flow UI | I | | R | C | | | | C | | | | |
| Layout shell + nav | I | C | R | | | | | | | | | |
| Framer Motion setup | I | | R | | | | | | | | | |
| MSW mock server | I | | R | | | | | | C | | | |
| CI pipeline | A | | C | C | C | | | C | C | R | | |
| CD pipeline | A | | I | I | | | | | C | R | | |

---

## WBS-2: Client Management (Weeks 4-6)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| clients table + schema | I | C | | C | R | | | C | | | | |
| Client CRUD API | I | C | | R | C | | | C | | | | |
| Client search (Typesense) | I | | C | R | | | | | | | | |
| Field-level encryption (KMS) | I | | | R | C | | | A | | | | |
| Client workspace UI | I | A | R | C | | | | | | | | |
| Client contacts UI/API | I | C | R | R | C | | | | | | | |
| Financial overview | I | C | R | R | C | | | | | | | |
| Activity feed / timeline | I | C | R | R | C | | | | | | | |
| Client portal auth | I | | C | R | | | | A | | | | |
| Client portal dashboard | I | A | R | C | | | | | | | | |
| Document upload portal | I | C | R | C | | | | | | | | |
| Invoice & payment history | I | C | R | C | | | | | | | | |
| Tax filing status tracker | I | C | R | C | | | | | | | | |
| Tax questionnaire | I | A | R | R | C | | | | | | | |
| PWA shell | I | | R | | | | | | | | | |
| Secure messaging (backend) | I | C | | R | C | | | C | | | | |
| Secure messaging (frontend) | I | C | R | C | | | | | | | | |
| WebSocket messaging | I | | C | R | | | | | | | | |
| Canned response templates | I | C | R | R | C | | | | | | | |

---

## WBS-3: Document Management & AI (Weeks 4-6)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| documents table | I | C | | C | R | | | C | | | | |
| S3 storage setup | I | | | C | | | | A | | R | | |
| tus server endpoint | I | | | R | | | | | | | | |
| tus-js-client frontend | I | | R | C | | | | | | | | |
| File validation (ClamAV) | I | | | R | | | | A | | C | | |
| Encryption at rest (KMS) | I | | | R | | | | A | | | | |
| Temporal doc ingestion workflow | I | | | C | | R | | | | | | |
| Claude Vision integration | I | | | R | | C | | | | | | |
| Confidence scoring | I | A | | R | | | | | C | | | |
| Data extraction | I | C | | R | | | | | | | | |
| CPA override + feedback | I | C | R | R | C | | | | | | | |
| Typesense indexing | I | | | R | | | | | | | | |
| Google Drive backup sync | I | | | C | | | R | | | | | |
| Upload UI (drag-drop, batch) | I | C | R | | | | | | | | | |
| Document list + preview | I | C | R | C | | | | | | | | |
| Batch operations UI | I | C | R | C | | | | | | | | |
| Semantic search UI | I | | R | C | | | | | | | | |

---

## WBS-4: Workflow & Task Management (Weeks 7-9)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Workflow tables | I | C | | C | R | C | | | | | | |
| Temporal tax season workflows | I | A | | C | | R | | | | | | |
| Step transitions + branching | I | C | | C | | R | | | | | | |
| Triggers + approvals | I | A | | C | | R | | | | | | |
| Workflow API | I | C | | R | | C | | | | | | |
| Workflow builder UI | I | A | R | C | | C | | | | | | |
| Workflow tracker + dashboard | I | C | R | C | | | | | | | | |
| Tasks table + API | I | C | | R | C | | | | | | | |
| Kanban board UI | I | C | R | | | | | | | | | |
| List + calendar views | I | C | R | | | | | | | | | |
| Recurring tasks | I | C | | R | C | C | | | | | | |
| Compliance deadlines table | I | C | | C | R | | | | | | | |
| Auto-generate calendar | I | A | | R | C | C | | | | | | |
| Temporal reminder workflows | I | | | C | | R | | | | | | |
| Escalation logic | I | A | | R | | C | | C | | | | |
| Compliance calendar UI | I | C | R | C | | | | | | | | |
| Compliance report generation | I | A | R | R | C | | | C | | | | |

---

## WBS-5: Time Tracking & Invoicing (Weeks 7-9)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| time_entries table + API | I | C | | R | R | | | | | | | |
| Timer UI (start/stop/pause) | I | C | R | C | | | | | | | | |
| Timesheet view | I | C | R | C | | | | | | | | |
| Utilization metrics (Redis+MV) | I | | | R | R | | | | | | | |
| Invoice tables + generation | I | C | | R | R | | | | | | | |
| Auto-generate rules | I | A | | R | | C | | | | | | |
| Recurring invoices | I | C | | R | C | C | | | | | | |
| Invoice PDF (React-PDF) | I | | R | | | | | | | | | |
| Invoice email (Resend) | I | | | R | | | | | | | | |
| Stripe integration | I | | | R | | | C | C | | | | |
| Stripe webhook handler | I | | | R | | | C | C | | | | |
| Invoice status lifecycle | I | C | R | R | C | | | | | | | |
| Automated collection emails | I | C | | R | | C | | | | | | |
| Aging report UI | I | C | R | C | | | | | | | | |
| Expense tracking | I | C | R | R | R | | | | | | | |

---

## WBS-6: Analytics & Dashboard (Weeks 10-12)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Materialized views | I | | | C | R | | | | | | | |
| pg_cron refresh | I | | | | R | | | | | C | | |
| Redis caching layer | I | | | R | C | | | | | | | |
| Dashboard API | I | C | | R | C | | | | | | | |
| Key metrics cards UI | I | A | R | C | | | | | | | | |
| AI Insights section | I | A | R | C | | C | | | | | | |
| ECharts — all 6 charts | I | C | R | | | | | | | | | |
| Client analytics page | I | C | R | R | C | | | | | | | |
| Cohort analysis | I | C | R | R | C | | | | | | | |
| Team analytics | I | C | R | R | C | | | | | | | |
| Firm P&L report | I | C | R | R | C | | | | | | | |
| Cash flow report | I | C | R | R | C | | | | | | | |
| Custom report builder | I | C | R | R | C | | | | | | | |
| Report scheduling + export | I | C | R | R | | | | | | | | |
| Nightly AI insights (Temporal) | I | | | R | C | R | | | | | | |
| Claude recommendations | I | | | R | | C | | | | | | |
| Daily digest email | I | C | | R | | C | | | | | | |

---

## WBS-7: Integrations (Weeks 10-12)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| integration_connections table | I | | | C | R | | C | C | | | | |
| OAuth2 framework | I | | | C | | | R | A | | | | |
| Encrypted token storage | I | | | C | | | R | A | | | | |
| Token refresh logic | I | | | | | | R | C | | | | |
| Webhook ingestion framework | I | | | R | | | R | A | | | | |
| Integration health dashboard | I | C | R | C | | | R | | | | | |
| QB OAuth + historical sync | I | C | C | C | | C | R | | | | | |
| QB ongoing sync (Temporal) | I | | | C | | C | R | | | | | |
| QB bi-directional invoices | I | C | | C | | | R | | | | | |
| Google Drive sync | I | | | C | | | R | | | | | |
| Stripe Connect | I | | | C | | | R | C | | | | |

---

## WBS-8 through WBS-13 (Weeks 10-17)

| Work Item | PO | PRD | FE | BE | DA | WF | INT | SEC | QA | DOP | DMO | DOC |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Notification system | I | C | R | R | R | | | | | | | |
| WebSocket + SSE real-time | I | | C | R | | | | | | | | |
| Onboarding wizard | I | A | R | R | | | C | | | | | |
| CSV/QB/bulk import | I | C | R | R | C | C | C | | | | | |
| MFA enforcement | I | | | R | | | | A | | | | |
| Password policy | I | | | R | | | | A | | | | |
| Session management | I | | | R | | | | A | | | | |
| CORS + request signing | I | | | R | | | | A | | | | |
| Audit trail verification | I | | | C | C | | | R | A | | | |
| Data retention policies | I | | | C | R | | | A | | | | |
| Tenant offboarding flow | I | C | | R | R | C | | A | | | | |
| GDPR flows | I | C | | R | R | | | A | | | | |
| IRS/FTC control mapping | I | | | | | | | R | C | | | A |
| Demo tenant + seed data | I | C | C | C | C | | | | | | R | |
| Demo session logic | I | | C | R | | | | | | | A | |
| Guided tour + CTAs | I | A | R | | | | | | | | R | |
| Demo safeguards | I | | | R | | | | C | | | A | |
| Unit tests (75%) | I | | C | C | | | | | R | | | |
| Integration tests (20%) | I | | | C | C | | | | R | | | |
| E2E tests (Playwright) | I | | C | | | | | | R | | | |
| Security tests (OWASP ZAP) | I | | | | | | | C | R | | | |
| Load tests | I | | | C | C | | | | R | A | | |
| AI accuracy benchmarks | I | | | C | | | | | R | | | |
| Performance optimization | I | | R | R | R | | | | A | | | |
| Pen test (external) | A | | | | | | | R | C | | | |
| Production provisioning | A | | | | | | | C | | R | | |
| Monitoring + alerting | I | | | C | | | | | | R | | |
| Runbooks | I | | | C | C | C | | C | | R | | A |
| Landing + pricing page | I | A | R | | | | | | | | R | |
| Beta program launch | A | C | I | I | | | | | | I | R | |
| Production deploy | A | | I | I | | | | C | C | R | | |
