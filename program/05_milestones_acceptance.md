# Milestone Acceptance Criteria by Week Block

> Source of Truth: MASTER_SPEC.md

---

## Weeks 1-3: Foundation & Infrastructure

### Milestone M1: "Platform Skeleton Operational"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M1.1 | GitHub repo with branch protection, conventional commits enforced | PR to main requires review |
| M1.2 | Docker Compose starts all services: Postgres 16, Redis 7, Temporal, Typesense | `docker compose up` succeeds, all health checks pass |
| M1.3 | Core schema deployed: tenants, users, roles, permissions tables with RLS | `SELECT * FROM tenants` returns zero rows when no tenant context set |
| M1.4 | Audit log table partitioned by month | `\d+ audit_logs` shows partitioning |
| M1.5 | Axum server starts, responds to health check at `/api/v1/health` | HTTP 200 with `{"status":"ok"}` |
| M1.6 | SQLx compile-time query verification passes | `cargo sqlx prepare --check` succeeds |
| M1.7 | Auth endpoints functional: register, login, refresh, logout | Integration test: register → login → get JWT → refresh → logout |
| M1.8 | JWT RS256 tokens with 15min access / 7d refresh | Decode token, verify claims and expiry |
| M1.9 | Tenant middleware sets `app.current_tenant` from JWT | Query with tenant context returns tenant data only |
| M1.10 | RBAC middleware enforces role checks | Staff cannot access admin endpoints (403) |
| M1.11 | Rate limiting functional per tenant tier | Exceed 100 req/min on Solo tier → 429 response |
| M1.12 | Redis connected: sessions, cache, pub/sub operational | `redis-cli ping` returns PONG; session store/retrieve works |
| M1.13 | Structured logging outputs JSON to stdout | `tracing` spans visible in log output |
| M1.14 | Next.js 15 app starts with App Router | `npm run dev` serves pages |
| M1.15 | Tailwind v4 + shadcn/ui components render | Button, Input, Dialog components render correctly |
| M1.16 | Design system tokens defined (colors, spacing, typography) | Tailwind config has custom theme tokens |
| M1.17 | TanStack Query provider + Zustand store initialized | Query devtools visible, store state inspectable |
| M1.18 | Auth UI flow: login, register, password reset pages | Navigate through all auth pages |
| M1.19 | Layout shell: sidebar nav, header, notification bell placeholder | Layout renders on all authenticated pages |
| M1.20 | CI pipeline runs on PR: cargo check/clippy/test + frontend typecheck/lint/test | PR triggers all checks, green status |
| M1.21 | CD pipeline deploys to staging on merge to main | Merge to main → staging URL accessible |

### Exit Gate
- All M1 criteria pass
- Zero critical/high security findings
- RLS fail-safe verified (no tenant context = zero rows)

---

## Weeks 4-6: Client Management & Document AI

### Milestone M2: "Core Data Flows Working"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M2.1 | Client CRUD: create, read, update, delete via API | Integration tests for all CRUD operations |
| M2.2 | Client search via Typesense returns results < 50ms | Search "John" returns matching clients |
| M2.3 | Field-level encryption: SSN/EIN encrypted at rest, masked in UI (last 4) | DB column is ciphertext; UI shows ***-**-1234 |
| M2.4 | Client workspace renders: profile, contacts, financial overview, activity feed | Navigate to client detail page, all sections load |
| M2.5 | Client portal: separate auth, dashboard with tax status + deadlines | Client logs in, sees own data only |
| M2.6 | Document upload via tus: resumable, handles interruption | Kill connection at 50%, resume completes |
| M2.7 | File validation: rejects > 50MB, unsupported types | Upload 60MB file → error; upload .exe → error |
| M2.8 | AI categorization: Claude Vision categorizes W-2, 1099, receipt | Upload sample W-2 → categorized as "W-2 Form" with >90% confidence |
| M2.9 | Confidence scoring: >95% auto-accept, 75-95% flagged, <75% manual | Upload ambiguous doc → status "needs_review" |
| M2.10 | Document search via Typesense: full-text, filtered by category/client | Search "W-2 2025" returns matching documents |
| M2.11 | Document preview renders PDF in browser (React-PDF) | Click document → preview modal shows PDF |
| M2.12 | Secure messaging: send/receive threaded messages per client | CPA sends message → client sees in portal |
| M2.13 | WebSocket: real-time message delivery without page refresh | Message appears instantly on recipient's screen |
| M2.14 | Read receipts with timestamps | Sender sees "Read at 2:30 PM" |
| M2.15 | Google Drive backup: uploaded docs sync to Drive folder structure | Upload doc → appears in Drive under Firm/Client/Year/Category |
| M2.16 | Audit trail: all document actions logged (upload, view, categorize) | Query audit_logs for document events |

