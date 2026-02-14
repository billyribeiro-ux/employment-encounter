-- Migration 016: Security hardening
-- Ensures security_events and payments tables exist, adds missing performance
-- indexes across the schema, enables RLS on new tables, and backfills the
-- sent_at column on invoices.

-- ============================================================
-- PART 1: security_events table
-- ============================================================
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 2: payments table
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    method VARCHAR(50) NOT NULL,
    stripe_payment_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 3: Performance indexes for frequently queried columns
-- ============================================================

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant_status ON clients(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tenant_name ON clients(tenant_id, name) WHERE deleted_at IS NULL;

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_tenant_client ON documents(tenant_id, client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_tenant_category ON documents(tenant_id, category) WHERE deleted_at IS NULL;

-- time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant_client ON time_entries(tenant_id, client_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_tenant_date ON time_entries(tenant_id, date);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_client ON invoices(tenant_id, client_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status ON tasks(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_assigned ON tasks(tenant_id, assigned_to);

-- workflows
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_status ON workflow_instances(tenant_id, status);

-- compliance_deadlines
CREATE INDEX IF NOT EXISTS idx_compliance_tenant_due ON compliance_deadlines(tenant_id, due_date);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_tenant_client ON messages(tenant_id, client_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(tenant_id, user_id, is_read) WHERE is_read = false;

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(tenant_id, resource_id);

-- security_events
CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON security_events(tenant_id, created_at);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_tenant_invoice ON payments(tenant_id, invoice_id);

-- users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_status ON users(tenant_id, status);

-- expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_client ON expenses(tenant_id, client_id);

-- ============================================================
-- PART 4: Row-Level Security for new tables
-- ============================================================

-- RLS for security_events
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_events_tenant_isolation ON security_events;
CREATE POLICY security_events_tenant_isolation ON security_events
    USING (tenant_id::TEXT = current_setting('app.current_tenant', true));

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
CREATE POLICY payments_tenant_isolation ON payments
    USING (tenant_id::TEXT = current_setting('app.current_tenant', true));

-- ============================================================
-- PART 5: Backfill sent_at column on invoices
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
