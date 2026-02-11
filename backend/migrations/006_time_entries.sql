-- Migration 006: Time Entries
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    description TEXT NOT NULL DEFAULT '',
    duration_minutes INT NOT NULL DEFAULT 0,
    rate_cents BIGINT NOT NULL DEFAULT 0,
    is_billable BOOLEAN NOT NULL DEFAULT TRUE,
    is_running BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    invoice_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_time_entries_tenant_user ON time_entries(tenant_id, user_id);
CREATE INDEX idx_time_entries_tenant_client ON time_entries(tenant_id, client_id);
CREATE INDEX idx_time_entries_date ON time_entries(tenant_id, date);
CREATE INDEX idx_time_entries_invoice ON time_entries(invoice_id);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY time_entries_tenant_isolation ON time_entries
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY time_entries_tenant_insert ON time_entries
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
