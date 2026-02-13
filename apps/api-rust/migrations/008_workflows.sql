-- Workflow templates (reusable workflow definitions)
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'tax_return',
    steps JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_templates_tenant ON workflow_templates(tenant_id);

-- Workflow instances (active workflows for specific clients)
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    template_id UUID NOT NULL REFERENCES workflow_templates(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_step_index INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    due_date DATE,
    assigned_to UUID REFERENCES users(id),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_instances_tenant ON workflow_instances(tenant_id);
CREATE INDEX idx_workflow_instances_client ON workflow_instances(client_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(tenant_id, status);

-- Workflow step logs (track step transitions)
CREATE TABLE workflow_step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_index INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'started', 'completed', 'skipped', 'rejected', 'returned'
    performed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_step_logs_instance ON workflow_step_logs(instance_id);

-- RLS
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_templates_tenant_isolation ON workflow_templates
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY workflow_instances_tenant_isolation ON workflow_instances
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY workflow_step_logs_tenant_isolation ON workflow_step_logs
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