### Exit Gate
- All M2 criteria pass
- Multi-tenancy isolation verified: Tenant A cannot see Tenant B data
- AI categorization accuracy > 85% on test dataset (50 sample docs)

---

## Weeks 7-9: Workflows, Tasks & Billing

### Milestone M3: "Business Operations Functional"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M3.1 | Tax season workflow: 7-step pipeline executes end-to-end | Create workflow for client → advance through all steps |
| M3.2 | Workflow builder: create custom workflow with drag-and-drop | Build 3-step workflow, save, instantiate |
| M3.3 | Conditional branching: "if partner rejects, return to CPA" | Partner clicks reject → workflow returns to Step 3 |
| M3.4 | Automatic triggers: "all docs uploaded → advance to Step 2" | Upload final required doc → step auto-advances |
| M3.5 | Task management: CRUD tasks with Kanban, list, calendar views | Create task, drag across Kanban columns |
| M3.6 | Recurring tasks: "Monthly bookkeeping review" auto-creates | Task auto-created on 1st of month |
| M3.7 | Compliance calendar: auto-generated per client filing type | Add 1040 client → Apr 15, Oct 15 deadlines appear |
| M3.8 | Deadline reminders: Temporal fires at 30d, 14d, 7d, 1d intervals | Fast-forward time → notifications sent at each interval |
| M3.9 | Missed deadline escalation: auto-escalate to partner + audit log | Deadline passes → partner notified, audit entry created |
| M3.10 | Time entry: log hours with client, rate, description | Log 2.5 hours → entry saved, utilization updated |
| M3.11 | Timer: start/stop/pause with auto-log on stop | Start timer, work, stop → time entry created |
| M3.12 | Invoice generation: hourly, flat fee, hybrid modes | Generate invoice from 10 hours × $150 = $1,500 |
| M3.13 | Auto-generate invoice at $2,500 threshold | Log entries totaling $2,500 → draft invoice created |
| M3.14 | Invoice PDF renders correctly (React-PDF) | Download invoice PDF, verify layout and amounts |
| M3.15 | Stripe payment: client pays invoice via credit card/ACH | Client clicks pay → Stripe checkout → invoice marked Paid |
| M3.16 | Stripe webhook: payment confirmation updates invoice status | Webhook fires → invoice status changes to Paid |
| M3.17 | Idempotency: duplicate webhook does not double-process | Send same webhook twice → only one payment recorded |
| M3.18 | Automated collection: reminder emails at 15d, 30d, 45d overdue | Invoice unpaid 15 days → reminder email sent |
| M3.19 | Aging report: invoices grouped by 0-30, 31-60, 61-90, 90+ days | View aging report with correct buckets |
| M3.20 | Expense tracking: log expense with receipt attachment | Create expense, attach receipt photo |

### Exit Gate
- All M3 criteria pass
- Workflow survives server restart (Temporal durability verified)
- Payment flow end-to-end in Stripe test mode
- Zero data loss on timer pause/resume

---

## Weeks 10-12: Analytics, Integrations & Real-Time

