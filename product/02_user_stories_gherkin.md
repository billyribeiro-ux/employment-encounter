# User Stories & Gherkin Scenarios

> Source of Truth: MASTER_SPEC.md
> Format: As a [role], I want [action], so that [benefit]

---

## 1. Client Management

### US-CM-001: Create Client
**As a** CPA, **I want** to create a new client record with profile, contacts, and business type, **so that** I can manage their engagement.

```gherkin
Feature: Client Creation
  Scenario: CPA creates a new client
    Given I am logged in as a Senior Accountant
    When I navigate to Clients and click "New Client"
    And I fill in name "John Smith", type "1040", fiscal year "Calendar"
    And I enter SSN "123-45-6789"
    And I click Save
    Then the client is created with status "Active"
    And the SSN is stored encrypted (AES-256-GCM)
    And the SSN displays as "***-**-6789" in the UI
    And an audit log entry is created for "client.created"

  Scenario: Staff Accountant cannot see SSN
    Given I am logged in as a Staff Accountant
    When I view client "John Smith"
    Then the SSN field shows "***-**-****"

  Scenario: Tenant isolation on client creation
    Given I am logged in as a user in Tenant A
    When I create client "Jane Doe"
    Then Tenant B users cannot see "Jane Doe" in their client list
```

### US-CM-002: Client Search
**As a** CPA, **I want** to search clients by name, EIN, or address with typo tolerance, **so that** I can quickly find any client.

```gherkin
Feature: Client Search
  Scenario: Search with typo tolerance
    Given client "Johnson & Associates" exists
    When I search for "Jonson Associates"
    Then "Johnson & Associates" appears in results within 50ms

  Scenario: Search by EIN
    Given client with EIN "12-3456789" exists
    When I search for "123456789"
    Then the matching client appears in results
```

### US-CM-003: Client Portal Access
**As a** client, **I want** to log into my portal and see my tax status, documents needed, and deadlines, **so that** I stay informed without emailing my CPA.

```gherkin
Feature: Client Portal
  Scenario: Client views dashboard
    Given I am logged in as a Client
    When I view my portal dashboard
    Then I see my tax filing status
    And I see a list of documents still needed
    And I see upcoming deadlines
    And I see my current balance

  Scenario: Client cannot see other clients
    Given I am logged in as Client "John Smith"
    When I attempt to access Client "Jane Doe" data via API
    Then I receive a 403 Forbidden response

  Scenario: Client uploads document
    Given I am logged in as a Client
    When I drag a W-2 PDF onto the upload area
    Then the file uploads via tus protocol
    And AI categorizes it as "W-2 Form"
    And my CPA receives a notification
```

---

## 2. Document AI

### US-DOC-001: Document Upload with AI Categorization
**As a** CPA or client, **I want** to upload documents that are automatically categorized by AI, **so that** I don't waste time manually sorting files.

```gherkin
Feature: Document AI Categorization
  Scenario: High confidence auto-accept
    Given I upload a clear W-2 form PDF
    When the AI processes the document
    Then the confidence score is > 95%
    And the document is auto-categorized as "W-2 Form"
    And extracted data includes: date, amount, payer name
    And status is "verified"

  Scenario: Medium confidence flagged for review
    Given I upload a blurry receipt image
    When the AI processes the document
    Then the confidence score is between 75-95%
    And the document status is "needs_review"
    And the CPA sees it in their review queue

  Scenario: Low confidence requires manual verification
    Given I upload an ambiguous document
    When the AI processes the document
    Then the confidence score is < 75%
    And the document status is "unverified"
    And the CPA must manually categorize it

  Scenario: CPA overrides AI categorization
    Given a document is categorized as "1099-MISC"
    When the CPA changes it to "1099-NEC"
    Then the category updates to "1099-NEC"
    And the override is logged for AI feedback loop

  Scenario: Resumable upload on connection drop
    Given I am uploading a 40MB PDF
    And the connection drops at 50%
    When the connection restores
    Then the upload resumes from 50% (not from 0%)
    And the file completes successfully
```

### US-DOC-002: Document Search
**As a** CPA, **I want** to search documents using natural language, **so that** I can find any document instantly.

```gherkin
Feature: Document Search
  Scenario: Natural language search
    Given multiple documents exist for various clients
    When I search "W-2s for 2025"
    Then all W-2 documents for tax year 2025 are returned
    And results are filtered by my tenant

  Scenario: Semantic similarity search
    Given I am viewing a 1099-NEC document
    When I click "Find similar documents"
    Then other 1099-NEC documents are returned ranked by similarity
```

