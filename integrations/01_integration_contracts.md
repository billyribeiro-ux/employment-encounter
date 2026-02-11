# Integration Contracts & Architecture

> Source of Truth: MASTER_SPEC.md > Pillar 6: Integrations Hub
> MVP Integrations: QuickBooks Online (Priority 1), Google Drive (Priority 1), Stripe (Priority 1)

---

## 1. Integration Framework Architecture

```
┌─────────────────────────────────────────────────────┐
│                Integration Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ QB       │  │ GDrive   │  │ Stripe   │          │
│  │ Adapter  │  │ Adapter  │  │ Adapter  │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │              │              │                │
│  ┌────▼──────────────▼──────────────▼────┐          │
│  │         Integration Service            │          │
│  │  - OAuth2 flow management              │          │
│  │  - Token encryption/refresh            │          │
│  │  - Data mapping layer                  │          │
│  │  - Retry + DLQ                         │          │
│  │  - Health monitoring                   │          │
│  └────────────────┬──────────────────────┘          │
│                   │                                  │
│  ┌────────────────▼──────────────────────┐          │
│  │         Webhook Ingestion              │          │
│  │  - Signature verification              │          │
│  │  - Replay protection                   │          │
│  │  - Idempotent processing               │          │
│  └───────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## 2. QuickBooks Online

### OAuth2 Flow

| Parameter | Value |
|---|---|
| Auth URL | `https://appcenter.intuit.com/connect/oauth2` |
| Token URL | `https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer` |
| Scopes | `com.intuit.quickbooks.accounting` |
| Token Storage | AES-256-GCM encrypted in `integration_connections` |
| Refresh Strategy | Auto-refresh 30 days before expiry via Temporal cron |

### Sync Contract

| Direction | Data | Frequency | Method |
|---|---|---|---|
| QB → Platform | Transactions (3yr history) | Initial sync | Batch pull |
| QB → Platform | New/changed transactions | Every 4 hours | Temporal cron |
| QB → Platform | Chart of Accounts | Initial + on change | Pull |
| QB → Platform | P&L, Balance Sheet | Initial + daily | Pull |
| Platform → QB | Invoices | On create/update | Push |
| Platform → QB | Payments | On payment received | Push |

### Data Mapping

```yaml
quickbooks_transaction:
  id → external_ref_id
  TxnDate → date
  TotalAmt → amount
  AccountRef.value → account_id (mapped to local CoA)
  Line[].Description → description
  Line[].Amount → line_amount
  MetaData.LastUpdatedTime → external_updated_at

quickbooks_invoice:
  platform_invoice.id → DocNumber (custom field)
  platform_invoice.total → TotalAmt
  platform_invoice.client → CustomerRef (mapped)
  platform_invoice.line_items → Line[]
  platform_invoice.due_date → DueDate
```

### Duplicate Detection

- Hash: `SHA256(tenant_id + provider + external_ref_id + date + amount)`
- Check before insert; skip if hash exists
- Log skipped duplicates for audit

### Error Handling

| Error | Action |
|---|---|
| 401 Unauthorized | Refresh token → retry → if fails, notify admin |
| 403 Forbidden | Check scopes → notify admin to reconnect |
| 429 Rate Limited | Exponential backoff (Temporal retry policy) |
| 500 Server Error | Retry 3x → DLQ |
| Network timeout | Retry 3x → DLQ |

---

## 3. Google Drive

### OAuth2 Flow

| Parameter | Value |
|---|---|
| Auth URL | `https://accounts.google.com/o/oauth2/v2/auth` |
| Token URL | `https://oauth2.googleapis.com/token` |
| Scopes | `https://www.googleapis.com/auth/drive.file` |
| Token Storage | AES-256-GCM encrypted |
| Refresh Strategy | Auto-refresh on 401 response |

### Sync Contract

| Direction | Data | Trigger | Method |
|---|---|---|---|
| Platform → Drive | Uploaded documents | On document upload complete | Async push |
| Platform → Drive | Invoice PDFs | On invoice generation | Async push |

