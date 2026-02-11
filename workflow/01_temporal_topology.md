# Temporal Workflow Topology

> Source of Truth: MASTER_SPEC.md > Processing Pipelines
> Stack: Temporal (self-hosted), Rust SDK

---

## 1. Temporal Infrastructure

### Cluster Configuration

| Component | Count | Resources |
|---|---|---|
| Temporal Server (frontend) | 2 | 2 vCPU, 4GB RAM |
| Temporal Server (history) | 2 | 2 vCPU, 4GB RAM |
| Temporal Server (matching) | 2 | 1 vCPU, 2GB RAM |
| Temporal Server (worker) | 2 | 1 vCPU, 2GB RAM |
| Temporal DB (PostgreSQL) | 1 (RDS) | db.r6g.large |
| Temporal Visibility (Elasticsearch) | 1 | t3.medium |

### Namespaces

| Namespace | Purpose | Retention |
|---|---|---|
| `cpa-production` | All production workflows | 30 days |
| `cpa-staging` | Staging environment | 7 days |
| `cpa-development` | Local development | 1 day |

### Task Queues

| Queue | Workers | Max Concurrent | Workflows |
|---|---|---|---|
| `document-processing` | 4 | 20 | Document Ingestion |
| `workflow-engine` | 2 | 10 | Tax Season, Custom Workflows |
| `billing` | 2 | 10 | Invoice Generation, Payment |
| `compliance` | 2 | 10 | Deadline Reminders |
| `insights` | 1 | 5 | Nightly AI Insights |
| `integrations` | 2 | 10 | QB Sync, Drive Sync, Stripe |
| `notifications` | 2 | 20 | Email, In-App, Push |

---

## 2. Workflow Definitions

### WF-1: Document Ingestion Pipeline

```
Trigger: File upload complete (tus callback)
Queue: document-processing

Steps:
1. ValidateFile (activity, 30s timeout)
   - Check file type whitelist
   - Check size < 50MB
   - ClamAV virus scan
   → Fail: mark document as "rejected", notify uploader

2. StoreInS3 (activity, 60s timeout)
   - Encrypt with per-tenant key
   - Upload to s3://{tenant_id}/{client_id}/{year}/{filename}
   - Store s3_key in documents table

3. AICategorizaton (activity, 120s timeout, 2 retries)
   - Send to Claude Vision API
   - Extract: category, confidence, date, amount, payer, description
   → confidence > 0.95: auto-accept, status = "verified"
   → confidence 0.75-0.95: status = "needs_review"
   → confidence < 0.75: status = "unverified"
   → API failure: status = "pending", retry later

4. IndexInTypesense (activity, 30s timeout)
   - Index document metadata for full-text search
   - Set typesense_indexed = true

5. GenerateEmbedding (activity, 60s timeout)
   - Generate vector embedding via Claude
   - Store in pgvector column for semantic search

6. SyncToGoogleDrive (activity, 60s timeout, 3 retries)
   - If Google Drive connected: upload copy
   - Folder: {Firm}/{Client}/{Year}/{Category}/
   → Failure: log, do not block pipeline

7. NotifyStakeholders (activity, 30s timeout)
   - WebSocket push to CPA
   - Email to client (if CPA uploaded) or CPA (if client uploaded)

Compensation:
- If step 2+ fails: delete S3 object
- If step 3 fails: mark as "pending" for manual review
- All failures logged to DLQ
```

### WF-2: Tax Season Workflow (Per Client)

```
Trigger: CPA creates workflow instance from template
Queue: workflow-engine

Default 7-Step Template:
1. Document Collection
   - Wait for signal: "all_documents_uploaded"
   - Or: timeout after configurable days → reminder

2. Initial Review
   - Assigned CPA reviews documents
   - Wait for signal: "review_complete"

3. Prepare Draft Return
   - CPA prepares return
   - Wait for signal: "draft_complete"

4. Partner Review (approval gate)
   - Partner reviews draft
   - Wait for signal: "approved" or "rejected"
   → If rejected: return to step 3 with comments

5. Client Review
   - Send return to client for review
   - Wait for signal: "client_approved" or "client_changes"
   → If changes: return to step 3

6. File Return
   - CPA files with IRS/state
   - Wait for signal: "filed"
   - Update compliance calendar

7. Post-Filing
   - Send confirmation to client
   - Archive documents
   - Update client analytics

Features:
- Durable: survives server restarts
- Conditional branching: configurable per template
- Timeout escalation: if step stalls > X days, notify manager
- Audit trail: every state change logged
- Parallel steps: configurable (e.g., federal + state filing)
```