### Milestone M4: "Intelligence Layer Operational"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M4.1 | Firm dashboard: 5 key metric cards with real data | Dashboard loads with revenue, growth, clients, utilization, AR |
| M4.2 | Revenue Trend chart (ECharts): 12-month line+area, animated | Chart renders with animation, hover tooltips work |
| M4.3 | Revenue by Service donut: drill-down on click | Click "Tax Returns" → filtered client list |
| M4.4 | Team Utilization bar chart: color-coded per CPA | Green/yellow/red bars per team member |
| M4.5 | Filing Status donut: real-time updates | Mark filing complete → chart updates without refresh |
| M4.6 | Client Profitability scatter: quadrant analysis | Hover shows client name, revenue, hours |
| M4.7 | Cash Flow Forecast: 30/60/90-day projections | Area chart with projected cash in/out |
| M4.8 | Client analytics: per-client profitability, churn risk, upsell score | Navigate to client → analytics tab shows all metrics |
| M4.9 | Nightly AI insights: Temporal cron generates recommendations | Trigger manually → insights appear in dashboard |
| M4.10 | AI fallback: rule-based recommendations when Claude API fails | Mock Claude failure → rule-based insights generated |
| M4.11 | Accept/snooze/dismiss actions on insights | Click accept → insight marked actioned |
| M4.12 | QuickBooks OAuth: connect, initial sync, ongoing 4-hour sync | Connect QB → transactions appear in dashboard |
| M4.13 | QB bi-directional: invoice created in platform syncs to QB | Create invoice → verify in QB |
| M4.14 | Google Drive: documents sync to correct folder structure | Upload doc → appears in Drive |
| M4.15 | Integration health dashboard: status, last sync, error count | View integrations page with health indicators |
| M4.16 | Webhook framework: signature verification, idempotent processing | Send test webhook → verified and processed once |
| M4.17 | Notification system: in-app bell with unread count | Notification fires → bell shows count, click shows list |
| M4.18 | Email notifications via Resend | Deadline reminder → email received |
| M4.19 | WebSocket: real-time updates across dashboard | Two browser tabs → action in one reflects in other |
| M4.20 | SSE: dashboard metrics update without page refresh | Metric changes → card updates via SSE |
| M4.21 | Materialized views refresh via pg_cron | Verify MV refresh schedule in pg_cron |
| M4.22 | Redis caching: dashboard data served from cache < 50ms | API response time < 50ms for cached metrics |

### Exit Gate
- All M4 criteria pass
- QB sync handles rate limits gracefully (exponential backoff)
- Charts render on mobile viewport
- Notification delivery < 5 seconds end-to-end

---

## Weeks 13-14: Hardening, Onboarding & Demo

### Milestone M5: "Production-Ready Platform"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M5.1 | Onboarding wizard: 7 steps complete end-to-end | New tenant → complete all 7 steps → fully operational |
| M5.2 | CSV import: upload, map columns, validate, import clients | Import 50 clients from CSV → all appear correctly |
| M5.3 | QB historical import: pull 3 years of data | Connect QB → historical data appears |
| M5.4 | Document bulk upload: ZIP file processed by AI | Upload ZIP of 20 docs → all categorized |
| M5.5 | Import undo: delete all imported within 24 hours | Click undo → imported records removed |
| M5.6 | MFA enforced for Partner/Admin roles | Partner login requires TOTP code |
| M5.7 | Password policy: 12 char min, HaveIBeenPwned check | Try "password123" → rejected |
| M5.8 | Session management: per-device tracking, remote logout | Log in on 2 devices → logout one remotely |
| M5.9 | CORS: only whitelisted origins accepted | Request from unauthorized origin → blocked |
| M5.10 | Audit trail: complete for all critical actions | Query audit_logs → entries for every action type |
| M5.11 | Data retention: 7-year auto-archive configured | Verify S3 lifecycle policy for Glacier transition |
| M5.12 | Tenant offboarding: 30d grace → export → soft delete → hard delete | Simulate offboarding timeline |
| M5.13 | GDPR: data export generates complete package | Request export → JSON + documents ZIP generated |
| M5.14 | Demo mode: 3 seeded firms accessible without signup | Visit demo URL → choose firm → full platform usable |
| M5.15 | Demo 30-minute session with auto-reset | Session expires → data resets to seed state |
| M5.16 | Demo safeguards: no real payments, no external webhooks | Attempt payment in demo → sandboxed |
| M5.17 | Guided tour: highlights key features with CTAs | Tour walks through dashboard, clients, docs, workflows |
| M5.18 | White-label: custom domain, logo, colors (Scale tier) | Configure custom domain → portal renders with firm branding |

