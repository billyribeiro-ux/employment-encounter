-- ============================================================================
-- Migration 017: Employment Platform Core Schema
-- Talent-OS v1 — Identity, Talent, Hiring, Chat, Scheduling, Video, Billing
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. IDENTITY & TENANCY EXTENSIONS
-- ──────────────────────────────────────────────────────────────────────────────

-- Organizations (employer companies on the platform)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100),
    domain VARCHAR(255),
    logo_url TEXT,
    website_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(30) CHECK (company_size IN ('1-10','11-50','51-200','201-500','501-1000','1001-5000','5000+')),
    description TEXT,
    headquarters_city VARCHAR(100),
    headquarters_state VARCHAR(100),
    headquarters_country VARCHAR(100) DEFAULT 'US',
    founded_year SMALLINT,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organizations_tenant_isolation') THEN
        CREATE POLICY organizations_tenant_isolation ON organizations FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'organizations_tenant_insert') THEN
        CREATE POLICY organizations_tenant_insert ON organizations FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(tenant_id, slug);

-- Organization members (link users to orgs with roles)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','hiring_manager','recruiter','interviewer','member','viewer')),
    title VARCHAR(255),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'org_members_tenant_isolation') THEN
        CREATE POLICY org_members_tenant_isolation ON organization_members FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'org_members_tenant_insert') THEN
        CREATE POLICY org_members_tenant_insert ON organization_members FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_org_members_tenant_org ON organization_members(tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);

-- Roles & Permissions (RBAC)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'roles_tenant_isolation') THEN
        CREATE POLICY roles_tenant_isolation ON roles FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, role_id, resource, action)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'permissions' AND policyname = 'permissions_tenant_isolation') THEN
        CREATE POLICY permissions_tenant_isolation ON permissions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

-- Sessions (device-level session tracking)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'sessions_tenant_isolation') THEN
        CREATE POLICY sessions_tenant_isolation ON sessions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash) WHERE revoked_at IS NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. TALENT (CANDIDATE) TABLES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    headline VARCHAR(255),
    summary TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'US',
    remote_preference VARCHAR(20) DEFAULT 'flexible' CHECK (remote_preference IN ('remote','hybrid','onsite','flexible')),
    availability_status VARCHAR(20) DEFAULT 'passive' CHECK (availability_status IN ('immediate','two_weeks','one_month','passive','unavailable')),
    desired_salary_min_cents BIGINT,
    desired_salary_max_cents BIGINT,
    desired_currency VARCHAR(3) DEFAULT 'USD',
    visa_status VARCHAR(50),
    work_authorization VARCHAR(50),
    linkedin_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    profile_completeness_pct SMALLINT DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    reputation_score DECIMAL(3,2) DEFAULT 0,
    response_rate_pct SMALLINT DEFAULT 0,
    interview_attendance_rate_pct SMALLINT DEFAULT 100,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_profiles' AND policyname = 'candidates_tenant_isolation') THEN
        CREATE POLICY candidates_tenant_isolation ON candidate_profiles FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_profiles' AND policyname = 'candidates_tenant_insert') THEN
        CREATE POLICY candidates_tenant_insert ON candidate_profiles FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidate_profiles_tenant ON candidate_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_availability ON candidate_profiles(tenant_id, availability_status);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_location ON candidate_profiles(tenant_id, location_country, location_state);

-- Candidate documents (resume, cover letter, etc.)
CREATE TABLE IF NOT EXISTS candidate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('resume','cover_letter','portfolio','certificate','other')),
    filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    s3_key VARCHAR(1000),
    is_primary BOOLEAN DEFAULT FALSE,
    parsed_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_documents FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_documents' AND policyname = 'candidate_docs_tenant_isolation') THEN
        CREATE POLICY candidate_docs_tenant_isolation ON candidate_documents FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidate_docs_candidate ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_docs_type ON candidate_documents(candidate_id, document_type);

-- Candidate skills
CREATE TABLE IF NOT EXISTS candidate_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) CHECK (category IN ('technical','soft','domain','tool','language')),
    proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('beginner','intermediate','advanced','expert')),
    years_experience SMALLINT,
    is_verified BOOLEAN DEFAULT FALSE,
    evidence_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_skills' AND policyname = 'candidate_skills_tenant_isolation') THEN
        CREATE POLICY candidate_skills_tenant_isolation ON candidate_skills FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_candidate_skills_candidate ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_name ON candidate_skills(tenant_id, skill_name);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. EMPLOYER TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Companies (external companies being recruited for, distinct from organizations)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(30),
    description TEXT,
    website_url TEXT,
    headquarters VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'companies_tenant_isolation') THEN
        CREATE POLICY companies_tenant_isolation ON companies FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(tenant_id, name);