### WF-3: Compliance Deadline Reminders

```
Trigger: Temporal cron schedule (daily at 8 AM per timezone)
Queue: compliance

Steps:
1. QueryUpcomingDeadlines (activity)
   - SELECT deadlines WHERE days_until IN (30, 14, 7, 1, 0, -1)
   - Group by tenant

2. For each deadline:
   a. 30 days: SendReminder("Schedule tax planning call", CPA)
   b. 14 days: SendReminder("Please send outstanding documents", Client, email)
   c. 7 days: SendReminder("Review return draft", CPA)
   d. 1 day: SendUrgentAlert("FINAL DEADLINE ALERT", CPA + Partner, push)
   e. Day of: ShowDashboardBanner(CPA)
   f. Missed (-1 day): EscalateToPartner + LogComplianceViolation + AuditTrail

3. UpdateDeadlineStatus (activity)
   - Mark reminders as sent
   - Update deadline status

Retry: Each notification activity retries 3x with exponential backoff
DLQ: Failed notifications after 3 retries → dead letter queue → manual review
```

### WF-4: Invoice Generation Pipeline

```
Trigger: Manual, threshold ($2,500), monthly cycle, or workflow completion
Queue: billing

Steps:
1. GatherTimeEntries (activity)
   - Query unbilled time entries for client
   - Calculate totals by service type

2. GenerateInvoice (activity)
   - Create invoice record (draft status)
   - Create line items
   - Calculate subtotal, tax, total

3. GeneratePDF (activity, 60s timeout)
   - Render invoice via React-PDF template
   - Store PDF in S3

4. WaitForApproval (signal)
   - If auto-send enabled: skip
   - Otherwise: wait for CPA to review and approve

5. SendInvoice (activity)
   - Email via Resend with PDF attachment
   - Update status to "sent"
   - Record sent_at timestamp

6. TrackPayment (child workflow)
   - Wait for Stripe webhook signal: "payment_received"
   - Or: trigger collection reminders at 15d, 30d, 45d overdue
   - Update invoice status on payment

7. SyncToQuickBooks (activity, 3 retries)
   - If QB connected: create/update invoice in QB
   - Bi-directional sync

Idempotency: Invoice number used as idempotency key
```

### WF-5: Nightly AI Insights

```
Trigger: Temporal cron at 2:00 AM per tenant timezone
Queue: insights

Steps:
1. CalculateMetrics (activity, 5min timeout)
   - Per client: revenue, profitability, growth, engagement, risk
   - Per team: utilization, workload, capacity
   - Aggregate: firm-wide KPIs

2. GenerateInsights (activity, 3min timeout, 2 retries)
   - Send metrics to Claude API
   - Request: upsell opportunities, churn risks, deadline alerts, fee adjustments
   → API failure: use rule-based fallback engine

3. StoreInsights (activity)
   - Store in insights table with tenant_id
   - Mark previous day's insights as stale

4. RefreshMaterializedViews (activity)
   - REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics
   - REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_analytics

5. SendDailyDigest (activity, conditional)
   - If user has daily digest enabled: compile top 5 insights
   - Send via Resend email

6. UpdateRedisCache (activity)
   - Invalidate and refresh dashboard metric cache
   - Pre-warm frequently accessed queries
```

### WF-6: Integration Sync (QuickBooks)

