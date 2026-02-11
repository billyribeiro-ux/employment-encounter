-- Migration 003: Clients
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

CREATE TABLE client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_tenant_id ON clients(tenant_id);
CREATE INDEX idx_clients_assigned_cpa ON clients(assigned_cpa_id);
CREATE INDEX idx_clients_status ON clients(tenant_id, status);
CREATE INDEX idx_client_contacts_client ON client_contacts(client_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
CREATE POLICY clients_tenant_isolation ON clients
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY clients_tenant_insert ON clients
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts FORCE ROW LEVEL SECURITY;
CREATE POLICY client_contacts_tenant_isolation ON client_contacts
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY client_contacts_tenant_insert ON client_contacts
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