-- Employer profiles (user context for employers)
CREATE TABLE IF NOT EXISTS employer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    organization_id UUID REFERENCES organizations(id),
    title VARCHAR(255),
    department VARCHAR(100),
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employer_profiles' AND policyname = 'employer_profiles_tenant_isolation') THEN
        CREATE POLICY employer_profiles_tenant_isolation ON employer_profiles FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employer_profiles_user ON employer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employer_profiles_company ON employer_profiles(company_id);

-- Job posts
CREATE TABLE IF NOT EXISTS job_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    organization_id UUID REFERENCES organizations(id),
    company_id UUID REFERENCES companies(id),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    description TEXT,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(100) DEFAULT 'US',
    work_mode VARCHAR(20) DEFAULT 'hybrid' CHECK (work_mode IN ('remote','hybrid','onsite')),
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contract','internship','freelance')),
    seniority_level VARCHAR(30) CHECK (seniority_level IN ('intern','junior','mid','senior','staff','principal','director','vp','c_level')),
    salary_min_cents BIGINT,
    salary_max_cents BIGINT,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    equity_offered BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','open','paused','closed','filled')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public','private','internal')),
    posted_at TIMESTAMPTZ,
    closes_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ,
    hiring_manager_id UUID REFERENCES users(id),
    recruiter_id UUID REFERENCES users(id),
    max_applications INT,
    application_count INT DEFAULT 0,
    is_urgent BOOLEAN DEFAULT FALSE,
    skills_required TEXT[] DEFAULT '{}',
    skills_preferred TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_posts' AND policyname = 'job_posts_tenant_isolation') THEN
        CREATE POLICY job_posts_tenant_isolation ON job_posts FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_posts' AND policyname = 'job_posts_tenant_insert') THEN
        CREATE POLICY job_posts_tenant_insert ON job_posts FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_job_posts_tenant ON job_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_job_posts_org ON job_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_hiring_manager ON job_posts(hiring_manager_id);
CREATE INDEX IF NOT EXISTS idx_job_posts_location ON job_posts(tenant_id, location_country, location_state, work_mode);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. HIRING WORKFLOW TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_id UUID NOT NULL REFERENCES job_posts(id),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id),
    stage VARCHAR(30) DEFAULT 'applied' CHECK (stage IN ('applied','screening','phone_screen','technical','onsite','offer','hired','rejected','withdrawn')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','on_hold','rejected','withdrawn','hired')),
    source VARCHAR(50) CHECK (source IN ('direct','referral','agency','job_board','linkedin','internal','sourced')),
    referrer_id UUID REFERENCES users(id),
    cover_letter TEXT,
    resume_document_id UUID REFERENCES candidate_documents(id),
    match_score DECIMAL(5,2),
    match_reasons JSONB DEFAULT '[]',
    decision_notes TEXT,
    rejected_reason VARCHAR(255),
    offer_amount_cents BIGINT,
    offer_equity_pct DECIMAL(5,2),
    offer_extended_at TIMESTAMPTZ,
    offer_accepted_at TIMESTAMPTZ,
    offer_declined_at TIMESTAMPTZ,
    hired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, job_id, candidate_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'applications_tenant_isolation') THEN
        CREATE POLICY applications_tenant_isolation ON applications FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applications' AND policyname = 'applications_tenant_insert') THEN
        CREATE POLICY applications_tenant_insert ON applications FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_tenant ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_stage ON applications(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(tenant_id, status);

-- Application stage events (pipeline history)
CREATE TABLE IF NOT EXISTS application_stage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_stage VARCHAR(30),
    to_stage VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    duration_hours INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE application_stage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_stage_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_stage_events' AND policyname = 'app_stage_events_tenant_isolation') THEN
        CREATE POLICY app_stage_events_tenant_isolation ON application_stage_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_app_stage_events_application ON application_stage_events(application_id);

-- Scorecards
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES users(id),
    interview_stage VARCHAR(50),
    overall_score SMALLINT CHECK (overall_score BETWEEN 1 AND 5),
    recommendation VARCHAR(30) CHECK (recommendation IN ('strong_hire','hire','neutral','no_hire','strong_no_hire')),
    strengths TEXT,
    concerns TEXT,
    notes TEXT,
    criteria_scores JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scorecards' AND policyname = 'scorecards_tenant_isolation') THEN
        CREATE POLICY scorecards_tenant_isolation ON scorecards FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scorecards_application ON scorecards(application_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_interviewer ON scorecards(interviewer_id);

-- Decision records
CREATE TABLE IF NOT EXISTS decision_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('advance','reject','hold','offer','hire')),
    decided_by UUID NOT NULL REFERENCES users(id),
    rationale TEXT NOT NULL,
    evidence_refs JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decision_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_records FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'decision_records' AND policyname = 'decision_records_tenant_isolation') THEN
        CREATE POLICY decision_records_tenant_isolation ON decision_records FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_decision_records_application ON decision_records(application_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. CHAT TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','group','channel')),
    title VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id),
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'conversations_tenant_isolation') THEN
        CREATE POLICY conversations_tenant_isolation ON conversations FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'conversations_tenant_insert') THEN
        CREATE POLICY conversations_tenant_insert ON conversations FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(tenant_id, last_message_at DESC);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, conversation_id, user_id)
);

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_participants' AND policyname = 'conv_participants_tenant_isolation') THEN
        CREATE POLICY conv_participants_tenant_isolation ON conversation_participants FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);

