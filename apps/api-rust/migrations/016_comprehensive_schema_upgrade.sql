-- Migration 016: Comprehensive schema upgrade
-- Addresses: missing indexes, constraints, FKs, new tables, and schema gaps

-- ==========================================
-- 1. Password Reset Tokens table
-- ==========================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_password_reset_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens (token) WHERE used_at IS NULL;

-- ==========================================
-- 2. User table additions for email verification & invites
-- ==========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_token TEXT;

CREATE INDEX IF NOT EXISTS idx_users_invite_token ON users (invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users (email_verification_token) WHERE email_verification_token IS NOT NULL;

-- ==========================================
-- 3. Partial indexes for soft-deleted records
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients (tenant_id, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_active ON documents (tenant_id, created_at DESC) WHERE deleted_at IS NULL;

-- ==========================================
-- 4. Missing composite indexes for performance
-- ==========================================
-- Notifications: unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (tenant_id, user_id, created_at DESC) WHERE read_at IS NULL;

-- Messages: unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (tenant_id, client_id, created_at DESC) WHERE read_at IS NULL;

-- Audit logs: tenant+action compound
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action ON audit_logs (tenant_id, action, created_at DESC);

-- Time entries: billing reports
CREATE INDEX IF NOT EXISTS idx_time_entries_billing ON time_entries (tenant_id, is_billable, date DESC);

-- Invoices: status filtering
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (tenant_id, status, created_at DESC);

-- Expenses: date range queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (tenant_id, date DESC);

-- Tasks: kanban board queries
CREATE INDEX IF NOT EXISTS idx_tasks_kanban ON tasks (tenant_id, status, sort_order);

-- Compliance deadlines: upcoming queries
CREATE INDEX IF NOT EXISTS idx_deadlines_upcoming ON compliance_deadlines (tenant_id, due_date) WHERE is_completed = FALSE;

-- ==========================================
-- 5. CHECK constraints for data integrity
-- ==========================================
-- Time entries: hours must be positive
DO $$ BEGIN
    ALTER TABLE time_entries ADD CONSTRAINT chk_time_entries_hours CHECK (hours_decimal > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invoices: amounts must be non-negative
DO $$ BEGIN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoices_subtotal CHECK (subtotal_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoices_total CHECK (total_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoices_paid CHECK (amount_paid_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invoice line items: quantity and price must be positive
DO $$ BEGIN
    ALTER TABLE invoice_line_items ADD CONSTRAINT chk_line_items_quantity CHECK (quantity > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE invoice_line_items ADD CONSTRAINT chk_line_items_price CHECK (unit_price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Expenses: amount must be positive
DO $$ BEGIN
    ALTER TABLE expenses ADD CONSTRAINT chk_expenses_amount CHECK (amount_cents > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tasks: valid priority values
DO $$ BEGIN
    ALTER TABLE tasks ADD CONSTRAINT chk_tasks_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tasks: valid status values
DO $$ BEGIN
    ALTER TABLE tasks ADD CONSTRAINT chk_tasks_status CHECK (status IN ('todo', 'in_progress', 'review', 'done'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invoices: valid status values
DO $$ BEGIN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoices_status CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'void'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Documents: valid verification status
DO $$ BEGIN
    ALTER TABLE documents ADD CONSTRAINT chk_documents_verification CHECK (verification_status IN ('pending', 'verified', 'needs_review', 'unverified', 'rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- 6. Foreign key ON DELETE behaviors
-- ==========================================
-- Tasks: SET NULL when assigned user deleted
DO $$ BEGIN
    -- Drop existing FK if exists, then re-add with proper behavior
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_assigned_to_fkey' AND table_name = 'tasks') THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_assigned_to_fkey;
    END IF;
    ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tasks_created_by_fkey' AND table_name = 'tasks') THEN
        ALTER TABLE tasks DROP CONSTRAINT tasks_created_by_fkey;
    END IF;
    ALTER TABLE tasks ADD CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Messages: CASCADE when client deleted
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'messages_client_id_fkey' AND table_name = 'messages') THEN
        ALTER TABLE messages DROP CONSTRAINT messages_client_id_fkey;
    END IF;
    ALTER TABLE messages ADD CONSTRAINT messages_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- 7. Payments table (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    method TEXT NOT NULL DEFAULT 'manual',
    stripe_payment_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments (tenant_id, invoice_id);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
CREATE POLICY payments_tenant_isolation ON payments
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Enable RLS on password_reset_tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prt_tenant_isolation ON password_reset_tokens;
CREATE POLICY prt_tenant_isolation ON password_reset_tokens
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- ==========================================
-- 8. Security events table (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON security_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events (user_id, created_at DESC);

-- ==========================================
-- 9. Config table for configurable values
-- ==========================================
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_config (key, value, description) VALUES
    ('rate_limit_requests', '100', 'Max requests per window'),
    ('rate_limit_window_seconds', '60', 'Rate limit window in seconds'),
    ('max_upload_size_bytes', '52428800', 'Max file upload size (50MB)'),
    ('session_limit_per_user', '5', 'Max concurrent sessions per user')
ON CONFLICT (key) DO NOTHING;