---

## 3. Workflow Automation

### US-WF-001: Tax Season Workflow
**As a** CPA, **I want** to run a 7-step tax season workflow per client, **so that** nothing falls through the cracks.

```gherkin
Feature: Tax Season Workflow
  Scenario: Full workflow execution
    Given I create a "Tax Season 2026" workflow for client "John Smith"
    When all required documents are uploaded
    Then the workflow auto-advances from Step 1 to Step 2
    And the CPA is notified "All documents received for John Smith"

  Scenario: Partner review gate
    Given the workflow is at Step 4 "Partner Review"
    When the Partner clicks "Request Changes" with comment "Check Schedule C"
    Then the workflow returns to Step 3 "Prepare Draft Return"
    And the CPA is notified with the Partner's comment

  Scenario: Workflow survives server restart
    Given a workflow is at Step 3
    When the server restarts
    Then the workflow resumes at Step 3 (Temporal durability)
    And no data is lost

  Scenario: Custom workflow creation
    Given I am a Manager
    When I create a custom workflow with 4 steps
    And I set conditional branching on Step 2
    And I assign Step 3 to "Sarah"
    And I save the template
    Then the template is available for reuse
    And I can clone it for different client types
```

### US-WF-002: Deadline Compliance
**As a** CPA firm, **I want** automatic deadline tracking with escalation, **so that** we never miss a filing deadline.

```gherkin
Feature: Deadline Compliance
  Scenario: Auto-generate compliance calendar
    Given I add client "Tech Inc" with filing type "1120-S"
    Then deadlines are auto-generated: Mar 15 filing, Sep 15 extended
    And quarterly estimated tax payment dates are added
    And state-specific deadlines are included for client's state(s)

  Scenario: Reminder sequence fires correctly
    Given a deadline is 30 days away
    Then the CPA receives "Schedule tax planning call" reminder
    When the deadline is 14 days away
    Then the client receives "Please send outstanding documents" email
    When the deadline is 7 days away
    Then the CPA receives "Review return draft" alert
    When the deadline is 1 day away
    Then a push notification "FINAL DEADLINE ALERT" is sent
    When the deadline day arrives
    Then a dashboard banner appears

  Scenario: Missed deadline escalation
    Given a deadline has passed without filing
    Then the partner is auto-notified
    And the missed deadline is logged in the audit trail
    And it appears in the compliance report
    And E&O insurance documentation is captured
```

---

## 4. Dashboard & Analytics

### US-DASH-001: Firm Dashboard
**As a** Partner/Admin, **I want** to see real-time firm metrics on a dashboard, **so that** I know exactly how the business is performing.

```gherkin
Feature: Firm Dashboard
  Scenario: Dashboard loads with key metrics
    Given I am logged in as a Partner
    When I navigate to the Dashboard
    Then I see Revenue YTD with comparison to last year
    And I see MoM growth percentage
    And I see active client count with trend
    And I see team utilization percentage
    And I see outstanding invoice total
    And I see AI Insights summary (top 3 action items)

  Scenario: Charts render with animations
    Given the dashboard is loading
    When the Revenue Trend chart renders
    Then it animates with a draw effect over 800ms
    And hovering shows tooltips with exact amounts
    And clicking filters by service type

  Scenario: Real-time updates via SSE
    Given I am viewing the dashboard
    When a new invoice is paid
    Then the Revenue YTD card updates without page refresh
    And the Outstanding Invoices card decreases
```

### US-DASH-002: AI Insights
**As a** CPA, **I want** AI-generated actionable recommendations, **so that** I can proactively serve clients and grow revenue.

```gherkin
Feature: AI Insights
  Scenario: Nightly insights generation
    Given the nightly Temporal cron runs at 2 AM
    When insights are generated for my tenant
    Then I see recommendations like "John Smith: discuss Section 179 deduction"
    And each insight has an accept/snooze/dismiss action

  Scenario: AI fallback on API failure
    Given the Claude API is unavailable
    When the nightly insights job runs
    Then rule-based fallback recommendations are generated
    And the CPA still sees actionable insights

  Scenario: Insight feedback loop
    Given I accept an insight "Increase fees for Tech Inc"
    When I take action and log the outcome
    Then the ML model receives positive feedback for similar recommendations
```

---

## 5. Time Tracking & Invoicing

### US-TIME-001: Time Entry
**As a** CPA, **I want** to log billable hours with a timer or manual entry, **so that** all work is captured for invoicing.

