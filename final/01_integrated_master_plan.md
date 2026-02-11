# Integrated Master Plan

> Source of Truth: MASTER_SPEC.md
> This document merges all workstream artifacts into a single execution reference.

---

## 1. Blueprint Artifact Index

### /program/ — Program Management

| # | File | Description |
|---|---|---|
| 01 | `program/01_wbs.md` | Work Breakdown Structure — all tasks across 16 weeks |
| 02 | `program/02_dependencies.md` | Dependency graph — inter-task and cross-workstream dependencies |
| 03 | `program/03_critical_path.md` | Critical path — longest dependency chain, float analysis |
| 04 | `program/04_raci.md` | RACI matrix — responsibility assignments per work item |
| 05 | `program/05_milestones_acceptance.md` | Milestone definitions and acceptance criteria |
| 06 | `program/06_no_drift_guardrail.md` | Requirement traceability, drift detection, change control |

### /product/ — Product Definition

| # | File | Description |
|---|---|---|
| 01 | `product/01_prd_scope_lock.md` | PRD with functional/non-functional requirements, scope lock |
| 02 | `product/02_user_stories_gherkin.md` | User stories with Gherkin acceptance scenarios |
| 03 | `product/03_acceptance_criteria.md` | Acceptance criteria by feature pillar |
| 04 | `product/04_mvp_change_control.md` | MVP scope baseline, change request protocol |

### /frontend/ — Frontend Architecture

| # | File | Description |
|---|---|---|
| 01 | `frontend/01_architecture.md` | Next.js App Router architecture, component boundaries, performance |
| 02 | `frontend/02_routes_layouts.md` | Route map, layout hierarchy, navigation, responsive breakpoints |
| 03 | `frontend/03_design_system.md` | Design tokens, component library, animations, accessibility |
| 04 | `frontend/04_state_data_contracts.md` | TanStack Query keys, Zustand stores, Zod schemas, WebSocket events |

### /backend/ — Backend Architecture

| # | File | Description |
|---|---|---|
| 01 | `backend/01_service_architecture.md` | Axum structure, middleware chain, request lifecycle, observability |
| 02 | `backend/02_api_implementation_matrix.md` | ~120 endpoints with auth, roles, idempotency, FR traceability |

### /data/ — Data Layer

| # | File | Description |
|---|---|---|
| 01 | `data/01_schema_migration_plan.md` | 15 migrations, core table schemas, RLS matrix, encryption, materialized views, DR |

### /workflow/ — Temporal Workflows

| # | File | Description |
|---|---|---|
| 01 | `workflow/01_temporal_topology.md` | 6 workflow definitions, retry policies, DLQ, versioning, monitoring |

### /integrations/ — External Integrations

| # | File | Description |
|---|---|---|
| 01 | `integrations/01_integration_contracts.md` | QB, Google Drive, Stripe contracts, OAuth flows, webhook handling, health dashboard |

### /security/ — Security & Compliance

| # | File | Description |
|---|---|---|
| 01 | `security/01_threat_model_controls.md` | STRIDE threat model, auth controls, RBAC, encryption, compliance mapping, IR plan |

### /qa/ — Quality Assurance

| # | File | Description |
|---|---|---|
| 01 | `qa/01_test_strategy.md` | Test pyramid, unit/integration/E2E specs, security/load/AI testing, release gates |

### /devops/ — DevOps & Infrastructure

| # | File | Description |
|---|---|---|
| 01 | `devops/01_environments_cicd.md` | Environments, Docker Compose, CI/CD pipelines, AWS infra, monitoring, runbooks |

### /demo_gtm/ — Demo & Go-to-Market

| # | File | Description |
|---|---|---|
| 01 | `demo_gtm/01_demo_architecture.md` | Demo mode architecture, landing page, pricing, beta program |

### /docs/ — Documentation & DX

| # | File | Description |
|---|---|---|
| 01 | `docs/01_developer_handbook.md` | Setup guide, conventions, API docs, admin ops, support playbooks, onboarding |

---

## 2. 16-Week Execution Timeline

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Core infrastructure, auth, multi-tenancy, basic CRUD

| Week | Deliverables |
|---|---|
| 1 | Project scaffolding, Docker Compose, DB migrations 001-003, JWT auth, RLS setup |
| 2 | User registration/login, MFA, session management, RBAC middleware |
| 3 | Client CRUD, contact management, search (Typesense), basic dashboard shell |
| 4 | Document upload (tus), S3 storage, AI categorization pipeline (Temporal WF-1) |

**Milestone M1 (Week 4)**: Auth + Client + Document upload working end-to-end

### Phase 2: Core Features (Weeks 5-8)

**Goal**: Workflow engine, time/billing, client portal, messaging

| Week | Deliverables |
|---|---|
| 5 | Workflow engine (Temporal WF-2), template system, step advancement |
| 6 | Time tracking (timer + manual), timesheet view, rate management |
| 7 | Invoice generation (Temporal WF-4), PDF rendering, Stripe payment integration |
| 8 | Client portal (all routes), secure messaging (WebSocket), notification system |

**Milestone M2 (Week 8)**: Full CPA workflow from client intake to invoice payment

### Phase 3: Intelligence & Integrations (Weeks 9-12)

**Goal**: Dashboard analytics, AI insights, integrations, compliance calendar

| Week | Deliverables |
|---|---|
| 9 | Dashboard: 6 ECharts visualizations, metric cards, real-time updates |
| 10 | AI nightly insights (Temporal WF-5), team utilization, report builder |
| 11 | QuickBooks integration (Temporal WF-6), Google Drive sync, Stripe billing |
| 12 | Compliance calendar (Temporal WF-3), deadline reminders, risk scoring |

