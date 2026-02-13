-- Migration 021: Next-level hiring features
-- Adds: pipeline stages, approval workflows, scorecards, referrals, talent pools,
-- onboarding, assessments, video interviews, reference checks, compliance/GDPR

-- ============================================
-- Custom Pipeline Stages
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    stages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pipeline_templates_tenant ON pipeline_templates(tenant_id);

-- ============================================
-- Approval Workflows
-- ============================================
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL, -- job_posting, offer, budget, new_position
    steps JSONB NOT NULL DEFAULT '[]', -- [{role, approver_id, order}]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_approval_workflows_tenant ON approval_workflows(tenant_id);

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workflow_id UUID REFERENCES approval_workflows(id),
    request_type VARCHAR(50) NOT NULL,
    requester_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    current_step INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_approval_requests_tenant ON approval_requests(tenant_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(tenant_id, status);

CREATE TABLE IF NOT EXISTS approval_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    step_number INT NOT NULL,
    decision VARCHAR(20) NOT NULL, -- approved, rejected
    comment TEXT,
    decided_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_approval_decisions_request ON approval_decisions(request_id);

-- ============================================
-- Interview Scorecards
-- ============================================
CREATE TABLE IF NOT EXISTS scorecard_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    role_type VARCHAR(50), -- engineering, design, sales, management
    sections JSONB NOT NULL DEFAULT '[]', -- [{name, weight, criteria: [{name, description, levels}]}]
    is_default BOOLEAN DEFAULT false,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_scorecard_templates_tenant ON scorecard_templates(tenant_id);

CREATE TABLE IF NOT EXISTS completed_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    template_id UUID REFERENCES scorecard_templates(id),
    application_id UUID NOT NULL,
    interviewer_id UUID NOT NULL,
    interview_type VARCHAR(50), -- phone, technical, onsite, culture
    scores JSONB NOT NULL DEFAULT '{}', -- {section: {criterion: score}}
    overall_score DECIMAL(3,1),
    recommendation VARCHAR(30), -- strong_hire, hire, no_hire, strong_no_hire
    strengths TEXT,
    concerns TEXT,
    notes TEXT,
    completed_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_completed_scorecards_app ON completed_scorecards(application_id);
CREATE INDEX idx_completed_scorecards_tenant ON completed_scorecards(tenant_id);

-- ============================================
-- Employee Referrals
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    referrer_id UUID NOT NULL, -- employee who referred
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(255) NOT NULL,
    job_id UUID REFERENCES job_posts(id),
    relationship VARCHAR(100),
    notes TEXT,
    resume_url TEXT,
    status VARCHAR(30) DEFAULT 'submitted', -- submitted, screening, interview, hired, rejected
    reward_amount DECIMAL(10,2),
    reward_status VARCHAR(30), -- pending, approved, paid
    application_id UUID, -- linked once they apply
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_referrals_tenant ON referrals(tenant_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- ============================================
-- Talent Pools
-- ============================================
CREATE TABLE IF NOT EXISTS talent_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pool_type VARCHAR(50) DEFAULT 'custom', -- custom, silver_medalist, alumni, passive
    criteria JSONB DEFAULT '{}',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_talent_pools_tenant ON talent_pools(tenant_id);

CREATE TABLE IF NOT EXISTS talent_pool_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES talent_pools(id) ON DELETE CASCADE,
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(255),
    source VARCHAR(100),
    engagement_score INT DEFAULT 0,
    last_contacted_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    added_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_pool_members_pool ON talent_pool_members(pool_id);

CREATE TABLE IF NOT EXISTS nurture_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    pool_id UUID REFERENCES talent_pools(id),
    name VARCHAR(100) NOT NULL,
    campaign_type VARCHAR(50), -- drip, event, role_alert, company_update
    status VARCHAR(30) DEFAULT 'draft', -- draft, active, paused, completed
    steps JSONB DEFAULT '[]', -- [{delay_days, subject, body, template_id}]
    metrics JSONB DEFAULT '{}', -- {sent, opened, clicked, replied}
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_nurture_campaigns_tenant ON nurture_campaigns(tenant_id);

-- ============================================
-- Onboarding
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    role_type VARCHAR(50),
    phases JSONB NOT NULL DEFAULT '[]', -- [{name, tasks: [{title, assignee_role, due_offset_days, required, documents}]}]
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_onboarding_templates_tenant ON onboarding_templates(tenant_id);

CREATE TABLE IF NOT EXISTS onboarding_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    template_id UUID REFERENCES onboarding_templates(id),
    new_hire_name VARCHAR(200) NOT NULL,
    new_hire_email VARCHAR(255),
    job_title VARCHAR(200),
    department VARCHAR(100),
    start_date DATE NOT NULL,
    manager_id UUID,
    buddy_id UUID,
    status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed
    progress_percent INT DEFAULT 0,
    tasks JSONB DEFAULT '[]', -- tasks with completion status
    documents JSONB DEFAULT '[]', -- collected documents
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_onboarding_instances_tenant ON onboarding_instances(tenant_id);

-- ============================================
-- Skill Assessments
-- ============================================
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- technical, cognitive, personality, coding, case_study, language
    difficulty VARCHAR(20) DEFAULT 'medium',
    duration_minutes INT DEFAULT 30,
    questions JSONB NOT NULL DEFAULT '[]',
    passing_score INT DEFAULT 70,
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    avg_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_assessments_tenant ON assessments(tenant_id);

CREATE TABLE IF NOT EXISTS assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(255),
    application_id UUID,
    score DECIMAL(5,2),
    percentile INT,
    time_taken_seconds INT,
    answers JSONB DEFAULT '[]',
    anti_cheat_flags JSONB DEFAULT '[]', -- [{type, timestamp, details}]
    status VARCHAR(30) DEFAULT 'invited', -- invited, in_progress, completed, expired
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_assessment_submissions_tenant ON assessment_submissions(tenant_id);
CREATE INDEX idx_assessment_submissions_assessment ON assessment_submissions(assessment_id);

-- ============================================
-- Async Video Interviews
-- ============================================
CREATE TABLE IF NOT EXISTS video_interview_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]', -- [{text, max_seconds, prep_seconds, required}]
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_video_templates_tenant ON video_interview_templates(tenant_id);

CREATE TABLE IF NOT EXISTS video_interview_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES video_interview_templates(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_name VARCHAR(200) NOT NULL,
    candidate_email VARCHAR(255),
    application_id UUID,
    status VARCHAR(30) DEFAULT 'invited', -- invited, in_progress, submitted, reviewed, rated
    recordings JSONB DEFAULT '[]', -- [{question_index, url, duration, rating, notes}]
    overall_rating DECIMAL(3,1),
    reviewer_id UUID,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_video_submissions_tenant ON video_interview_submissions(tenant_id);

-- ============================================
-- Reference Checks
-- ============================================
CREATE TABLE IF NOT EXISTS reference_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    application_id UUID NOT NULL,
    candidate_name VARCHAR(200) NOT NULL,
    reference_name VARCHAR(200) NOT NULL,
    reference_email VARCHAR(255) NOT NULL,
    reference_title VARCHAR(200),
    reference_company VARCHAR(200),
    relationship VARCHAR(100),
    questionnaire_type VARCHAR(50) DEFAULT 'professional', -- professional, academic, character
    status VARCHAR(30) DEFAULT 'requested', -- requested, sent, completed, overdue
    responses JSONB DEFAULT '[]',
    overall_rating DECIMAL(3,1),
    red_flags JSONB DEFAULT '[]',
    highlights JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reference_requests_tenant ON reference_requests(tenant_id);
CREATE INDEX idx_reference_requests_app ON reference_requests(application_id);

-- ============================================
-- Compensation Benchmarking
-- ============================================
CREATE TABLE IF NOT EXISTS compensation_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_title VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    experience_level VARCHAR(50),
    p25_salary INT,
    p50_salary INT,
    p75_salary INT,
    p90_salary INT,
    total_comp_median INT,
    equity_median INT,
    bonus_median INT,
    data_source VARCHAR(100),
    last_updated TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_comp_benchmarks_tenant ON compensation_benchmarks(tenant_id);

-- ============================================
-- GDPR / Compliance
-- ============================================
CREATE TABLE IF NOT EXISTS consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(200),
    consent_type VARCHAR(50) NOT NULL, -- processing, marketing, analytics
    consented BOOLEAN NOT NULL,
    consent_text TEXT,
    ip_address VARCHAR(45),
    consented_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX idx_consent_records_tenant ON consent_records(tenant_id);
CREATE INDEX idx_consent_records_email ON consent_records(candidate_email);

CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_email VARCHAR(255) NOT NULL,
    candidate_name VARCHAR(200),
    request_type VARCHAR(50) NOT NULL, -- deletion, export, rectification
    status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, rejected
    requested_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processed_by UUID,
    notes TEXT,
    audit_trail JSONB DEFAULT '[]'
);
CREATE INDEX idx_deletion_requests_tenant ON data_deletion_requests(tenant_id);

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    data_category VARCHAR(100) NOT NULL, -- applications, resumes, interviews, assessments
    retention_days INT NOT NULL DEFAULT 365,
    auto_delete BOOLEAN DEFAULT false,
    legal_basis TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_retention_policies_tenant ON data_retention_policies(tenant_id);

-- ============================================
-- Offer Negotiations
-- ============================================
CREATE TABLE IF NOT EXISTS offer_negotiations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    application_id UUID NOT NULL,
    candidate_name VARCHAR(200) NOT NULL,
    job_title VARCHAR(200) NOT NULL,
    status VARCHAR(30) DEFAULT 'initial_offer', -- initial_offer, counter_offer, final_offer, accepted, declined
    rounds JSONB DEFAULT '[]', -- [{round, base_salary, equity, bonus, benefits, notes, proposed_by, date}]
    current_offer JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_offer_negotiations_tenant ON offer_negotiations(tenant_id);
