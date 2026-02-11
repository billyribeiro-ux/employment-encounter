# Database Schema & Migration Plan

> Source of Truth: MASTER_SPEC.md
> Stack: PostgreSQL 16, SQLx 0.8+ (compile-time verified), pgvector, pg_cron, uuid-ossp

---

## 1. Migration Order

| # | Migration | Tables | Dependencies |
|---|---|---|---|
| 001 | tenants | tenants, tenant_settings | None |
| 002 | users_roles | users, roles, permissions, user_roles | 001 |
| 003 | clients | clients, client_contacts | 001, 002 |
| 004 | documents | documents, document_versions | 001, 003 |
| 005 | workflows | workflow_templates, workflow_instances, workflow_steps | 001, 003 |
| 006 | tasks | tasks | 001, 002, 003 |
| 007 | time_entries | time_entries | 001, 002, 003 |
| 008 | invoices | invoices, invoice_line_items | 001, 003, 007 |
| 009 | integrations | integration_connections, integration_sync_logs | 001 |
| 010 | notifications | notifications, notification_preferences | 001, 002 |
| 011 | audit_logs | audit_logs (partitioned by month) | 001 |
| 012 | materialized_views | mv_dashboard_metrics, mv_client_analytics, mv_utilization | 003, 007, 008 |
| 013 | compliance | compliance_deadlines | 001, 003 |
| 014 | messages | messages, message_attachments | 001, 002, 003 |
| 015 | expenses | expenses | 001, 002, 003 |

---

## 2. Core Table Schemas

### tenants

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'solo' CHECK (tier IN ('solo', 'growing', 'scale', 'demo')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'offboarding', 'deleted')),
    settings JSONB NOT NULL DEFAULT '{}',
    stripe_customer_id VARCHAR(255),
    kms_key_id VARCHAR(255) NOT NULL,
    onboarding_completed_at TIMESTAMPTZ,
    offboarding_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('staff_accountant', 'senior_accountant', 'manager', 'partner', 'admin', 'client')),
    mfa_secret_encrypted BYTEA,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'deleted')),
    last_login_at TIMESTAMPTZ,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### clients

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    fiscal_year_end VARCHAR(20) NOT NULL DEFAULT 'Calendar',
    tax_id_encrypted BYTEA,
    tax_id_last4 VARCHAR(4),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'archived')),
    assigned_cpa_id UUID REFERENCES users(id),
    risk_score SMALLINT DEFAULT 0,
    engagement_score SMALLINT DEFAULT 0,
    churn_probability DECIMAL(5,4) DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_assigned_cpa ON clients(assigned_cpa_id);
CREATE INDEX idx_clients_status ON clients(tenant_id, status);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_tenant_isolation ON clients
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### documents

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    s3_key VARCHAR(1000) NOT NULL,
    category VARCHAR(100),
    ai_confidence DECIMAL(5,4),
    ai_extracted_data JSONB DEFAULT '{}',
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'needs_review', 'unverified', 'rejected')),
    tax_year SMALLINT,
    version INT NOT NULL DEFAULT 1,
    embedding VECTOR(1536),
    typesense_indexed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_documents_tenant_client ON documents(tenant_id, client_id);
CREATE INDEX idx_documents_category ON documents(tenant_id, category);
CREATE INDEX idx_documents_verification ON documents(tenant_id, verification_status);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_tenant_isolation ON documents
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### time_entries

```sql
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
    rate DECIMAL(10,2) NOT NULL CHECK (rate >= 0),
    amount DECIMAL(10,2) GENERATED ALWAYS AS (hours * rate) STORED,
    description TEXT NOT NULL,
    service_type VARCHAR(100),
    billable BOOLEAN NOT NULL DEFAULT TRUE,
    invoiced BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_id UUID REFERENCES invoices(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_time_entries_tenant_user ON time_entries(tenant_id, user_id);
CREATE INDEX idx_time_entries_tenant_client ON time_entries(tenant_id, client_id);
CREATE INDEX idx_time_entries_date ON time_entries(tenant_id, date);
CREATE INDEX idx_time_entries_uninvoiced ON time_entries(tenant_id, client_id) WHERE invoiced = FALSE AND billable = TRUE;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_entries_tenant_isolation ON time_entries
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### invoices

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'disputed', 'voided')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('hourly', 'flat_fee', 'hybrid')),
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);
CREATE INDEX idx_invoices_tenant_client ON invoices(tenant_id, client_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(tenant_id, due_date) WHERE status IN ('sent', 'viewed', 'overdue');
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_isolation ON invoices
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### audit_logs (partitioned)

```sql
CREATE TABLE audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for each month
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- ... (auto-created by pg_cron job)

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### integration_connections