### Exit Gate
- All M5 criteria pass
- Onboarding < 4 hours for solo firm (50 clients)
- Demo conversion path measurable (analytics events)
- Zero Tier 1 data exposed in logs

---

## Weeks 15-16: Testing & Performance

### Milestone M6: "Quality Gates Passed"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M6.1 | Unit test coverage ≥ 75% (frontend + backend) | Coverage report shows ≥ 75% |
| M6.2 | Integration tests pass: multi-tenancy isolation | Tenant A query with Tenant B context → zero rows |
| M6.3 | Integration tests pass: RBAC enforcement | Staff cannot approve returns, client cannot see other clients |
| M6.4 | Integration tests pass: all 6 pipelines | Each pipeline tested end-to-end with success + failure paths |
| M6.5 | E2E tests (Playwright): all critical user flows | Login → create client → upload doc → create workflow → invoice → pay |
| M6.6 | Security: OWASP ZAP baseline scan — zero high findings | ZAP report shows no high/critical |
| M6.7 | Security: no SQL injection possible | SQLx compile-time verification + manual test |
| M6.8 | Security: no XSS in user-generated content | Input `<script>alert(1)</script>` → sanitized |
| M6.9 | Security: CSRF protection on all mutations | POST without CSRF token → rejected |
| M6.10 | Load test: 200 firms, 2000 concurrent users | k6/Artillery test passes with p95 < 500ms |
| M6.11 | Load test: 2000 WebSocket connections sustained | All connections stable for 30 minutes |
| M6.12 | AI accuracy: document categorization ≥ 90% on benchmark set | Run 100 sample docs → ≥ 90 correct |
| M6.13 | Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices) | Lighthouse audit on key pages |
| M6.14 | FCP < 1.5s, TTI < 3s | Lighthouse metrics |
| M6.15 | Initial JS bundle < 200KB | Bundle analyzer report |
| M6.16 | API p95 response time < 200ms | Load test report |
| M6.17 | All critical bugs fixed (zero P0/P1 open) | Bug tracker shows zero P0/P1 |

### Exit Gate
- All M6 criteria pass
- Release gates in CI all green
- Security team sign-off
- Performance benchmarks documented

---

## Week 17: Launch

### Milestone M7: "Live in Production"

| # | Acceptance Criterion | Verification |
|---|---|---|
| M7.1 | Penetration test completed, critical findings remediated | Pen test report + remediation evidence |
| M7.2 | Production environment provisioned and configured | All services running, health checks pass |
| M7.3 | DNS, SSL (TLS 1.3), CDN (CloudFront) configured | HTTPS works, certificate valid, CDN serving assets |
| M7.4 | Monitoring live: Prometheus metrics, Grafana dashboards | Dashboards showing real-time data |
| M7.5 | Alerting configured: PagerDuty/Slack for critical alerts | Trigger test alert → notification received |
| M7.6 | Sentry release tracking active | Errors in production → Sentry captures with release tag |
| M7.7 | Runbooks published: incident, rollback, DB migration, degraded mode | Runbooks accessible to on-call team |
| M7.8 | Staged rollout: deploy to 10% → 50% → 100% | Canary deploy succeeds at each stage |
| M7.9 | Smoke tests pass on production | Critical flows verified post-deploy |
| M7.10 | On-call rotation established | Schedule published, escalation path tested |
| M7.11 | Landing page live with pricing tiers | URL accessible, pricing displays correctly |
| M7.12 | Beta program: first 50 CPAs invited | Invitations sent, onboarding support ready |
| M7.13 | Demo accessible from landing page | "Try Demo" button → demo environment loads |
| M7.14 | Payment processing live (Stripe production mode) | Real payment succeeds |
| M7.15 | Backup/restore verified | Restore from backup → data intact |

### Exit Gate
- All M7 criteria pass
- Zero P0 bugs in first 48 hours
- First beta user successfully onboarded
- Incident response tested (tabletop exercise)
