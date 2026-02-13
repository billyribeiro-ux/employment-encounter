-- Migration 020: Advanced hiring features
-- Saved jobs, email templates, career page, question bank, automations, activity log

-- Saved jobs (candidate bookmarks)
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES job_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'custom',
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Career page configuration
CREATE TABLE IF NOT EXISTS career_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
    is_published BOOLEAN DEFAULT false,
    hero_headline VARCHAR(255) DEFAULT 'Join Our Team',
    hero_subheadline VARCHAR(500) DEFAULT 'Build your career with us',
    hero_bg_color VARCHAR(20) DEFAULT '#1e40af',
    about_text TEXT,
    mission TEXT,
    values TEXT[] DEFAULT '{}',
    benefits TEXT[] DEFAULT '{}',
    culture_description TEXT,
    testimonials JSONB DEFAULT '[]',
    primary_color VARCHAR(20) DEFAULT '#2563eb',
    accent_color VARCHAR(20) DEFAULT '#7c3aed',
    logo_url VARCHAR(500),
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    custom_css TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Interview question bank
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    question TEXT NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'general',
    difficulty VARCHAR(20) DEFAULT 'medium',
    suggested_followups TEXT[] DEFAULT '{}',
    scoring_rubric TEXT,
    is_starred BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    avg_score NUMERIC(3,2),
    tags TEXT[] DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Question sets (group questions for interview rounds)
CREATE TABLE IF NOT EXISTS question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    interview_type VARCHAR(64),
    question_ids UUID[] DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    trigger_event VARCHAR(64) NOT NULL,
    conditions JSONB DEFAULT '{}',
    actions JSONB DEFAULT '[]',
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation execution log
CREATE TABLE IF NOT EXISTS automation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    rule_id UUID NOT NULL REFERENCES automation_rules(id),
    trigger_data JSONB,
    actions_taken JSONB,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log (team activity feed)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(64) NOT NULL,
    action_type VARCHAR(32) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id UUID,
    resource_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(id),
    default_pipeline JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Hiring budget tracking
CREATE TABLE IF NOT EXISTS hiring_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_id UUID REFERENCES job_posts(id),
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    total_budget_cents BIGINT DEFAULT 0,
    spent_cents BIGINT DEFAULT 0,
    category VARCHAR(64) DEFAULT 'general',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Budget line items
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES hiring_budgets(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    description VARCHAR(500) NOT NULL,
    amount_cents BIGINT NOT NULL,
    category VARCHAR(64) NOT NULL,
    vendor VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Candidate job alerts
CREATE TABLE IF NOT EXISTS job_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    keywords TEXT[] DEFAULT '{}',
    locations TEXT[] DEFAULT '{}',
    employment_types TEXT[] DEFAULT '{}',
    remote_preference VARCHAR(20),
    min_salary_cents BIGINT,
    frequency VARCHAR(20) DEFAULT 'daily',
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_interview_questions_tenant ON interview_questions(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automation_log_tenant ON automation_log(tenant_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hiring_budgets_tenant ON hiring_budgets(tenant_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON job_alerts(user_id, is_active);
