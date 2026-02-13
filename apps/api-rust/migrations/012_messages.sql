-- Migration 012: Secure Messaging
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES messages(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_tenant_client ON messages(tenant_id, client_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_parent ON messages(parent_id);
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
CREATE POLICY messages_tenant_isolation ON messages
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY messages_tenant_insert ON messages
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments FORCE ROW LEVEL SECURITY;
CREATE POLICY message_attachments_tenant_isolation ON message_attachments
    USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
CREATE POLICY message_attachments_tenant_insert ON message_attachments
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