```gherkin
Feature: Time Tracking
  Scenario: Manual time entry
    Given I select client "Tech Inc"
    When I enter 2.5 hours at $200/hr for "Tax return review"
    And I mark it as billable
    And I click Save
    Then the time entry is stored
    And utilization metrics update in Redis cache

  Scenario: Timer with pause/resume
    Given I start a timer for client "ABC Corp"
    When I pause after 45 minutes
    And I resume after a break
    And I stop after 30 more minutes
    Then a time entry of 1.25 hours is created

  Scenario: Timer running too long notification
    Given a timer has been running for 4 hours
    Then a desktop notification appears "Timer still running for ABC Corp"
```

### US-INV-001: Invoice Generation and Payment
**As a** CPA, **I want** invoices auto-generated from time entries and paid via Stripe, **so that** billing is effortless.

```gherkin
Feature: Invoicing
  Scenario: Auto-generate at threshold
    Given the billing threshold is $2,500
    And accumulated unbilled time for "Tech Inc" reaches $2,600
    Then a draft invoice is auto-generated for $2,600
    And the CPA is notified to review

  Scenario: Client pays via Stripe
    Given an invoice for $1,500 is sent to client
    When the client clicks "Pay Now" in the portal
    And completes Stripe checkout (credit card)
    Then the invoice status changes to "Paid"
    And the dashboard revenue metric updates
    And if QB connected, the payment syncs to QuickBooks

  Scenario: Duplicate webhook prevention
    Given Stripe sends a payment webhook
    And the same webhook is sent again (retry)
    Then only one payment is recorded (idempotency key check)

  Scenario: Automated collection reminders
    Given an invoice is unpaid for 15 days
    Then an automatic reminder email is sent
    When unpaid for 30 days, a firmer reminder is sent
    When unpaid for 45 days, a final notice is sent
```

---

## 6. Notifications

### US-NOTIF-001: Multi-Channel Notifications
**As a** user, **I want** to receive notifications in-app, via email, and push, **so that** I never miss important events.

```gherkin
Feature: Notifications
  Scenario: In-app notification
    Given a new document is uploaded for my client
    Then my notification bell shows an unread count
    And clicking it shows "New W-2 received for John Smith"

  Scenario: Email notification
    Given a deadline is 14 days away
    Then the client receives an email "Please send outstanding documents"
    And if email fails, the CPA is notified to call the client

  Scenario: Notification preferences
    Given I set email notifications to "Daily digest only"
    When individual events occur during the day
    Then I receive one digest email at end of day (not individual emails)
    But in-app notifications still appear in real-time
```

---

## 7. Integrations

### US-INT-001: QuickBooks Sync
**As a** CPA, **I want** QuickBooks to sync automatically, **so that** financial data is always current.

```gherkin
Feature: QuickBooks Integration
  Scenario: Initial historical sync
    Given I connect my QB account via OAuth
    When the initial sync runs
    Then up to 3 years of transactions, CoA, P&L, BS are pulled
    And data appears in the dashboard with a QB badge
    And duplicate transactions are detected and skipped

  Scenario: Ongoing sync every 4 hours
    Given QB is connected
    When 4 hours have passed since last sync
    Then new/changed data is pulled via Temporal cron
    And the integration health dashboard shows "Last sync: [time]"

  Scenario: Sync failure with retry
    Given a QB sync fails due to API error
    Then it retries with exponential backoff (1min, 5min, 30min)
    After 3 failures, the CPA is notified via email
    And the health dashboard shows status "Error"

  Scenario: Token refresh
    Given the QB OAuth token is expiring in 30 days
    Then the system auto-refreshes using the refresh token
    If the refresh token is also expired
    Then the CPA is notified to reconnect QB
```

---

## 8. Compliance & Audit

### US-COMP-001: Audit Trail
**As a** firm administrator, **I want** a complete audit trail of all actions, **so that** we meet IRS Pub 4557 and FTC Safeguards requirements.

```gherkin
Feature: Audit Trail
  Scenario: Document access logging
    Given CPA "Sarah" views client "John Smith" tax return
    Then an audit entry is created: user="Sarah", action="document.viewed", client="John Smith", timestamp=now
    And the entry includes tenant_id

  Scenario: Tier 1 data never logged
    Given a request processes SSN "123-45-6789"
    When the request is logged
    Then the SSN does not appear in any log output
    And the log shows "[REDACTED]" for sensitive fields

  Scenario: Tenant data isolation in audit
    Given Tenant A has audit entries
    When Tenant B queries audit_logs
    Then zero rows are returned (RLS enforced)
```