-- Messages (chat)
-- We keep the existing 'messages' table for client messaging (CPA domain).
-- This new table is for the hiring platform's conversation-based chat.
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text','file','system','meeting_request','application_update')),
    parent_id UUID REFERENCES chat_messages(id),
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'chat_messages_tenant_isolation') THEN
        CREATE POLICY chat_messages_tenant_isolation ON chat_messages FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'chat_messages_tenant_insert') THEN
        CREATE POLICY chat_messages_tenant_insert ON chat_messages FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_parent ON chat_messages(parent_id);

-- Message receipts (read tracking)
CREATE TABLE IF NOT EXISTS message_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    delivered_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    UNIQUE(tenant_id, message_id, user_id)
);

ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_receipts' AND policyname = 'message_receipts_tenant_isolation') THEN
        CREATE POLICY message_receipts_tenant_isolation ON message_receipts FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_receipts_message ON message_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_receipts_user ON message_receipts(user_id);

-- Chat message attachments
CREATE TABLE IF NOT EXISTS chat_message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    s3_key VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_attachments FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_message_attachments' AND policyname = 'chat_msg_attach_tenant_isolation') THEN
        CREATE POLICY chat_msg_attach_tenant_isolation ON chat_message_attachments FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_msg_attachments_msg ON chat_message_attachments(message_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. SCHEDULING TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Meeting requests
CREATE TABLE IF NOT EXISTS meeting_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requested_by UUID NOT NULL REFERENCES users(id),
    meeting_type VARCHAR(20) DEFAULT 'video' CHECK (meeting_type IN ('phone','video','in_person')),
    duration_minutes INT DEFAULT 60,
    location TEXT,
    meeting_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','denied','rescheduled','cancelled','completed')),
    proposed_times JSONB DEFAULT '[]',
    accepted_time TIMESTAMPTZ,
    accepted_timezone VARCHAR(50),
    application_id UUID REFERENCES applications(id),
    conversation_id UUID REFERENCES conversations(id),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_requests FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_requests' AND policyname = 'meeting_requests_tenant_isolation') THEN
        CREATE POLICY meeting_requests_tenant_isolation ON meeting_requests FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_requests' AND policyname = 'meeting_requests_tenant_insert') THEN
        CREATE POLICY meeting_requests_tenant_insert ON meeting_requests FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meeting_requests_tenant ON meeting_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_status ON meeting_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_requested_by ON meeting_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_meeting_requests_application ON meeting_requests(application_id);

-- Meeting participants
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    meeting_id UUID NOT NULL REFERENCES meeting_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'attendee' CHECK (role IN ('organizer','interviewer','attendee','observer')),
    response_status VARCHAR(20) DEFAULT 'pending' CHECK (response_status IN ('pending','accepted','declined','tentative')),
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, meeting_id, user_id)
);

ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_participants' AND policyname = 'meeting_participants_tenant_isolation') THEN
        CREATE POLICY meeting_participants_tenant_isolation ON meeting_participants FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(user_id);