### Folder Structure

```
{Firm Name}/
├── {Client Name}/
│   ├── 2026/
│   │   ├── W-2/
│   │   ├── 1099/
│   │   ├── Receipts/
│   │   ├── Returns/
│   │   └── Invoices/
│   └── 2025/
│       └── ...
└── Firm Documents/
    ├── Templates/
    └── Reports/
```

### Behavior

- Platform is source of truth; Drive is backup copy
- If Drive sync fails: log error, do not block document pipeline
- Retry 3x with exponential backoff
- If Drive disconnected: queue uploads, sync when reconnected

---

## 4. Stripe

### Integration Type: Direct API + Webhooks

| Parameter | Value |
|---|---|
| API Version | `2024-12-18.acacia` (latest stable) |
| Auth | API key (encrypted in env) |
| Webhook Secret | Per-environment, verified via signature |
| Idempotency | `Idempotency-Key` header on all mutations |

### Payment Flow

```
1. Client clicks "Pay Now" on invoice
2. Frontend calls POST /api/v1/payments/intent
3. Backend creates Stripe PaymentIntent (idempotency key = invoice_id)
4. Frontend renders Stripe Elements (card or ACH)
5. Client completes payment
6. Stripe sends webhook: payment_intent.succeeded
7. Backend verifies webhook signature
8. Backend updates invoice status to "paid"
9. If QB connected: sync payment to QuickBooks
```

### Webhook Events Handled

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Mark invoice paid, update dashboard |
| `payment_intent.payment_failed` | Log failure, notify CPA |
| `charge.refunded` | Update invoice, create credit note |
| `charge.dispute.created` | Mark invoice disputed, notify admin |
| `customer.subscription.updated` | Update tenant tier |
| `customer.subscription.deleted` | Trigger tenant offboarding |

### Webhook Security

```rust
// Verify Stripe webhook signature
fn verify_stripe_signature(payload: &[u8], sig_header: &str, secret: &str) -> Result<()> {
    let event = stripe::Webhook::construct_event(payload, sig_header, secret)?;
    // Process event...
}

// Idempotent processing
// Key: stripe_event:{event_id}
// Check Redis before processing; skip if already processed
```

---

## 5. Integration Health Dashboard

### Metrics per Integration

| Metric | Display |
|---|---|
| Connection Status | Connected / Disconnected / Error |
| Last Sync Time | Timestamp + relative ("2 hours ago") |
| Records Synced (last run) | Count |
| Error Count (last 24h) | Count with trend |
| Token Expiry | Date + days remaining |
| Sync Frequency | "Every 4 hours" / "Real-time" |

### Health Check Schedule

- Every 5 minutes: verify token validity (without API call)
- Every 15 minutes: lightweight API ping
- Every 4 hours: full sync cycle (QB)
- On demand: manual sync trigger from dashboard

### Alert Conditions

| Condition | Severity | Action |
|---|---|---|
| Token expired | Critical | Email admin, dashboard banner |
| 3 consecutive sync failures | High | Email admin, Slack notification |
| Sync latency > 2x normal | Medium | Dashboard warning |
| Webhook delivery failure | High | Check endpoint, verify signature |

---

## 6. Phase 2 Integration Backlog

| Integration | Priority | Phase | Prep Work in MVP |
|---|---|---|---|
| Plaid (bank sync) | 2 | Phase 2 | Build integration framework, bank sync pipeline skeleton |
| DocuSign (e-signature) | 2 | Phase 2 | Document linking architecture supports attachments |
| Email (Gmail/Outlook) | 2 | Phase 2 | Message threading model supports email import |
| Calendar (Google/Outlook) | 2 | Phase 2 | Compliance calendar supports external sync |
| Tax Software Export | 2 | Phase 2 | Report export framework supports custom formats |
| ADP/Gusto (Payroll) | 3 | Phase 3 | No prep needed in MVP |