**Milestone M3 (Week 12)**: Analytics, integrations, and compliance fully operational

### Phase 4: Polish & Launch (Weeks 13-16)

**Goal**: Demo mode, onboarding, performance, security hardening, beta

| Week | Deliverables |
|---|---|
| 13 | Demo mode (3 firms), guided tour, landing page, pricing page |
| 14 | 7-step onboarding wizard, CSV import, QB import, bulk document upload |
| 15 | Performance optimization, security hardening, penetration test, load testing |
| 16 | Beta launch (10-20 firms), monitoring, bug fixes, documentation finalization |

**Milestone M4 (Week 16)**: Production-ready, beta users onboarded

---

## 3. Decision Log

| # | Decision | Rationale | Date | Reversible |
|---|---|---|---|---|
| D-001 | Rust/Axum for backend | Performance, memory safety, compile-time SQL verification | Spec | No |
| D-002 | PostgreSQL RLS for multi-tenancy | Row-level isolation without application-level filtering | Spec | No |
| D-003 | Temporal for workflows | Durable execution, built-in retry/DLQ, versioning | Spec | No |
| D-004 | Claude API for document AI | Best-in-class vision + text extraction | Spec | Yes (swap model) |
| D-005 | Typesense for search | Typo-tolerant, instant, simpler than Elasticsearch | Spec | Yes |
| D-006 | tus protocol for uploads | Resumable, chunk-based, handles large files | Spec | No |
| D-007 | AES-256-GCM per-tenant keys | IRS Pub 4557 compliance, tenant isolation | Spec | No |
| D-008 | JWT RS256 (not HS256) | Asymmetric signing, public key verification | Spec | No |
| D-009 | Argon2id (not bcrypt) | Memory-hard, GPU-resistant, OWASP recommended | Spec | No |
| D-010 | shadcn/ui (not MUI/Ant) | Tailwind-native, copy-paste ownership, no vendor lock | Spec | Yes |
| D-011 | ECharts (not Recharts/D3) | Rich chart types, animation support, Apache license | Spec | Yes |
| D-012 | Resend for email | Developer-friendly, good deliverability, simple API | Spec | Yes |
| D-013 | fred crate for Redis | Async, cluster-aware, maintained | Spec | Yes |
| D-014 | SQLx (not Diesel/SeaORM) | Compile-time verification, raw SQL control | Spec | No |

---

## 4. Risk Register

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-001 | Claude API latency spikes | Medium | Medium | Timeout + retry + rule-based fallback |
| R-002 | QB API rate limits during initial sync | High | Low | Batch requests, exponential backoff |
| R-003 | RLS misconfiguration leaks data | Low | Critical | Automated RLS tests every PR, fail-safe default |
| R-004 | Temporal cluster instability | Low | High | Health monitoring, auto-restart, DLQ for recovery |
| R-005 | Stripe webhook delivery failure | Medium | Medium | Idempotent processing, manual reconciliation |
| R-006 | Large file upload failures | Medium | Low | tus resumable protocol handles this |
| R-007 | Beta firm data migration issues | Medium | Medium | Dry-run imports, undo capability, manual review |
| R-008 | Performance degradation at scale | Low | High | Load testing at each milestone, auto-scaling |
| R-009 | Key rotation causes downtime | Low | High | Blue-green key rotation, overlap period |
| R-010 | Scope creep from beta feedback | High | Medium | Change control protocol, scope swap rules |

---

## 5. Weekly Cadence

### Monday
- Review previous week's velocity
- Update WBS task statuses
- Identify blockers

### Wednesday
- Mid-week sync: progress check against critical path
- Security/compliance checkpoint

### Friday
- Demo of completed work
- Update milestone progress
- Plan next week's priorities
- Run no-drift guardrail check

### Per-Milestone (Every 4 Weeks)
- Full release gate verification (qa/01_test_strategy.md §8)
- Security gate verification (security/01_threat_model_controls.md §8)
- Stakeholder review
- Decision log update
- Risk register review

---

## 6. Build Readiness Checklist

### Pre-Build (Before Week 1)

- [ ] MASTER_SPEC.md reviewed and locked
- [ ] All blueprint artifacts generated and reviewed
- [ ] Development environment setup documented
- [ ] Docker Compose verified locally
- [ ] CI/CD pipeline skeleton deployed
- [ ] AWS infrastructure provisioned (Terraform)
- [ ] KMS keys created (dev, staging, prod)
- [ ] JWT key pairs generated
- [ ] GitHub repository created with branch protection
- [ ] Monitoring stack deployed (Prometheus, Grafana, Sentry)

### Launch Readiness (Week 16)

- [ ] All milestone gates passed (M1-M4)
- [ ] Penetration test completed — zero critical findings
- [ ] AI benchmark — ≥ 90% document categorization accuracy
- [ ] Load test — 500 VU peak sustained, p95 < 500ms
- [ ] Soak test — 1 hour stable, no memory leaks
- [ ] DR test — backup restore verified, RTO < 4 hours
- [ ] Demo mode — all 3 firms functional, guided tour complete
- [ ] Onboarding wizard — CSV + QB import verified
- [ ] Client portal — full flow verified on desktop + mobile
- [ ] Accessibility audit — WCAG 2.1 AA compliance
- [ ] Documentation complete (API docs, admin ops, support playbooks)
- [ ] Beta firms onboarded (10-20 firms)
- [ ] Monitoring alerts configured and tested
- [ ] Runbooks documented and reviewed
- [ ] Incident response plan tested
- [ ] Compliance checklist verified (IRS 4557, FTC Safeguards, SOC 2 readiness)
- [ ] Decision log finalized
- [ ] Risk register reviewed and mitigations confirmed
