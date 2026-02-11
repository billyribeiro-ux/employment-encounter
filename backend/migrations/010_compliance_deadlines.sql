-- Compliance deadlines table
CREATE TABLE compliance_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    filing_type VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    due_date DATE NOT NULL,
    extended_due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming',
    extension_filed BOOLEAN NOT NULL DEFAULT false,
    extension_filed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    reminder_sent_30d BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_14d BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_7d BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_1d BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_deadlines_tenant ON compliance_deadlines(tenant_id);
CREATE INDEX idx_compliance_deadlines_client ON compliance_deadlines(client_id);
CREATE INDEX idx_compliance_deadlines_due ON compliance_deadlines(tenant_id, due_date);
CREATE INDEX idx_compliance_deadlines_status ON compliance_deadlines(tenant_id, status);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID REFERENCES clients(id),
    user_id UUID NOT NULL REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    amount_cents BIGINT NOT NULL,
    date DATE NOT NULL,
    receipt_document_id UUID REFERENCES documents(id),
    is_reimbursable BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX idx_expenses_client ON expenses(client_id);
CREATE INDEX idx_expenses_date ON expenses(tenant_id, date);

-- RLS
ALTER TABLE compliance_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_deadlines_tenant_isolation ON compliance_deadlines
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY expenses_tenant_isolation ON expenses
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
