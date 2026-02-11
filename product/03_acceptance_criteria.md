# Acceptance Criteria by Feature Pillar

> Source of Truth: MASTER_SPEC.md

---

## Pillar 1: Client Management

### AC-CM-01: Client CRUD
- Client can be created with all required fields (name, contact, business type, fiscal year, tax_id)
- Tax ID (SSN/EIN) is encrypted with AES-256-GCM using per-tenant KMS key
- Tax ID displays masked (last 4 only) for all roles except Partner/Admin who see full value
- Client can be updated; all changes logged in audit trail
- Client soft-delete preserves data; hard-delete only via tenant offboarding
- Client list supports pagination (25/50/100 per page), sorting (name, fees, risk), filtering (type, status, CPA)

### AC-CM-02: Client Search
- Typesense returns results in < 50ms
- Typo tolerance: "Jonson" matches "Johnson"
- Search by name, EIN, address
- Results scoped to current tenant only

### AC-CM-03: Client Workspace
- Master dashboard shows: profile, quick stats (fees YTD, revenue trend, last contact), filing status, open action items, activity feed, risk profile, next meeting, account balance, assigned CPA
- Financial overview: last 3 years revenue, estimated tax liability, fee breakdown, payment history, profitability vs hours, growth trend
- Activity feed: all interactions logged, color-coded by type, filterable, searchable

### AC-CM-04: Client Portal
- Client authenticates with separate JWT claims (Client role)
- Dashboard shows: tax status, documents needed, deadlines, balance
- Document upload via tus (resumable)
- Invoice & payment history with Stripe payment
- Filing status tracker (not started → submitted → completed)
- Client sees own data only (RLS enforced)
- Mobile-responsive (PWA shell)

### AC-CM-05: Secure Messaging
- Threaded conversations per client
- File attachments stored in S3
- @mentions notify team members
- Read receipts with timestamps
- Real-time delivery via WebSocket (< 2 second latency)
- Message search via Typesense
- Canned response templates (CRUD)

---

## Pillar 2: Tax Workflow Automation

### AC-WF-01: Workflow Engine
- 7-step tax season workflow template available out-of-box
- Custom workflow builder: drag-and-drop steps, assign users, set deadlines
- Conditional branching: "if rejected, return to step N"
- Automatic triggers: "when all docs uploaded, advance to next step"
- Approval gates: partner must approve before advancing
- Workflows are durable (Temporal): survive server restarts without data loss
- Workflow templates can be cloned and modified per client type

### AC-WF-02: Task Management
- CRUD tasks with: title, assignee, due date, priority (urgent/high/normal/low), status, client link
- Kanban board: drag tasks between columns (To Do, In Progress, Review, Done)
- List view: sortable by any column, filterable by assignee/priority/status
- Calendar view: tasks overlaid on compliance deadlines
- Recurring tasks: configurable frequency (daily/weekly/monthly)

### AC-WF-03: Deadline Compliance
- Auto-generate compliance calendar when client is added with filing type
- Supported types: 1040, 1120-S, 1065 with correct federal deadlines
- State-specific deadlines auto-generated based on client's state(s)
- Multi-state support
- Reminder sequence fires via Temporal: 30d, 14d, 7d, 1d, day-of
- Missed deadline: auto-escalate to partner, log in audit trail, flag in compliance report
- Extension filing updates calendar and restarts reminder sequence
- Compliance report exportable for E&O insurance documentation

---

## Pillar 3: Real-Time Business Analytics

### AC-AN-01: Firm Dashboard
- 5 key metric cards: Revenue YTD (vs last year), MoM growth %, Active clients (count + trend), Team utilization %, Outstanding invoices $
- AI Insights section: top 3 action items (upsell, churn risk, deadline)
- All metrics served from Redis cache (< 50ms response)
- Materialized views refreshed via pg_cron

### AC-AN-02: Charts (Apache ECharts)
- Revenue Trend: line + area, 12 months, 800ms animated draw, hover tooltips, click to filter by service/CPA
- Revenue by Service: donut, 600ms animated slices, click drills down to client list
- Team Utilization: bar chart per CPA, color-coded (green < 70%, yellow 70-85%, red > 85%), staggered animation
- Filing Status: donut, real-time updates without page refresh
- Client Profitability: scatter plot, quadrant analysis, hover shows client details
- Cash Flow Forecast: area chart, 30/60/90-day projections
- All charts use custom ECharts theme matching design system

### AC-AN-03: Client Analytics
- Per-client: total fees (lifetime + this year), revenue trend, hours spent, profitability, engagement score, risk score, service mix, next deadline, churn prediction, upsell score
- Cohort analysis: group by industry, revenue size, service type, location, tenure
- Compare cohorts: avg profitability, growth rate, churn rate, service adoption

### AC-AN-04: Financial Reporting
- Firm P&L: revenue by service/client/CPA, cost of revenue, gross margin, operating expenses, net profit with MoM trend
- Cash flow: cash in/out, DSO, AR aging (0-30, 31-60, 61-90, 90+)
- Custom report builder: drag-and-drop dimensions + measures, chart type selection, save as template, schedule delivery, export PDF/CSV/Excel

