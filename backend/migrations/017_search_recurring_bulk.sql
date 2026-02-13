-- Migration 017: Full-text search indexes, recurring invoices, soft delete columns
-- Supports: global search, recurring invoices, bulk operations, soft delete/restore

-- ==========================================
-- 1. Full-Text Search Indexes (GIN)
-- ==========================================

-- Clients: search by name, business_type (email/company stored in contacts)
CREATE INDEX IF NOT EXISTS idx_clients_fts ON clients
    USING GIN (to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(business_type, '')));

-- Client contacts: search by name, email
CREATE INDEX IF NOT EXISTS idx_client_contacts_fts ON client_contacts
    USING GIN (to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')));

-- Documents: search by filename, category
CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents
    USING GIN (to_tsvector('english', COALESCE(filename, '') || ' ' || COALESCE(category, '')));

-- Invoices: search by invoice_number, notes
CREATE INDEX IF NOT EXISTS idx_invoices_fts ON invoices
    USING GIN (to_tsvector('english', COALESCE(invoice_number, '') || ' ' || COALESCE(notes, '')));

-- Tasks: search by title, description
CREATE INDEX IF NOT EXISTS idx_tasks_fts ON tasks
    USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- ==========================================
-- 2. Soft Delete Columns (where missing)
-- ==========================================

-- Invoices: add deleted_at
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Tasks: add deleted_at
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Partial indexes for soft-deleted records
CREATE INDEX IF NOT EXISTS idx_invoices_active ON invoices (tenant_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks (tenant_id, created_at DESC) WHERE deleted_at IS NULL;

-- ==========================================
-- 3. Recurring Invoices Table
-- ==========================================

CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    schedule VARCHAR(20) NOT NULL CHECK (schedule IN ('weekly', 'monthly', 'quarterly', 'annually')),
    next_issue_date DATE NOT NULL,
    -- Template data
    notes TEXT,
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    -- Tracking
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_issued_at TIMESTAMPTZ,
    invoices_generated INT NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_tenant ON recurring_invoices (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next ON recurring_invoices (next_issue_date) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client ON recurring_invoices (tenant_id, client_id) WHERE deleted_at IS NULL;

-- RLS for recurring_invoices
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recurring_invoices_tenant_isolation ON recurring_invoices;
CREATE POLICY recurring_invoices_tenant_isolation ON recurring_invoices
    USING (tenant_id::text = current_setting('app.current_tenant', true));

DROP POLICY IF EXISTS recurring_invoices_tenant_insert ON recurring_invoices;
CREATE POLICY recurring_invoices_tenant_insert ON recurring_invoices
    FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
