-- Migration 015: Fix RLS inconsistencies + Schema gaps from master spec
-- Fixes: wrong setting name (app.current_tenant_id → app.current_tenant),
--        missing FORCE ROW LEVEL SECURITY, missing tables & columns

-- ============================================================
-- PART 1: Fix RLS policies on workflow tables (migration 008)
-- ============================================================
DROP POLICY IF EXISTS workflow_templates_tenant_isolation ON workflow_templates;
DROP POLICY IF EXISTS workflow_instances_tenant_isolation ON workflow_instances;
DROP POLICY IF EXISTS workflow_step_logs_tenant_isolation ON workflow_step_logs;

ALTER TABLE workflow_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances FORCE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY workflow_templates_tenant_isolation ON workflow_templates
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY workflow_templates_tenant_insert ON workflow_templates
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE POLICY workflow_instances_tenant_isolation ON workflow_instances
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY workflow_instances_tenant_insert ON workflow_instances
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE POLICY workflow_step_logs_tenant_isolation ON workflow_step_logs
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY workflow_step_logs_tenant_insert ON workflow_step_logs
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================
-- PART 2: Fix RLS policies on tasks (migration 009)
-- ============================================================
DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;

ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY tasks_tenant_isolation ON tasks
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY tasks_tenant_insert ON tasks
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================
-- PART 3: Fix RLS policies on compliance_deadlines & expenses (migration 010)
-- ============================================================
DROP POLICY IF EXISTS compliance_deadlines_tenant_isolation ON compliance_deadlines;
DROP POLICY IF EXISTS expenses_tenant_isolation ON expenses;

ALTER TABLE compliance_deadlines FORCE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;

CREATE POLICY compliance_deadlines_tenant_isolation ON compliance_deadlines
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY compliance_deadlines_tenant_insert ON compliance_deadlines
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE POLICY expenses_tenant_isolation ON expenses
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY expenses_tenant_insert ON expenses
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================
-- PART 4: Missing tenant columns (white-label support)
-- ============================================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York';

-- ============================================================
-- PART 5: Missing client columns per spec
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS filing_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS states TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ssn_encrypted BYTEA;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ein_encrypted BYTEA;

-- ============================================================
-- PART 6: Add service_type to time_entries
-- ============================================================
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) NOT NULL DEFAULT 'general';

-- ============================================================
-- PART 7: Payments table (separate from invoice status)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount_cents BIGINT NOT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'credit_card'
        CHECK (method IN ('credit_card', 'ach', 'check', 'cash', 'wire', 'other')),
    stripe_payment_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'completed'
        CHECK (status IN ('completed', 'refunded', 'failed', 'pending')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
CREATE POLICY payments_tenant_isolation ON payments
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY payments_tenant_insert ON payments
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- ============================================================
-- PART 8: Security events table (separate from business audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    user_id UUID,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'critical')),
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_tenant ON security_events(tenant_id, created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON security_events(event_type, created_at DESC);

-- Security events are read-only from app perspective, no RLS needed
-- (admin query endpoint will filter by tenant_id explicitly)

-- ============================================================
-- PART 9: Full-text search index on documents
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN (
    to_tsvector('english', coalesce(filename, '') || ' ' || coalesce(category, '') || ' ' || coalesce(ai_extracted_data::text, ''))
);

-- ============================================================
-- PART 10: Add sent_at and viewed_at to invoices for tracking
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