```
Trigger: Temporal cron every 4 hours, or manual trigger
Queue: integrations

Steps:
1. CheckConnection (activity)
   - Verify OAuth token valid
   - If expiring < 30 days: refresh token
   - If refresh fails: notify admin, abort

2. FetchChanges (activity, 5min timeout)
   - QB API: query changes since last_sync_at
   - Transactions, Chart of Accounts, Invoices

3. DeduplicateAndMap (activity)
   - Check for duplicate transactions (hash-based)
   - Map QB schema → internal schema
   - Flag conflicts for manual review

4. UpsertRecords (activity)
   - Upsert mapped records into local DB
   - Maintain QB reference IDs

5. PushChanges (activity, conditional)
   - If bi-directional: push local invoice changes to QB
   - Idempotency keys prevent duplicates

6. UpdateSyncStatus (activity)
   - Update last_sync_at, last_sync_status, records_synced
   - Update integration health dashboard

Retry Policy:
- Initial interval: 1 minute
- Backoff coefficient: 5
- Max interval: 30 minutes
- Max attempts: 3
- Non-retryable: 401 (auth expired), 403 (scope revoked)

DLQ: After max retries → dead letter queue → admin notification
```

---

## 3. Retry & Error Handling

### Global Retry Policy

```rust
RetryPolicy {
    initial_interval: Duration::from_secs(60),      // 1 min
    backoff_coefficient: 5.0,                         // 5x
    maximum_interval: Duration::from_secs(1800),     // 30 min
    maximum_attempts: 3,
    non_retryable_error_types: vec![
        "VALIDATION_ERROR",
        "AUTH_EXPIRED",
        "SCOPE_REVOKED",
        "FILE_REJECTED",
    ],
}
```

### Per-Activity Overrides

| Activity | Timeout | Retries | Backoff | Non-Retryable |
|---|---|---|---|---|
| ValidateFile | 30s | 0 | — | All errors |
| StoreInS3 | 60s | 3 | 2x | — |
| AICategorization | 120s | 2 | 3x | VALIDATION_ERROR |
| SendEmail | 30s | 3 | 5x | INVALID_EMAIL |
| SyncQuickBooks | 300s | 3 | 5x | AUTH_EXPIRED |
| SyncGoogleDrive | 60s | 3 | 5x | AUTH_EXPIRED |
| GeneratePDF | 60s | 2 | 2x | — |
| StripePayment | 30s | 0 | — | All (idempotent via Stripe) |

### Dead Letter Queue

Failed activities after max retries are sent to a DLQ table:

```sql
CREATE TABLE workflow_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    workflow_id VARCHAR(255) NOT NULL,
    workflow_type VARCHAR(100) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    payload JSONB NOT NULL,
    retry_count INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'retrying', 'resolved', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

DLQ Processing:
- Admin dashboard shows pending DLQ items
- Manual retry button per item
- Auto-abandon after 7 days if unresolved
- Alerting: Slack/email notification on new DLQ entries

---

## 4. Workflow Versioning

### Strategy: Patching + Task Queue Versioning

```rust
// Version 1 of document ingestion
#[workflow]
async fn document_ingestion_v1(ctx: WfContext, input: DocInput) -> Result<()> {
    // Original implementation
}

// Version 2 adds embedding generation
#[workflow]
async fn document_ingestion_v2(ctx: WfContext, input: DocInput) -> Result<()> {
    // Updated implementation with embedding step
    if ctx.patched("add-embedding-step") {
        generate_embedding(ctx, &doc).await?;
    }
}
```

### Versioning Rules

1. **Non-breaking changes** (add optional step): Use `patched()` API
2. **Breaking changes** (change step order, remove step): New workflow type + task queue
3. **Running workflows**: Always complete on their original version
4. **New workflows**: Start on latest version
5. **Rollback**: Deploy previous worker version alongside new one

---

## 5. Monitoring & Alerting

| Metric | Alert Threshold | Channel |
|---|---|---|
| Workflow failure rate | > 5% in 15 min | PagerDuty |
| Activity timeout rate | > 10% in 15 min | Slack |
| DLQ depth | > 10 items | Email + Slack |
| Workflow latency p99 | > 5 min (doc ingestion) | Slack |
| Cron job missed | Any missed execution | PagerDuty |
| Worker heartbeat | No heartbeat > 2 min | PagerDuty |
| Queue backlog | > 100 pending tasks | Slack |

### Runbook References

- **Workflow stuck**: Check Temporal UI → workflow history → identify failed activity → check logs → retry or fix
- **DLQ overflow**: Check DLQ dashboard → categorize errors → batch retry or abandon
- **Cron missed**: Check Temporal schedules → verify worker health → manual trigger if needed
- **Worker crash**: Check pod logs → restart → verify workflow recovery
