# 🏆 THE ULTIMATE CPA FIRM MANAGEMENT PLATFORM
## Complete Master Documentation — Next.js Edition

**Last Updated:** February 10, 2026  
**Stack:** Next.js 15 + React 19 / Rust + Axum / PostgreSQL 16  
**Status:** Ready for Development  
**Estimated Build Time:** 16 Weeks MVP → $1.2-1.8M ARR Year 1 → $60M+ Year 5

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Market Opportunity](#market-opportunity)
3. [Core Problem & Solution](#core-problem--solution)
4. [Complete Feature Set](#complete-feature-set)
5. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
6. [Security Architecture](#security-architecture)
7. [Data Migration & Onboarding](#data-migration--onboarding)
8. [Processing Pipelines (with Error Handling)](#processing-pipelines-with-error-handling)
9. [Analytics & Reporting](#analytics--reporting)
10. [The Ultimate Tech Stack](#the-ultimate-tech-stack)
11. [Database Schema & Data Model](#database-schema--data-model)
12. [API Design & Contracts](#api-design--contracts)
13. [Real-Time Architecture](#real-time-architecture)
14. [Notification System](#notification-system)
15. [Offline & Degraded Mode](#offline--degraded-mode)
16. [UI/UX & Animations](#uiux--animations)
17. [Testing Strategy](#testing-strategy)
18. [MVP Build Plan (Revised 16 Weeks)](#mvp-build-plan-revised-16-weeks)
19. [Interactive Demo/Test Environment](#interactive-demotest-environment)
20. [Launch Strategy & Revenue](#launch-strategy--revenue)
21. [Success Metrics](#success-metrics)

---

## EXECUTIVE SUMMARY

**What:** The only software a CPA firm will ever need. One platform replaces 5+ fragmented tools.

**Who:** CPA firms (solo practitioners to 100+ person enterprises), accounting firms, bookkeeping services

**Why:** Current solutions are fragmented (data scattered), manual (time-consuming), limited (no automation), and expensive (5 different tools)

**Market Size:**
- 200K+ CPA firms in USA
- $50B+ accounting software market
- Average firm: 6 CPAs, 150 clients, $1.2M annual revenue
- Problem: 30% of time on admin/software fragmentation = $360K/year loss per firm

**Solution ROI:**
- Save 5 hours/week per CPA = $250K/year
- Platform cost: $36K/year
- **7x return on investment**

**Revenue Projection:**
- Year 1: $660K ARR (70 customers)
- Year 2: $3.6M ARR (200 customers)
- Year 3: $12M ARR (500 customers)
- Year 5: $60M+ ARR (2,000-3,000 customers)
- Exit: $500M-1B acquisition or IPO

---

## MARKET OPPORTUNITY

### Pain Points CPAs Want Solved

✅ **Client data fragmentation** — Everything scattered across 5+ tools  
✅ **Workflow automation** — Repeatable tax season processes  
✅ **Real-time business analytics** — Know profitability instantly  
✅ **Client document management** — Auto-categorization with AI  
✅ **Tax compliance & deadline management** — Never miss a deadline  
✅ **Team collaboration** — Task assignment, communication  
✅ **Client communication hub** — Centralized messaging  
✅ **Financial forecasting** — Revenue projections  
✅ **Practice management** — Billable hours, utilization tracking

### Client Types to Support

✅ Individual tax returns (1040)  
✅ Small business (1120-S, partnerships)  
✅ Corporations (C-Corp, multi-state)  
✅ Nonprofits & 501(c)(3)  
✅ Trusts & estates  
✅ Bookkeeping clients (ongoing)  
✅ Payroll processing

### Critical Integrations

✅ Bank APIs (Plaid — auto-sync transactions)  
✅ QuickBooks Online (bi-directional sync)  
✅ Google Drive (document storage)  
✅ E-signature (DocuSign, HelloSign)  
✅ Email (Gmail, Outlook — sync client emails)  
✅ Calendar (Google Calendar, Outlook)  
✅ Tax software (TurboTax, UltraFM)  
✅ Payment processing (Stripe, Square)  
✅ Payroll (ADP, Gusto)

### Competitive Landscape

| Competitor | Strength | Weakness | Our Advantage |
|---|---|---|---|
| Karbon | Workflow | No AI, no client portal | AI-first, full client portal |
| Canopy | Practice mgmt | No bank sync, weak analytics | Plaid integration, real-time analytics |
| TaxDome | Client portal | Dated UI, no bank integration | Modern UX, full-stack AI |
| Jetpack Workflow | Task tracking | Single-purpose only | All-in-one platform |
| Practice Ignition | Proposals | No document management | Complete document lifecycle |

---

## CORE PROBLEM & SOLUTION

### The Problem

**Current CPA Workflow Nightmare:**

1. Client sends document via email → Lost in inbox
2. CPA manually types data into Excel
3. Excel copied to QuickBooks
4. QB exported to tax software
5. Tax software exported to separate reporting tool
6. 5 different passwords, 5 login screens, 5 payment subscriptions
7. No dashboard showing which clients are profitable
8. No automation of tax season workflows
9. Client gets stuck, emails CPA repeatedly
10. CPA spends 30% of time on admin instead of client work

**Cost:**
- 5 software subscriptions: $2K-5K/month
- Manual data entry errors: $10K-50K/year in rework
- Lost time: $200K-500K/year in billable hours wasted on admin
- Client churn: Competitors offer better experience

### The Solution

**One Platform. Everything Integrated.**

1. Client uploads document → AI auto-categorizes instantly
2. Data flows to accounting software automatically
3. Tax software gets pre-populated data
4. Dashboard shows real-time firm profitability
5. Workflows automate tax season (no manual steps)
6. Client portal eliminates email overload
7. Team collaboration features (assigned tasks, deadlines)
8. Compliance calendar (never miss deadline)
9. Analytics show which clients to upsell/let go
10. CPA spends 70% of time on client work (not admin)

**Results:**
- 1 platform (not 5), 1 login (not 5), 1 subscription ($500-5000/month)
- 5+ hours saved per CPA per week
- $250K+ revenue recovery per firm
- 7x ROI

---

## COMPLETE FEATURE SET

### PILLAR 1: CLIENT MANAGEMENT

#### Client Portal (Client-Facing)

**What Clients See:**
- Dashboard: tax status, documents needed, deadlines, balance
- Document upload portal (auto-categorized by AI)
- Secure messaging to CPA (with read receipts, threaded conversations)
- Tax filing status (pending, submitted, completed)
- Invoice & payment history with online payment
- Tax documents download (final returns)
- Tax planning tips (personalized by AI)
- Estimated tax liability (updated monthly)
- FAQ knowledge base (searchable)
- Self-service tax questionnaire (structured intake forms)
- Mobile-responsive (PWA for receipt capture on-the-go)

**Smart Features:**
- Auto-categorization (Claude Vision recognizes W-2s, 1099s, receipts)
- Missing document alerts ("You need 2023 expense statement")
- Smart document request lists (AI analyzes what's been submitted vs. what's needed per client type)
- Deadline reminders (push notifications)
- Payment reminders (auto email for unpaid invoices)
- Multi-person access (client can invite accountant, partner, bookkeeper)
- Secure sharing (encrypted links with expiration)

**White-Label Capability (Scale Tier):**
- Custom domain (portal.abcaccounting.com)
- Firm logo, colors, branding
- Custom email templates
- Firm-specific FAQ content

#### Client Workspace (Internal CPA View)

**Client Master Dashboard:**
- Client profile (name, contact, business type, fiscal year, tax ID — encrypted)
- Quick stats (fees YTD, revenue trend, last contact)
- Filing status (not started → submitted → completed)
- Open action items (assigned to specific CPA)
- Activity feed (timeline of events)
- Risk profile/red flags (late payments, compliance issues)
- Next scheduled meeting
- Account balance (credit or owing)
- Assigned team member

**Client Contacts:**
- Primary contact (decision maker)
- Secondary contacts (bookkeeper, CFO, partner)
- Email, phone, preferred contact method
- Contact history (last 10 interactions)

**Financial Overview:**
- Last 3 years revenue
- Estimated tax liability
- Fee breakdown (by service)
- Payment history
- Profitability vs hours spent
- Growth trend (MoM, YoY)

**Documents Section:**
- Organized by category (W-2, 1099, receipt, invoice)
- AI-extracted metadata (date, amount, category, payer)
- Document preview (view without downloading)
- Version history (track changes)
- Download/share options
- Batch operations (select multiple, re-categorize, download)

**Secure Messaging (Threaded):**
- Threaded conversations per topic
- File attachments in messages
- @mentions for team collaboration
- Read receipts with timestamps
- Message search across all client conversations
- Canned response templates

**Timeline/Activity:**
- All interactions logged (document uploaded, message sent, invoice sent)
- Color-coded by type (doc upload, payment, communication, filing event)
- Filter by activity type
- Search by keyword

### PILLAR 2: TAX WORKFLOW AUTOMATION

#### Workflow Templates

**Tax Season 2026 Workflow Example:**

Step 1: Collect Documents
- Auto-send checklist to client portal
- AI generates personalized document request based on client type and prior year
- Set deadline (e.g., Jan 31)
- Track completion (which docs received)
- Auto-alert CPA when all docs received

Step 2: Review Financials
- Auto-pull QB data
- Display in dashboard
- AI flags unusual items ("$50K expense looks high — 400% increase from last year")
- CPA manually reviews, approves

Step 3: Prepare Draft Return
- AI populates return from client data
- CPA fine-tunes specific sections
- Set review deadline
- Auto-route to partner for approval

Step 4: Partner Review
- Partner sees red flags highlighted
- Approve or request changes (with comments)
- Return to CPA if changes needed
- Auto-notify of approval

Step 5: Client Signature
- Generate return PDF
- Send via DocuSign for signature
- Track signature status
- Store signed document

Step 6: File with IRS
- Optional: auto-file electronically
- Track filing confirmation
- Store filing receipt
- Auto-send final return to client

Step 7: Post-Filing
- Set calendar reminder for next year
- Request client feedback via built-in NPS survey
- Archive documents
- Move to next year's workflow

**Customization:**
- CPAs can create custom workflows with drag-and-drop builder
- Define steps, assignees, deadlines, conditional branching
- Set approval requirements
- Add automatic triggers (e.g., "when all docs uploaded, advance to Step 2")
- Reuse templates annually
- Clone and modify workflows per client type

#### Task Management (Beyond Workflows)

**Ad-Hoc Tasks:**
- Create quick tasks: "Call John about missing K-1"
- Assign to team member with due date
- Priority levels (urgent, high, normal, low)
- Kanban board view (To Do, In Progress, Review, Done)
- List view with sorting/filtering
- Calendar view (tasks overlaid on deadlines)
- Recurring tasks (e.g., "Monthly bookkeeping review")

#### Deadline Tracking

**Automatic Compliance Calendar:**

For 1040 Filer:
- Oct 15: Extended deadline for last year's return
- Dec 31: Year-end tax planning deadline
- Jan 15: Q4 estimated tax payment (prior year)
- Apr 15: Filing deadline (main)
- Jun 15: Q2 estimated tax due
- Sep 15: Q3 estimated tax due
- Dec 15: Q4 estimated tax due

For 1120-S (S-Corp):
- Mar 15: Filing deadline (or Sep 15 if extended)
- K-1 deadline for owners
- Quarterly estimated tax payments

For 1065 (Partnership):
- Mar 15: Filing deadline (or Sep 15 if extended)
- K-1 deadline for partners
- Quarterly estimated tax payments

**State-Specific Deadlines:**
- Auto-generated based on client's state(s)
- Multi-state support (client operating in multiple states)
- State-specific extensions tracked separately

**Alert System:**
- 30 days before: "Schedule tax planning call"
- 14 days before: "Request final documents"
- 7 days before: "Review return draft with client"
- 1 day before: "Final deadline alert"
- DAY OF: "DEADLINE TODAY" — push notification
- MISSED: Auto-escalate to partner, flag in dashboard, log in audit trail

**Compliance Tracking:**
- Document proof of deadline reminder sent (audit trail)
- Track if deadline missed (automatic escalation)
- Attach engagement letter (proves engagement date)
- Store all correspondence
- Generate compliance report for E&O insurance

---

### PILLAR 3: REAL-TIME BUSINESS ANALYTICS

#### Firm Dashboard

**Top-Level Metrics:**
- Total revenue YTD (compare to last year)
- MoM growth (% increase from last month)
- Active clients (count + trend)
- Team utilization (% of billable capacity used)
- Outstanding invoices (total $ not paid)
- Upcoming deadlines (next 30 days)
- Client churn rate (clients lost this year)
- Average client profitability
- AI insights summary (top 3 action items)

#### Charts & Visualizations (Apache ECharts)

**Revenue Trend (Line Chart with Area Fill):**
- X-axis: months (Jan-Dec)
- Y-axis: revenue ($0-$100K)
- Seasonal pattern overlay
- Hover: tooltips with exact amounts
- Click: filter by service type or CPA

**Revenue by Service (Pie Chart):**
- Segments: Tax Returns, Bookkeeping, Audit, Payroll, Planning
- Hover: percentage + dollar amount
- Click segment: drills down to clients in that service

**Client Profitability Distribution (Scatter Plot):**
- X-axis: revenue from client ($0-$50K)
- Y-axis: hours spent (0-500 hrs)
- Color: green (profitable), yellow (breakeven), red (loss-making)
- Hover: client name + exact revenue + hours
- Quadrant analysis (high revenue/low hours = ideal clients)

**Team Workload (Bar Chart):**
- Each bar = one CPA
- Height = hours worked this week
- Color intensity = utilization % (green = good, red = overloaded)
- Hover: exact hours + capacity
- Shows who needs help, who can take new clients

**Tax Filing Status (Donut Chart):**
- Segments: Filed, Pending Review, Pending Client Docs, Not Started
- Real-time updates as CPAs mark status

**Cash Flow Forecast (Area Chart):**
- Projected cash in (based on outstanding invoices + payment patterns)
- Projected cash out (based on recurring expenses)
- 30/60/90-day forecast

#### Client Analytics

**Per-Client View:**
- Total fees (lifetime + this year)
- Revenue trend (is this client growing?)
- Hours spent (CPA time invested)
- Profitability (revenue - cost of service)
- Engagement (last contact, document upload frequency)
- Risk score (late payments? compliance issues?)
- Service mix (what services they use)
- Next deadline
- Churn prediction (AI-powered likelihood to leave)
- Upsell opportunity score (AI-powered)

#### Cohort Analysis

**Group clients by:**
- Industry (tech, retail, healthcare, real estate, etc.)
- Revenue size ($0-$100K, $100K-$500K, $500K+)
- Service type (bookkeeping, tax only, audit, full service)
- Location (state, region)
- Client tenure (new, 1-3 years, 3+ years)

**Compare cohorts:**
- Average profitability per cohort
- Growth rate by cohort
- Churn rate by cohort
- Service adoption (which cohort buys more services?)
- Price sensitivity analysis

#### Financial Reporting

**Firm P&L:**
- Revenue (by service, by client, by CPA)
- Cost of revenue (CPA salaries, software)
- Gross margin (revenue - direct costs)
- Operating expenses (office, admin, marketing)
- Net profit with MoM trend

**Cash Flow:**
- Cash in (invoice paid, deposits)
- Cash out (payroll, expenses, software)
- Days sales outstanding (how long until paid)
- Accounts receivable aging (0-30, 31-60, 61-90, 90+)
- Accounts payable

**Custom Report Builder:**
- Drag-and-drop report builder
- Select dimensions (time, client, service, CPA)
- Select measures (revenue, hours, profitability)
- Save and schedule reports (weekly/monthly email)
- Export to PDF, CSV, Excel

---

### PILLAR 4: DOCUMENT MANAGEMENT & AI PROCESSING

#### Document Upload & Storage

**User Experience:**
- Drag-drop interface (or click to browse)
- Mobile camera support (take photo of receipt via PWA)
- Resumable uploads (tus protocol — if connection drops at 90%, resume from 90%)
- Multiple file formats supported (PDF, image, Excel, Word)
- Batch upload with progress indicator
- Cloud storage (AWS S3 with Google Drive backup)
- Encryption at rest (AES-256 per-tenant keys)
- Version history (track changes)
- Secure sharing (encrypted links, expiration date)

#### AI Categorization (Claude Vision)

**Automatic Detection:**
- W-2 Form → Wage Income
- 1099-INT → Interest Income
- 1099-DIV → Dividend Income
- 1099-NEC → Independent Contractor Income
- 1099-MISC → Miscellaneous Income
- 1099-R → Retirement Distributions
- Business Receipt → Meals & Entertainment / Office Supplies / Travel (sub-categorized)
- Invoice → Business Expense
- Bank Statement → Source of Funds
- Real Estate Docs → Rental Property
- Medical Receipt → Medical Expense
- Charitable Receipt → Charitable Deduction
- K-1 → Partnership/S-Corp Income

**Extracted Data:**
- Date (parsed from document)
- Amount (recognized from document)
- Category (W-2, 1099, receipt, etc.)
- Payer/Payee (extracted name)
- Description (extracted details)
- Tax treatment (which form, which line)
- Deductibility (yes/no/maybe)

**Confidence Score:**
- 95%+ confidence: auto-accept
- 75-95% confidence: flag for review
- <75% confidence: require CPA to verify
- CPA can override if AI is wrong (feedback loop improves model)

**Semantic Document Search (Typesense + pgvector):**
- Full-text search across all documents
- "Find documents similar to this one"
- Natural language queries: "Show me all W-2s for 2025"
- Filter by category, date, client, tax year

#### Document Linking

**Attach to:**
- Client (document belongs to John Smith)
- Tax year (2025 tax return)
- Specific form (Schedule C, Form 1040)
- Specific line item (deductible meals)
- Workflow step (auto-link when uploaded during workflow)

#### Compliance & Audit Trail

**Track:**
- Who uploaded (user ID + name)
- When uploaded (timestamp)
- What changed (if edited)
- Who viewed (user ID + timestamp)
- When deleted (soft delete, recoverable)
- AI categorization result + confidence score

**Retention:**
- Auto-archive after 7 years (per IRS requirement)
- Configurable retention policy per document type
- Archive to S3 Glacier for cold storage
- Manual hold (prevent deletion for specific docs)
- Compliance report generation

---

### PILLAR 5: PRACTICE MANAGEMENT

#### Time Tracking

**Log Hours:**
- Client dropdown (searchable, recent clients first)
- Task/service type dropdown (tax prep, bookkeeping, consulting)
- Description ("Initial tax return review")
- Hours spent (2.5) or start/stop timer
- Date (today or backdate)
- Billable (yes/no)
- Hourly rate (override default if needed)

**Timer Option:**
- Start/stop timer while working
- Auto-logs hours on stop
- Pause/resume capability
- Desktop notification if timer running > 4 hours (forgot to stop?)
- Weekly timesheet view with bulk entry

#### Invoice Generation

**Automatic:**
- Log 10 hours × $150/hour = $1,500 invoice
- Or: flat fee (e.g., $2,000 for tax return)
- Or: hybrid (base fee + hourly for overages)
- Multiple invoice types (single client, monthly aggregated, yearly)
- Recurring invoices (monthly bookkeeping clients)

**Manual Override:**
- Adjust invoice amount (discount, special rate)
- Add line items (other charges)
- Set due date and payment terms
- Add notes/memos
- Apply credits from prior overpayments

#### Invoice Tracking

**Status:**
- Draft → Sent → Viewed → Paid (or Overdue/Disputed)
- "Viewed" status via email tracking pixel

**Aging Report:**
- 0-30 days: current
- 31-60 days: past due
- 61-90 days: very past due
- 90+ days: at risk of write-off

**Automated Collection:**
- Auto-send reminder email (after 15 days)
- Auto-send firm reminder (after 30 days)
- Auto-send final notice (after 45 days)
- Mark for phone follow-up
- Option to add late fees (configurable %)

#### Expense Tracking

**Log Expenses:**
- Date, category, amount, description
- Client (if billable back to client)
- Receipt attachment (photo or file)
- Tax deductibility classification

**P&L Impact:**
- Track total expenses
- Compare to revenue
- Calculate profit margin
- Budget vs. actual reporting

#### Utilization Analytics

**Per-CPA:**
- Billable hours logged vs. capacity
- Utilization % (actual / capacity)
- Available hours for new work
- Revenue generated per hour
- Client load distribution

**Team-Wide:**
- Total billable hours (all CPAs combined)
- Overall utilization rate
- Bottleneck identification
- Hiring needs forecast (if utilization > 85% for 3 consecutive months)

---

### PILLAR 6: INTEGRATIONS HUB

#### QuickBooks Online (Priority 1 — MVP)

**Data Flow:**
- CPA connects QB account via OAuth 2.0
- Initial full historical sync (up to 3 years)
- App fetches: transactions, chart of accounts, P&L, balance sheet, cash flow
- Display in dashboard with QB data badge
- Bi-directional: invoices created in platform → sync to QB
- Ongoing sync: every 4 hours or on-demand pull
- Retry logic with exponential backoff (max 3 attempts)
- Error notifications to CPA on sync failure
- Duplicate detection on transactions

#### Google Drive (Priority 1 — MVP)

**Data Flow:**
- CPA connects Drive account via OAuth 2.0
- Documents uploaded to platform → also stored in firm's Drive folder
- Organized by: Firm Name / Client Name / Tax Year / Category
- Searchable in both platform and Drive

#### Stripe (Priority 1 — MVP)

**Payment Processing:**
- Accept credit card and ACH payments
- Webhooks on payment confirmation
- Automatic invoice status update on payment
- Refund processing via API
- PCI DSS compliance handled by Stripe (no card data stored)

#### Plaid (Priority 2 — Phase 2)

**Data Flow:**
- Client connects bank account via Plaid Link
- Pull transactions (configurable: 6-24 months history)
- Claude categorizes (business expense vs. personal, sub-categories)
- Dashboard updated with transaction feed
- CPA reviews and confirms categorization
- Use for estimated tax calculations and Schedule C

#### DocuSign (Priority 2 — Phase 2)

**Data Flow:**
- Generate engagement letter / tax return PDF
- Send for signature via DocuSign API
- Track signature status (webhook-driven)
- Store signed document in platform + Google Drive
- Auto-advance workflow step on signature completion

#### Email Integration (Phase 2)

**Gmail/Outlook via OAuth:**
- Sync emails matching client email addresses
- Auto-attach to client record
- Searchable email history per client
- No duplicate storage (reference by message ID)

#### Calendar Integration (Phase 2)

**Google Calendar/Outlook:**
- Push tax deadlines to CPA calendar
- Bi-directional meeting sync
- Schedule client meetings from platform
- Automatic reminders synced

#### Tax Software Export (Phase 2)

**TurboTax/UltraFM:**
- Export client data in tax software format (.tax, CSV)
- Pre-populate fields reducing manual entry by 60-80%
- Track filing status from within platform

#### Payroll Integration (Phase 3)

**ADP/Gusto:**
- Pull payroll data and W-2 information
- Display in dashboard
- Pre-populate tax returns with employment data

#### Integration Architecture

- OAuth2 flows with encrypted token storage (per-tenant encryption)
- Automatic token refresh (30 days before expiry)
- Retry logic (exponential backoff, max 3 attempts, then dead letter queue)
- Error handling (notify CPA on failures, log in audit trail)
- Data mapping layer (normalize external formats to internal schema)
- Webhook ingestion with signature verification
- Sync frequency configurable per integration (4-24 hours)
- Integration health dashboard (last sync, status, error count)

---

## MULTI-TENANCY ARCHITECTURE

### Overview

Every CPA firm is a "tenant." All data is isolated at the database level using PostgreSQL Row-Level Security (RLS). This is the foundational architecture decision — designed before any feature code.

### Tenant Isolation Strategy

**Database Level:**
- Every table includes a `tenant_id` column (UUID, NOT NULL, indexed)
- RLS policies on every table: `CREATE POLICY tenant_isolation ON [table] USING (tenant_id = current_setting('app.current_tenant')::uuid)` 
- RLS enabled and forced: `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY; ALTER TABLE [table] FORCE ROW LEVEL SECURITY` 
- The backend sets `app.current_tenant` on every database connection via middleware
- If tenant context is missing, the query returns zero rows (fail-safe)

**Application Level:**
- Axum middleware extracts tenant_id from JWT claims on every request
- Tenant context injected into every database query via connection setup
- API endpoints never accept tenant_id as a parameter (derived from auth token only)
- All caching is tenant-scoped (Redis keys prefixed with `tenant:{id}:`)
- Background jobs carry tenant context in job payload

**Encryption Level:**
- Per-tenant encryption keys for PII fields (SSN, EIN, bank accounts)
- Master key in AWS KMS, tenant keys derived using envelope encryption
- Key rotation policy: annual rotation, old keys retained for decryption

### Tenant Lifecycle

**Onboarding:**
1. Firm signs up → tenant record created
2. Admin user created with Owner role
3. Default workflow templates cloned to tenant
4. Demo data optionally loaded
5. Integration setup wizard launched

**Offboarding:**
1. Firm cancels → 30-day grace period (data accessible, read-only)
2. After 30 days → data export package generated (JSON + documents)
3. After 60 days → data soft-deleted (retained 90 more days for recovery)
4. After 150 days → data hard-deleted, encryption keys destroyed

### Role-Based Access Control (RBAC)

| Role | View Clients | Edit Clients | Approve Returns | File Returns | Manage Users | See Firm Analytics | Access Billing |
|---|---|---|---|---|---|---|---|
| Staff Accountant | Assigned only | Assigned only | ❌ | ❌ | ❌ | ❌ | ❌ |
| Senior Accountant | All | Assigned | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manager | All | All | ✅ | ❌ | ❌ | Team only | ❌ |
| Partner | All | All | ✅ | ✅ | ❌ | ✅ | ✅ |
| Admin (Firm Owner) | All | All | ✅ | ✅ | ✅ | ✅ | ✅ |
| Client | Own data only | Limited | ❌ | ❌ | ❌ | ❌ | Own invoices |

**Permission Granularity:**
- Resource-level: "Can this user access THIS client's data?"
- Action-level: "Can this user APPROVE a return vs. just VIEW it?"
- Field-level: "Can this user see SSN fields?" (only Partner/Admin)

---

## SECURITY ARCHITECTURE

### Data Classification

| Tier | Data Type | Protection Level |
|---|---|---|
| Tier 1 (Critical) | SSN, EIN, bank account numbers, routing numbers | Field-level encryption (AES-256-GCM), per-tenant keys via AWS KMS envelope encryption, masked in UI (show last 4 only), never logged |
| Tier 2 (Sensitive) | Tax returns, financial statements, income data, client PII (name, address, DOB) | Encryption at rest (S3 SSE-KMS), TLS 1.3 in transit, access-logged in audit trail |
| Tier 3 (Internal) | Invoices, time entries, workflow data, analytics | Standard encryption at rest, TLS in transit |
| Tier 4 (Public) | Firm name, public contact info, marketing content | Standard protection |

### Authentication

- **Password hashing:** Argon2id (GPU-resistant, memory-hard)
- **JWT tokens:** Short-lived access tokens (15 min), long-lived refresh tokens (7 days)
- **MFA:** TOTP (Google Authenticator, Authy) — required for Partner/Admin roles
- **Session management:** Redis-backed, per-device tracking, remote logout capability
- **Rate limiting:** 5 failed login attempts → 15 min lockout, progressive delays
- **Password policy:** Minimum 12 characters, breach database check (HaveIBeenPwned API)

### API Security

- **Zero-trust design:** Every endpoint validates: (1) Authentication, (2) Tenant ownership, (3) Role permission, (4) Resource ownership
- **CORS:** Strict origin whitelist (platform domain + client portal domain)
- **Rate limiting per tenant:** Solo: 100 req/min, Growing: 500 req/min, Scale: 2000 req/min
- **Request signing:** Webhook deliveries signed with HMAC-SHA256
- **Input validation:** Zod schemas on every endpoint, reject malformed requests before processing
- **SQL injection prevention:** SQLx compile-time verified queries (parameterized, no string interpolation)

### Compliance Readiness

- **IRS Pub 4557:** Written Information Security Plan (WISP) — platform enforces required controls
- **FTC Safeguards Rule:** Customer information protection — encryption, access controls, audit logging
- **SOC 2 Type II:** Planned for Month 9-12. Controls: access management, encryption, monitoring, incident response
- **GDPR-ready:** Data export, right to deletion (tenant offboarding flow), consent management
- **Penetration testing:** Quarterly via third-party firm, starting before public launch

### Incident Response Plan

1. **Detection:** Sentry alerts, anomaly detection on login patterns, failed access spikes
2. **Containment:** Automatic account lockout on suspicious activity, API key revocation
3. **Eradication:** Root cause analysis, patch deployment
4. **Recovery:** Data integrity verification, service restoration
5. **Post-mortem:** Documented incident report, process improvement
6. **Notification:** Affected tenants notified within 72 hours (GDPR requirement)

---

## DATA MIGRATION & ONBOARDING

### The #1 Barrier to Adoption

CPA firms don't switch tools because migrating 150 clients with years of history is terrifying. Our onboarding system makes this painless.

### Migration Paths

#### Path 1: CSV/Excel Import (All Firms)

**Client Import:**
- Upload CSV/Excel with client data
- Column mapping wizard (drag their columns to our fields)
- Validation report before import (highlight errors, missing fields)
- Preview first 10 records
- Batch import with progress bar
- Undo capability (delete all imported within 24 hours)

**Template provided:**
- Pre-formatted Excel template with all fields
- Sample data included
- Field descriptions and accepted formats
- Downloadable from settings page

#### Path 2: QuickBooks Historical Import (Priority)

**Automated migration:**
- Connect QB via OAuth
- Pull ALL historical data (not just ongoing sync):
  - Chart of accounts
  - Client list with contact info
  - Transaction history (up to 5 years)
  - Invoice history
  - P&L reports by year
- Map QB categories to platform categories
- Preview before committing
- Estimated time: 2-15 minutes depending on data volume

#### Path 3: Document Bulk Upload

**Batch processing:**
- Upload ZIP file or select Google Drive folder
- AI processes all documents in background queue
- Categorizes and extracts metadata from each
- Links to clients based on name matching (fuzzy match)
- CPA reviews AI matches, confirms or corrects
- Progress dashboard shows completion %

#### Path 4: Competitor Export Import (Phase 2)

- Karbon CSV export → our import
- Canopy data export → our import
- TaxDome export → our import
- Custom mapping for each competitor's format

### Onboarding Wizard

**Step 1:** Firm profile setup (name, address, logo, timezone)  
**Step 2:** Invite team members (roles assigned)  
**Step 3:** Import clients (CSV, QB, or manual)  
**Step 4:** Import documents (bulk upload or ongoing)  
**Step 5:** Connect integrations (QB, Google Drive, Stripe)  
**Step 6:** Configure workflow templates  
**Step 7:** Guided tour of dashboard

### Estimated Onboarding Time

| Firm Size | Clients | Estimated Time | Support Level |
|---|---|---|---|
| Solo (1 CPA) | 1-50 | 2-4 hours | Self-service + docs |
| Small (2-5 CPAs) | 50-200 | 1-2 days | Email support |
| Medium (6-20 CPAs) | 200-500 | 3-5 days | Dedicated onboarding call |
| Enterprise (20+) | 500+ | 1-2 weeks | Dedicated account manager |

### Parallel Run Period

- First 30 days: old system + new system running simultaneously
- Validate data matches between systems
- Team trains on new system with safety net
- Cutover date agreed with firm

---

## PROCESSING PIPELINES (WITH ERROR HANDLING)

### Pipeline 1: Document Ingestion & AI Categorization

```text
User uploads document
    ↓
Validate file (type, size < 50MB, virus scan via ClamAV)
    ├── FAIL: Reject with clear error message ("File too large" or "Unsupported format")
    ↓ PASS
Resumable upload via tus protocol → AWS S3 (per-tenant bucket prefix)
    ├── FAIL: Client retries from last chunk (not from beginning)
    ↓ PASS
Store metadata in PostgreSQL (filename, size, upload date, uploader, tenant_id)
    ↓
Queue AI categorization job (Redis + Temporal workflow)
    ↓
Claude Vision API: analyze document
    ├── FAIL (API down): Queue job for retry (exponential backoff: 1min, 5min, 30min)
    ├── FAIL (3 retries exhausted): Mark as "Pending Manual Review", notify CPA
    ↓ PASS
AI categorization result + confidence score
    ↓
Confidence assessment:
  - >95%: Auto-accept, store extracted data
  - 75-95%: Flag for review, store with "needs_review" status
  - <75%: Require CPA verification, store with "unverified" status
    ↓
Notify CPA: "New [document type] received for [client name]"
    ↓
Index in Typesense for full-text search
    ├── FAIL: Retry indexing async (search temporarily unavailable for this doc)
    ↓ PASS
If Google Drive connected: backup copy to Drive
    ├── FAIL: Log warning, retry in background (platform copy is source of truth)
    ↓
Complete — audit log entry created
```

### Pipeline 2: Time Entry → Invoice → Payment

```text
CPA logs time entry (client, hours, rate, description)
    ↓
Validate: client exists, hours > 0, rate valid
    ├── FAIL: Return validation error immediately
    ↓
Store time entry in database
    ↓
Update utilization metrics (Redis cache + DB)
    ↓
Check invoice generation rules:
  - Auto-generate at threshold? (e.g., $2,500 accumulated)
  - Monthly billing cycle? (aggregate all time entries for month)
  - Flat fee engagement? (generate on workflow completion)
    ├── Threshold met: Generate draft invoice
    ├── Not yet: Wait for next entry
    ↓
Invoice generated (draft status)
    ↓
CPA reviews and sends (or auto-send if configured)
    ↓
Invoice emailed to client + added to client portal
    ├── Email FAIL: Retry via Resend, flag if bounced
    ↓
Client pays via Stripe (credit card or ACH)
    ├── Payment FAIL: Notify client, log in aging report
    ├── Webhook FAIL: Stripe retries, idempotency key prevents double-processing
    ↓ PASS
Invoice marked "Paid"
    ↓
Dashboard metrics updated (revenue, AR, utilization)
    ↓
If QB connected: sync invoice + payment to QB
    ├── FAIL: Queue for retry, flag sync error
    ↓
Complete — audit trail records full lifecycle
```

### Pipeline 3: Tax Compliance & Deadline Management

```text
Client added to system with filing type (1040, 1120-S, etc.)
    ↓
System auto-generates compliance calendar based on:
  - Filing type
  - Fiscal year end
  - State(s) of operation
  - Extension status
    ↓
Deadlines stored in database with reminder schedule
    ↓
Temporal scheduled workflows for each deadline:
  - 30 days: Reminder to CPA ("Schedule tax planning call")
  - 14 days: Auto-email to client ("Please send outstanding documents")
      ├── Email FAIL: Log + notify CPA to call client
  - 7 days: Alert CPA ("Review return draft")
  - 1 day: Push notification ("FINAL DEADLINE ALERT")
  - DAY OF: Dashboard banner + push notification
  - MISSED: Auto-escalate to partner
      ├── Log missed deadline in audit trail with reason
      ├── Flag in compliance report
      ├── E&O insurance documentation captured
    ↓
If extension filed: Update calendar, restart reminder sequence
    ↓
Complete — full audit trail of every reminder sent/received
```

### Pipeline 4: Nightly AI Insights

```text
Nightly at 2 AM (Temporal cron workflow per tenant):
    ↓
For each client, calculate:
  - Total revenue (lifetime + this year)
  - Profitability (revenue - hours spent × blended rate)
  - Growth trend (YoY revenue change)
  - Engagement score (last contact, activity frequency, response time)
  - Risk score (late payments, missed deadlines, compliance issues)
  - Churn probability (ML model: engagement + payment history + tenure)
    ↓
Claude API: Generate actionable recommendations:
  - "John Smith: $50K equipment purchase → discuss Section 179 deduction"
  - "Jane Doe: Revenue $500K, still on 1040-C → evaluate S-Corp election"
  - "Tech Inc: 60% revenue growth → can increase fees 15-20% at renewal"
  - "ABC Corp: No contact in 4 months, 2 late payments → high churn risk"
    ├── Claude API FAIL: Use rule-based fallback recommendations
    ↓
Store insights in database (per client, per tenant)
    ↓
Dashboard updated: "AI Insights" section
    ↓
Optional: Daily digest email to CPA with top 5 action items
    ↓
CPA can: accept (take action), snooze (remind later), dismiss (not relevant)
    ↓
Track which recommendations lead to action → feedback loop for ML model
    ↓
Complete
```

### Pipeline 5: Bank Transaction Sync (Plaid)

```text
Client connects bank via Plaid Link (in client portal)
    ↓
Plaid authorization: client logs into bank
    ├── Auth FAIL: Display Plaid error, offer retry
    ↓
Store Plaid access token (encrypted, per-tenant)
    ↓
Initial pull: transaction history (configurable: 6-24 months)
    ├── FAIL: Retry with backoff, notify CPA if 3 failures
    ↓
Store transactions in database (with Plaid transaction_id for dedup)
    ↓
Claude categorizes each transaction:
  - Business expense → sub-category (meals, travel, office, etc.)
  - Personal → excluded from business calculations
  - Transfer → linked between accounts
    ├── Batch processing: 100 transactions per Claude API call
    ├── FAIL: Mark as "uncategorized", CPA reviews manually
    ↓
Dashboard updated: client's transaction feed
    ↓
Every 6 hours: Plaid webhook or pull for new transactions
    ├── Plaid access expired: Notify CPA, client needs to re-authenticate
    ├── Duplicate detection: Skip transactions with existing Plaid transaction_id
    ↓
CPA reviews, confirms or adjusts categorization
    ↓
If QB connected: sync confirmed transactions to QB
    ↓
Tax prep: categorized transactions → Schedule C, expense reports
    ↓
Complete
```

### Pipeline 6: Integration Sync Management

```text
CPA connects integration (QB, Google Drive, etc.) via OAuth
    ↓
OAuth flow completes → tokens stored encrypted (per-tenant)
    ↓
Initial sync (Temporal workflow):
  - Full historical data pull
  - Store in local database with source_id for dedup
  - Progress indicator shown to CPA
    ├── FAIL: Partial sync saved, retry from last checkpoint
    ↓
Ongoing sync (Temporal cron: every 4 hours):
  - Check for new/changed data
  - Pull changes, merge with local data
  - Duplicate detection by source_id
    ├── Sync FAIL: Retry with exponential backoff (1min, 5min, 30min)
    ├── 3 failures: Notify CPA via email
    ├── Token expired: Auto-refresh if refresh token valid
    ├── Refresh token expired: Notify CPA to reconnect
    ↓
Dashboard: integration health status
  - Last sync time
  - Records synced
  - Error count
  - Connection status (healthy, warning, error)
    ↓
Complete
```

---

## ANALYTICS & REPORTING

### Dashboard Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  [Firm Logo] ABC Accounting - Dashboard     [Notifications] │
│  Feb 10, 2026                               [Settings ⚙️]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  KEY METRICS (This Month)                                   │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Revenue  │ Growth   │ Active   │ Utiliz.  │ Outstand │  │
│  │ $47,200  │ +18%     │ 15      │ 78%      │ $3,200   │  │
│  │ YTD      │ MoM      │ clients  │ team avg │ invoices │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                             │
│  AI INSIGHTS                                                │
│  🔵 3 upsell opportunities identified                       │
│  🟡 2 clients at churn risk                                 │
│  🔴 1 deadline approaching (3 days)                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Revenue Trend Chart]          [Revenue by Service Chart]  │
│  Line + Area, 12 months        Donut chart                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Team Utilization Chart]       [Filing Status Chart]       │
│  Bar chart per CPA              Donut: Filed/Pending/etc    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CLIENT LIST (Sortable, Filterable, Searchable)             │
│  ┌──────────┬────────┬─────────┬────────┬────────┬──────┐  │
│  │ Client   │ Type   │ Status  │ Fees   │ Risk   │ CPA  │  │
│  ├──────────┼────────┼─────────┼────────┼────────┼──────┤  │
│  │ Tech Inc │ C-Corp │ 📝 Rev  │ $8,500 │ ✅ Low │ Sarah│  │
│  │ ABC Corp │ S-Corp │ ✅ Done │ $3,500 │ ✅ Low │ Sarah│  │
│  │ J. Smith │ 1040   │ 60% ▓▓░│ $2,400 │ ✅ Low │ Mike │  │
│  │ J. Doe   │ 1040   │ ⏳ Wait │ $1,800 │ 🟡 Med │ Mike │  │
│  └──────────┴────────┴─────────┴────────┴────────┴──────┘  │
│  [Click row → full client profile]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Chart Specifications (Apache ECharts)

- **Revenue Trend** — Line + area, animated draw (800ms), hover tooltips, click to filter
- **Revenue by Service** — Donut chart, animated slices (600ms), drill-down on click
- **Team Utilization** — Bar chart, color-coded (green/yellow/red), staggered animation
- **Filing Status** — Donut chart, real-time updates
- **Client Profitability Scatter** — Quadrant analysis, hover shows client details
- **Cash Flow Forecast** — Area chart, 30/60/90-day projections

### Client Detail Analytics

Per-client dashboard with: financial snapshot, hours & profitability analysis, engagement trend, service mix with upsell opportunities, next deadline countdown, churn risk score, and AI-generated action recommendations.

### Team Analytics

Per-CPA view: billable hours vs. capacity, utilization %, client load distribution, revenue generated, workload trend (4-week rolling), and capacity recommendation.

### Custom Report Builder

- Drag-and-drop interface
- Dimension selection (time, client, service, CPA, industry)
- Measure selection (revenue, hours, profitability, count)
- Chart type selection (table, bar, line, pie)
- Save reports as templates
- Schedule automated delivery (weekly/monthly email)
- Export: PDF, CSV, Excel

---

## THE ULTIMATE TECH STACK

### FRONTEND

**Framework & Core:**
- Next.js 15 (App Router)
- React 19 with Server Components
- TypeScript strict mode
- Streaming SSR (fast initial loads)
- Automatic code splitting
- Server Actions for mutations

**Styling:**
- Tailwind CSS v4 (utility classes)
- CSS Modules (component-specific overrides only)

**Animations:**
- Framer Motion (React animations)
  - Page transitions (fade/slide)
  - Micro-interactions (hover, click feedback)
  - Chart entrance animations
  - Layout animations (list reorder)
- GSAP (complex chart timeline animations)

**Components & UI:**
- shadcn/ui (pre-built, accessible components)
- Lucide React (SVG icons)
- TanStack React Table v8 (data tables with sorting/filtering/pagination)

**State Management:**
- TanStack Query v5 (server state, caching, optimistic updates, real-time polling)
- Zustand (lightweight client state: UI, modals, filters)

**Data Visualization:**
- Apache ECharts (primary — all charts: line, bar, pie, scatter, heatmap, gauge)
- Enterprise-grade animations and interactions
- Custom themes matching design system

**Forms & Validation:**
- React Hook Form (form state management)
- Zod (schema validation — shared with backend)

**Search:**
- Typesense InstantSearch (real-time search UI for documents and clients)

**File Upload:**
- tus-js-client (resumable uploads)

**Real-Time:**
- Native WebSocket via TanStack Query integration
- Server-Sent Events for dashboard metric updates

**PDF Generation:**
- React-PDF (invoices, engagement letters, reports)

**Performance Targets:**
- Lighthouse: 90+ (Performance, Accessibility, Best Practices)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 200KB initial JS

**Testing:**
- Vitest (unit tests)
- Playwright (E2E tests)
- React Testing Library (component tests)
- MSW (API mocking for frontend tests)

### BACKEND (RUST)

**Framework & Runtime:**
- Axum 0.8+ (web framework)
  - Type-safe routing with extractors
  - Middleware composition (auth, tenant context, rate limiting, logging)
  - Tower service layer
- Tokio (async runtime)
  - Multi-threaded event loop
  - Handles 100K+ concurrent connections

**Database:**
- SQLx 0.8+ (compile-time SQL verification)
  - Type-safe queries (errors caught at compile time, not runtime)
  - Connection pooling (built-in)
  - Async/await native
  - Migration management
- PostgreSQL 16
  - JSONB (flexible document metadata, AI extraction results)
  - Full-text search (backup for Typesense)
  - Window functions (analytics queries)
  - Row-Level Security (multi-tenancy enforcement)
  - Materialized views (pre-computed dashboard metrics)
  - pgvector extension (semantic document similarity search)
  - pg_cron extension (scheduled materialized view refresh, nightly analytics)
  - Partitioning (audit_logs partitioned by month)

**Caching & Real-Time (Redis):**
- Redis 7+ via fred crate
  - Session management (JWT blacklist, refresh token store)
  - Rate limiting (sliding window counters per tenant)
  - Real-time pub/sub (WebSocket event broadcasting across instances)
  - Dashboard metric caching (hot data served from Redis, refreshed every 5 min)
  - Background job queues (reliable job processing)
  - Distributed locking (prevent duplicate integration syncs)
  - Cache invalidation: tenant-scoped keys (tenant:{id}:dashboard:metrics)

**Workflow Orchestration (Temporal):**
- Temporal (durable workflow engine)
  - Tax season workflows (multi-week, survives server restarts)
  - Deadline reminder sequences (30-day, 14-day, 7-day, 1-day timers)
  - Integration sync schedules (cron workflows)
  - Retry policies with exponential backoff
  - Workflow versioning (update logic without breaking in-flight workflows)
  - Visibility into workflow state (admin dashboard)

**Search (Typesense):**
- Typesense (instant search engine)
  - Document search with typo tolerance
  - Client search (name, EIN, address)
  - Sub-millisecond search results
  - Tenant-scoped collections
  - Automatic index sync from PostgreSQL

**Authentication & Security:**
- jsonwebtoken (JWT tokens with RS256)
- argon2 (password hashing, GPU-resistant)
- TLS 1.3 (encryption in transit)
- AES-256-GCM (field-level encryption for Tier 1 data)
- AWS KMS (envelope encryption, per-tenant key management)
- Rate limiting via Redis (per-tenant, per-endpoint)

**API Integration:**
- reqwest (async HTTP client for all integrations)
- oauth2 crate (third-party OAuth flows)

**AI & ML:**
- Claude API (via reqwest)
  - Document categorization (Vision API)
  - Tax planning recommendations
  - Anomaly detection on transactions
  - Client communication drafting
  - Batch processing for nightly analysis

**File Storage:**
- AWS S3 (document storage)
  - Per-tenant bucket prefixes
  - Encryption at rest (SSE-KMS, per-tenant keys)
  - Versioning enabled
  - Lifecycle policies (Glacier after 7 years)
  - CDN via CloudFront (pre-signed URLs for secure downloads)
- tus server (resumable upload endpoint)

**Email (Resend):**
- Resend (transactional email)
  - Better deliverability tracking
  - React Email for template building (shared with frontend team)
  - Webhook for bounce/complaint handling

**Background Jobs:**
- Temporal (long-running workflows, scheduled jobs)
- Redis + Tokio (short-lived async tasks: email sending, webhook processing)

**Logging & Monitoring:**
- tracing (structured logging, spans)
- tracing-subscriber (log aggregation, JSON format)
- Sentry (error tracking, performance monitoring)
- Prometheus (metrics exposition)
- Grafana (dashboards, alerting)
- OpenTelemetry (distributed tracing across services)

### DEVOPS & INFRASTRUCTURE

**Version Control:**
- GitHub with branch protection (PR required for main)
- Conventional commits (feat:, fix:, chore:)
- GitHub Actions (CI/CD)

**CI/CD Pipeline:**

On every PR:
- ✅ cargo check (type checking)
- ✅ cargo clippy (linting, deny warnings)
- ✅ cargo test (unit + integration tests)
- ✅ sqlx prepare --check (verify SQL queries)
- ✅ Frontend: npm run typecheck && npm run lint && npm test
- ✅ Playwright E2E (against preview deployment)
- ✅ OWASP ZAP security scan (baseline)

On merge to main:
- ✅ cargo build --release
- ✅ Build Docker images (multi-stage, ~50MB Rust binary)
- ✅ Push to container registry
- ✅ Deploy to staging → run smoke tests → deploy to production
- ✅ Sentry release tracking

**Containerization:**
- Docker multi-stage builds
- Rust binary: ~50MB minimal image (distroless)
- Next.js: standalone output (~100MB)
- Docker Compose for local development (all services)
