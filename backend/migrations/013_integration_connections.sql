-- Migration 013: Integration Connections & Sync Logs
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
    external_account_id VARCHAR(255),
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20),
    last_sync_records INT DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, provider)
);

CREATE TABLE integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    connection_id UUID NOT NULL REFERENCES integration_connections(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('pull', 'push')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'partial')),
    records_processed INT NOT NULL DEFAULT 0,
    records_created INT NOT NULL DEFAULT 0,
    records_updated INT NOT NULL DEFAULT 0,
    records_skipped INT NOT NULL DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INT
);

CREATE INDEX idx_integration_connections_tenant ON integration_connections(tenant_id);
CREATE INDEX idx_integration_sync_logs_connection ON integration_sync_logs(connection_id, started_at DESC);
CREATE INDEX idx_integration_sync_logs_tenant ON integration_sync_logs(tenant_id, started_at DESC);

-- RLS
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections FORCE ROW LEVEL SECURITY;
CREATE POLICY integration_connections_tenant_isolation ON integration_connections
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY integration_connections_tenant_insert ON integration_connections
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY integration_sync_logs_tenant_isolation ON integration_sync_logs
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY integration_sync_logs_tenant_insert ON integration_sync_logs
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