-- Meeting availability blocks
CREATE TABLE IF NOT EXISTS meeting_availability_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    is_recurring BOOLEAN DEFAULT TRUE,
    specific_date DATE,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meeting_availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_availability_blocks FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_availability_blocks' AND policyname = 'meeting_avail_tenant_isolation') THEN
        CREATE POLICY meeting_avail_tenant_isolation ON meeting_availability_blocks FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meeting_avail_user ON meeting_availability_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_avail_day ON meeting_availability_blocks(user_id, day_of_week);

-- Meeting reschedule events
CREATE TABLE IF NOT EXISTS meeting_reschedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    meeting_id UUID NOT NULL REFERENCES meeting_requests(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    original_time TIMESTAMPTZ,
    proposed_times JSONB DEFAULT '[]',
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','denied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meeting_reschedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_reschedule_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_reschedule_events' AND policyname = 'meeting_resched_tenant_isolation') THEN
        CREATE POLICY meeting_resched_tenant_isolation ON meeting_reschedule_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meeting_reschedule_meeting ON meeting_reschedule_events(meeting_id);

-- Reminder jobs
CREATE TABLE IF NOT EXISTS reminder_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    reminder_type VARCHAR(30) NOT NULL CHECK (reminder_type IN ('meeting_24h','meeting_1h','meeting_10m','application_follow_up','interview_feedback','offer_deadline','custom')),
    reference_type VARCHAR(50),
    reference_id UUID,
    fire_at TIMESTAMPTZ NOT NULL,
    fired BOOLEAN DEFAULT FALSE,
    fired_at TIMESTAMPTZ,
    channel VARCHAR(20) DEFAULT 'in_app' CHECK (channel IN ('in_app','email','push')),
    title VARCHAR(255),
    body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reminder_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_jobs FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reminder_jobs' AND policyname = 'reminder_jobs_tenant_isolation') THEN
        CREATE POLICY reminder_jobs_tenant_isolation ON reminder_jobs FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reminder_jobs_fire ON reminder_jobs(fire_at) WHERE fired = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_user ON reminder_jobs(user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. VIDEO TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Video rooms
CREATE TABLE IF NOT EXISTS video_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255),
    meeting_id UUID REFERENCES meeting_requests(id),
    room_code VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created','active','ended')),
    max_participants INT DEFAULT 10,
    recording_enabled BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_rooms FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_rooms' AND policyname = 'video_rooms_tenant_isolation') THEN
        CREATE POLICY video_rooms_tenant_isolation ON video_rooms FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_rooms_tenant ON video_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_meeting ON video_rooms(meeting_id);
CREATE INDEX IF NOT EXISTS idx_video_rooms_code ON video_rooms(room_code);

-- Video room tokens (access control)
CREATE TABLE IF NOT EXISTS video_room_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    token_hash VARCHAR(128) NOT NULL,
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('host','participant','observer')),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_room_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_room_tokens FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_room_tokens' AND policyname = 'video_room_tokens_tenant_isolation') THEN
        CREATE POLICY video_room_tokens_tenant_isolation ON video_room_tokens FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_room_tokens_room ON video_room_tokens(room_id);
CREATE INDEX IF NOT EXISTS idx_video_room_tokens_user ON video_room_tokens(user_id);

