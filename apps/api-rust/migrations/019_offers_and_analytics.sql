-- ============================================================================
-- Migration 019: Offers, Candidate Notes, Favorites & Pipeline Analytics
-- ============================================================================

-- Offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    application_id UUID NOT NULL REFERENCES applications(id),
    job_id UUID NOT NULL REFERENCES job_posts(id),
    candidate_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    title VARCHAR(255) NOT NULL,
    base_salary_cents BIGINT,
    salary_currency VARCHAR(10) DEFAULT 'USD',
    equity_pct NUMERIC(5,2),
    signing_bonus_cents BIGINT,
    start_date DATE,
    expiry_date DATE,
    benefits_summary TEXT,
    custom_terms TEXT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    declined_at TIMESTAMPTZ,
    decline_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers' AND policyname = 'offers_tenant_isolation') THEN
        CREATE POLICY offers_tenant_isolation ON offers FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'offers' AND policyname = 'offers_tenant_insert') THEN
        CREATE POLICY offers_tenant_insert ON offers FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

-- Candidate notes (employer-side notes on candidates)
CREATE TABLE IF NOT EXISTS candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL,
    application_id UUID,
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    note_type VARCHAR(32) DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_notes FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_notes' AND policyname = 'candidate_notes_tenant_isolation') THEN
        CREATE POLICY candidate_notes_tenant_isolation ON candidate_notes FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_notes' AND policyname = 'candidate_notes_tenant_insert') THEN
        CREATE POLICY candidate_notes_tenant_insert ON candidate_notes FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

-- Candidate favorites/shortlist
CREATE TABLE IF NOT EXISTS candidate_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    job_id UUID,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, candidate_id, user_id, job_id)
);

ALTER TABLE candidate_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_favorites FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_favorites' AND policyname = 'candidate_favorites_tenant_isolation') THEN
        CREATE POLICY candidate_favorites_tenant_isolation ON candidate_favorites FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_favorites' AND policyname = 'candidate_favorites_tenant_insert') THEN
        CREATE POLICY candidate_favorites_tenant_insert ON candidate_favorites FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

-- Hiring pipeline analytics snapshots
CREATE TABLE IF NOT EXISTS pipeline_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_id UUID REFERENCES job_posts(id),
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    stage VARCHAR(64) NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pipeline_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_snapshots FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_snapshots' AND policyname = 'pipeline_snapshots_tenant_isolation') THEN
        CREATE POLICY pipeline_snapshots_tenant_isolation ON pipeline_snapshots FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pipeline_snapshots' AND policyname = 'pipeline_snapshots_tenant_insert') THEN
        CREATE POLICY pipeline_snapshots_tenant_insert ON pipeline_snapshots FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_offers_tenant ON offers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offers_application ON offers(application_id);
CREATE INDEX IF NOT EXISTS idx_candidate_notes_tenant ON candidate_notes(tenant_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_favorites_tenant ON candidate_favorites(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_snapshots_tenant ON pipeline_snapshots(tenant_id, snapshot_date);
