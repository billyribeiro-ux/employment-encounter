-- Migration 007: Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'void')),
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL DEFAULT 0,
    amount_paid_cents BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    due_date DATE,
    issued_date DATE,
    paid_date DATE,
    notes TEXT,
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    pdf_s3_key VARCHAR(1000),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL DEFAULT 0,
    time_entry_id UUID REFERENCES time_entries(id),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant_client ON invoices(tenant_id, client_id);
CREATE INDEX idx_invoices_status ON invoices(tenant_id, status);
CREATE INDEX idx_invoices_number ON invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_isolation ON invoices
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY invoices_tenant_insert ON invoices
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items FORCE ROW LEVEL SECURITY;
CREATE POLICY invoice_line_items_tenant_isolation ON invoice_line_items
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY invoice_line_items_tenant_insert ON invoice_line_items
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

-- Add foreign key from time_entries to invoices now that invoices table exists
ALTER TABLE time_entries ADD CONSTRAINT fk_time_entries_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id);
