-- Migration 004: Documents
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
    typesense_indexed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version INT NOT NULL,
    s3_key VARCHAR(1000) NOT NULL,
    size_bytes BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_tenant_client ON documents(tenant_id, client_id);
CREATE INDEX idx_documents_category ON documents(tenant_id, category);
CREATE INDEX idx_documents_verification ON documents(tenant_id, verification_status);
CREATE INDEX idx_document_versions_doc ON document_versions(document_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
CREATE POLICY documents_tenant_isolation ON documents
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY documents_tenant_insert ON documents
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY document_versions_tenant_isolation ON document_versions
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY document_versions_tenant_insert ON document_versions
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