-- Video sessions (call records)
CREATE TABLE IF NOT EXISTS video_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    room_id UUID NOT NULL REFERENCES video_rooms(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    participant_count INT DEFAULT 0,
    recording_url TEXT,
    transcript_url TEXT,
    quality_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_sessions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_sessions' AND policyname = 'video_sessions_tenant_isolation') THEN
        CREATE POLICY video_sessions_tenant_isolation ON video_sessions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_sessions_room ON video_sessions(room_id);

-- Video session events (join/leave/mute etc.)
CREATE TABLE IF NOT EXISTS video_session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id UUID NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('join','leave','mute','unmute','screen_share_start','screen_share_stop','reconnect','error')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_session_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_session_events' AND policyname = 'video_session_events_tenant_isolation') THEN
        CREATE POLICY video_session_events_tenant_isolation ON video_session_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_session_events_session ON video_session_events(session_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. BILLING TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Plans (global, not tenant-scoped)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly_cents BIGINT NOT NULL,
    price_annual_cents BIGINT,
    max_jobs INT,
    max_users INT,
    max_candidates INT,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_annual VARCHAR(255),
    sort_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','cancelled','suspended')),
    billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    seats_used INT DEFAULT 0,
    seats_limit INT DEFAULT 5,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'subscriptions_tenant_isolation') THEN
        CREATE POLICY subscriptions_tenant_isolation ON subscriptions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Usage meters
CREATE TABLE IF NOT EXISTS usage_meters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    meter_type VARCHAR(50) NOT NULL CHECK (meter_type IN ('job_posts','active_users','candidate_contacts','ai_credits','interview_minutes','storage_bytes')),
    current_value BIGINT DEFAULT 0,
    limit_value BIGINT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_meters FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_meters' AND policyname = 'usage_meters_tenant_isolation') THEN
        CREATE POLICY usage_meters_tenant_isolation ON usage_meters FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_meters_subscription ON usage_meters(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_meters_type ON usage_meters(tenant_id, meter_type);

-- Billing invoices (distinct from CPA invoices)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','open','paid','void','uncollectible')),
    stripe_invoice_id VARCHAR(255),
    due_date DATE,
    paid_at TIMESTAMPTZ,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_invoices' AND policyname = 'billing_invoices_tenant_isolation') THEN
        CREATE POLICY billing_invoices_tenant_isolation ON billing_invoices FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant ON billing_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_subscription ON billing_invoices(subscription_id);

-- Payment events
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_id UUID REFERENCES billing_invoices(id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('charge_succeeded','charge_failed','refund','dispute','subscription_created','subscription_updated','subscription_cancelled')),
    amount_cents BIGINT,
    stripe_event_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_events' AND policyname = 'payment_events_tenant_isolation') THEN
        CREATE POLICY payment_events_tenant_isolation ON payment_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_events_subscription ON payment_events(subscription_id);

-- Entitlements (feature flags per tenant)
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    feature_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    limit_value BIGINT,
    expires_at TIMESTAMPTZ,
    source VARCHAR(30) DEFAULT 'plan' CHECK (source IN ('plan','addon','override','trial')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, feature_key)
);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entitlements' AND policyname = 'entitlements_tenant_isolation') THEN
        CREATE POLICY entitlements_tenant_isolation ON entitlements FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_entitlements_tenant ON entitlements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_feature ON entitlements(tenant_id, feature_key);

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. RELIABILITY / COMPLIANCE TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Audit events (append-only)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_tenant ON audit_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id);

-- Idempotency keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    key VARCHAR(255) NOT NULL,
    request_path VARCHAR(500) NOT NULL,
    request_hash VARCHAR(128),
    response_status INT,
    response_body JSONB,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup ON idempotency_keys(tenant_id, key) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expire ON idempotency_keys(expires_at);

-- Notification events (all notification dispatches)
CREATE TABLE IF NOT EXISTS notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('in_app','email','push','sms')),
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    reference_type VARCHAR(100),
    reference_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','read')),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_events' AND policyname = 'notification_events_tenant_isolation') THEN
        CREATE POLICY notification_events_tenant_isolation ON notification_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notification_events_user ON notification_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_events_unread ON notification_events(user_id, status) WHERE status != 'read';

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. SEED DATA
-- ──────────────────────────────────────────────────────────────────────────────

-- Seed subscription plans (idempotent via ON CONFLICT)
INSERT INTO plans (id, name, slug, description, price_monthly_cents, price_annual_cents, max_jobs, max_users, max_candidates, features, sort_order)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Starter', 'starter', 'Get started with basic hiring tools', 0, 0, 2, 3, 100,
     '["job_posting","candidate_search","basic_messaging","basic_scheduling"]'::jsonb, 1),
    ('00000000-0000-0000-0000-000000000002', 'Growth', 'growth', 'Scale your hiring with advanced features', 9900, 99000, 10, 10, 1000,
     '["job_posting","candidate_search","advanced_messaging","scheduling","scorecards","analytics","csv_export","video_interviews"]'::jsonb, 2),
    ('00000000-0000-0000-0000-000000000003', 'Scale', 'scale', 'Enterprise-ready hiring platform', 29900, 299000, 50, 25, 10000,
     '["job_posting","candidate_search","advanced_messaging","scheduling","scorecards","analytics","csv_export","video_interviews","api_access","custom_workflows","talent_pools","outreach_sequences","reference_checks"]'::jsonb, 3),
    ('00000000-0000-0000-0000-000000000004', 'Enterprise', 'enterprise', 'Unlimited hiring with dedicated support', 99900, 999000, -1, -1, -1,
     '["all_features","sso","scim","custom_roles","audit_log","data_residency","dedicated_support","sla","white_label"]'::jsonb, 4)
ON CONFLICT (slug) DO NOTHING;