### AC-AN-05: Nightly AI Insights
- Temporal cron at 2 AM per tenant
- Calculates: revenue, profitability, growth, engagement, risk, churn probability per client
- Claude API generates recommendations; rule-based fallback on API failure
- Daily digest email option (top 5 action items)
- Accept/snooze/dismiss actions tracked for feedback loop

---

## Pillar 4: Document Management & AI

### AC-DOC-01: Upload & Storage
- Drag-drop + click-to-browse interface
- Resumable via tus protocol (resume from last chunk on failure)
- File validation: type whitelist (PDF, JPG, PNG, XLSX, DOCX), size < 50MB, ClamAV virus scan
- Batch upload with per-file progress indicator
- S3 storage with per-tenant bucket prefix
- AES-256 encryption at rest (per-tenant keys via KMS)
- Version history tracked (view previous versions)
- Secure sharing: encrypted links with configurable expiration

### AC-DOC-02: AI Categorization
- Claude Vision categorizes: W-2, 1099-INT/DIV/NEC/MISC/R, receipts (sub-categorized), invoices, bank statements, real estate docs, medical receipts, charitable receipts, K-1
- Extracts: date, amount, category, payer/payee, description, tax treatment, deductibility
- Confidence: >95% auto-accept, 75-95% flag for review, <75% require manual verification
- CPA override updates category; logged for feedback loop
- Accuracy target: ≥ 90% on benchmark dataset

### AC-DOC-03: Search & Linking
- Typesense full-text search with typo tolerance
- pgvector semantic similarity ("find documents similar to this one")
- Natural language queries ("Show me all W-2s for 2025")
- Filter by category, date, client, tax year
- Link documents to: client, tax year, specific form, specific line item, workflow step

### AC-DOC-04: Compliance
- Audit trail: who uploaded, when, what changed, who viewed, when deleted
- Soft delete (recoverable)
- 7-year auto-archive (S3 lifecycle → Glacier)
- Configurable retention policy per document type
- Manual hold (prevent deletion)
- Compliance report generation

---

## Pillar 5: Practice Management

### AC-PM-01: Time Tracking
- Log: client (searchable dropdown), task/service type, description, hours or start/stop timer, date, billable flag, hourly rate (override default)
- Timer: start/stop/pause/resume, auto-log on stop
- Desktop notification if timer > 4 hours
- Weekly timesheet view with bulk entry
- Utilization metrics update in Redis cache + DB materialized view

### AC-PM-02: Invoicing
- Generate from time entries: hourly (hours × rate), flat fee, hybrid (base + hourly overages)
- Auto-generate rules: threshold ($2,500), monthly cycle, workflow completion
- Recurring invoices for monthly bookkeeping clients
- Invoice PDF via React-PDF (correct layout, amounts, firm branding)
- Invoice email via Resend (delivery tracking, bounce handling)
- Status lifecycle: Draft → Sent → Viewed (tracking pixel) → Paid / Overdue / Disputed
- Manual override: adjust amount, add line items, set due date, add notes, apply credits

### AC-PM-03: Payments
- Stripe: credit card + ACH
- Webhook handler with idempotency keys (no double-processing)
- Invoice auto-marked "Paid" on successful payment
- Refund processing via Stripe API
- PCI DSS compliance via Stripe (no card data stored)

### AC-PM-04: Collections
- Auto-send reminder: 15 days overdue
- Auto-send firm reminder: 30 days overdue
- Auto-send final notice: 45 days overdue
- Late fee configuration (optional %)
- Aging report: 0-30, 31-60, 61-90, 90+ day buckets

### AC-PM-05: Expenses
- Log: date, category, amount, description, client (if billable), receipt attachment, tax deductibility
- P&L impact: total expenses, compare to revenue, profit margin, budget vs actual

### AC-PM-06: Utilization
- Per-CPA: billable hours vs capacity, utilization %, available hours, revenue per hour, client load
- Team-wide: total billable hours, overall utilization, bottleneck identification
- Hiring forecast: alert if utilization > 85% for 3 consecutive months

---

## Pillar 6: Integrations

### AC-INT-01: QuickBooks Online (MVP)
- OAuth2 connection flow
- Initial historical sync: up to 3 years (transactions, CoA, P&L, BS, cash flow)
- Ongoing sync: every 4 hours via Temporal cron (or on-demand)
- Bi-directional: invoices created in platform sync to QB
- Duplicate detection on transactions
- Retry: exponential backoff (1min, 5min, 30min), max 3 attempts
- Error notification to CPA on sync failure

### AC-INT-02: Google Drive (MVP)
- OAuth2 connection flow
- Documents uploaded to platform also stored in Drive
- Folder structure: Firm Name / Client Name / Tax Year / Category
- Background retry on sync failure (platform copy is source of truth)

### AC-INT-03: Stripe (MVP)
- Credit card + ACH payments
- Webhook on payment confirmation (signature verified)
- Auto invoice status update
- Refund processing
- Idempotency keys prevent double-processing

### AC-INT-04: Integration Framework
- OAuth2 encrypted token storage (per-tenant encryption via KMS)
- Auto token refresh (30 days before expiry)
- Retry: exponential backoff, max 3, then dead letter queue
- Data mapping layer (normalize external → internal schema)
- Webhook ingestion: signature verification, replay protection, idempotent processing
- Health dashboard: last sync time, records synced, error count, connection status