```sql
CREATE TABLE integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('quickbooks', 'google_drive', 'stripe')),
    status VARCHAR(20) NOT NULL DEFAULT 'connected'
        CHECK (status IN ('connected', 'disconnected', 'error', 'refreshing')),
    access_token_encrypted BYTEA NOT NULL,
    refresh_token_encrypted BYTEA,
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20),
    last_sync_records INT DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_connections_tenant_isolation ON integration_connections
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

---

## 3. RLS Policy Matrix

**Every tenant-scoped table** has RLS enabled with the same pattern:

```sql
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;

CREATE POLICY {table_name}_tenant_isolation ON {table_name}
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY {table_name}_tenant_insert ON {table_name}
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
```

**Fail-safe**: If `app.current_tenant` is not set, `current_setting()` returns empty string which cannot match any UUID, resulting in zero rows.

| Table | RLS Enabled | FORCE RLS | Fail-Safe Verified |
|---|---|---|---|
| users | Yes | Yes | Yes |
| clients | Yes | Yes | Yes |
| client_contacts | Yes | Yes | Yes |
| documents | Yes | Yes | Yes |
| document_versions | Yes | Yes | Yes |
| workflow_templates | Yes | Yes | Yes |
| workflow_instances | Yes | Yes | Yes |
| workflow_steps | Yes | Yes | Yes |
| tasks | Yes | Yes | Yes |
| time_entries | Yes | Yes | Yes |
| invoices | Yes | Yes | Yes |
| invoice_line_items | Yes | Yes | Yes |
| messages | Yes | Yes | Yes |
| message_attachments | Yes | Yes | Yes |
| notifications | Yes | Yes | Yes |
| notification_preferences | Yes | Yes | Yes |
| integration_connections | Yes | Yes | Yes |
| integration_sync_logs | Yes | Yes | Yes |
| audit_logs | Yes | Yes | Yes |
| compliance_deadlines | Yes | Yes | Yes |
| expenses | Yes | Yes | Yes |

**Non-tenant tables** (no RLS): `tenants`, `roles`, `permissions`

---

## 4. Data Classification & Encryption

| Tier | Data | Storage | Access |
|---|---|---|---|
| Tier 1 (Critical) | SSN, EIN, bank accounts, tax returns | AES-256-GCM per-tenant key (KMS envelope) | Partner/Admin only, masked for others |
| Tier 2 (Sensitive) | Financial data, invoices, time entries | Encrypted at rest (PG TDE or volume) | Role-based (Senior+) |
| Tier 3 (Internal) | Client names, contacts, workflow data | Encrypted at rest | All authenticated users (tenant-scoped) |
| Tier 4 (Public) | Firm name, pricing tiers | Standard storage | Public |

### Encryption Implementation

```sql
-- Tier 1 fields stored as BYTEA (encrypted by application layer)
-- Application encrypts with AES-256-GCM using per-tenant DEK
-- DEK encrypted by AWS KMS CMK (envelope encryption)
-- Decryption only in application layer, never in SQL queries
-- Last 4 digits stored separately for display (tax_id_last4)
```

---

## 5. Materialized Views

```sql
-- Dashboard metrics (refreshed every 5 min via pg_cron)
CREATE MATERIALIZED VIEW mv_dashboard_metrics AS
SELECT
    t.id AS tenant_id,
    COUNT(DISTINCT c.id) AS active_clients,
    COALESCE(SUM(CASE WHEN i.paid_at >= date_trunc('year', NOW()) THEN i.total END), 0) AS revenue_ytd,
    COALESCE(SUM(CASE WHEN i.status IN ('sent', 'viewed', 'overdue') THEN i.total - i.amount_paid END), 0) AS outstanding_ar,
    COALESCE(AVG(CASE WHEN te.date >= NOW() - INTERVAL '30 days' THEN te.hours END), 0) AS avg_daily_hours
FROM tenants t
LEFT JOIN clients c ON c.tenant_id = t.id AND c.status = 'active'
LEFT JOIN invoices i ON i.tenant_id = t.id
LEFT JOIN time_entries te ON te.tenant_id = t.id
GROUP BY t.id;

CREATE UNIQUE INDEX ON mv_dashboard_metrics(tenant_id);

-- Refresh schedule
SELECT cron.schedule('refresh-dashboard-metrics', '*/5 * * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics');
```

---

## 6. Backup & Recovery

| Component | Strategy | Frequency | Retention | RTO | RPO |
|---|---|---|---|---|---|
| PostgreSQL | AWS RDS automated backups + WAL archiving | Continuous | 35 days | < 4 hours | < 1 hour |
| Point-in-time recovery | WAL replay to any second | Continuous | 35 days | < 1 hour | < 5 min |
| Cross-region replica | Async streaming replication | Continuous | Real-time | < 30 min | < 1 min |
| S3 documents | S3 versioning + cross-region replication | Continuous | Indefinite | < 1 hour | 0 |
| Redis | RDB snapshots + AOF | Every 5 min | 7 days | < 15 min | < 5 min |
