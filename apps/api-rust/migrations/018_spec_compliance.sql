-- ============================================================================
-- Migration 018: Apple ICT L7 Spec Compliance — Missing Tables
-- Adds versioning, message interactions, meeting events, video participants,
-- PiP state, plan features, subscription items, GDPR, security events,
-- keyboard shortcuts, and command palette analytics.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. VERSIONING
-- ──────────────────────────────────────────────────────────────────────────────

-- Candidate profile version snapshots
CREATE TABLE IF NOT EXISTS candidate_profile_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id),
    version_number INT NOT NULL DEFAULT 1,
    role_focus TEXT,
    snapshot JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profile_versions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_profile_versions' AND policyname = 'candidate_profile_versions_tenant_isolation') THEN
        CREATE POLICY candidate_profile_versions_tenant_isolation ON candidate_profile_versions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'candidate_profile_versions' AND policyname = 'candidate_profile_versions_tenant_insert') THEN
        CREATE POLICY candidate_profile_versions_tenant_insert ON candidate_profile_versions FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cpv_tenant ON candidate_profile_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cpv_candidate ON candidate_profile_versions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cpv_candidate_version ON candidate_profile_versions(tenant_id, candidate_id, version_number);

-- Job post version snapshots
CREATE TABLE IF NOT EXISTS job_post_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    job_id UUID NOT NULL REFERENCES job_posts(id),
    version_number INT NOT NULL DEFAULT 1,
    snapshot JSONB NOT NULL DEFAULT '{}',
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE job_post_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_post_versions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_post_versions' AND policyname = 'job_post_versions_tenant_isolation') THEN
        CREATE POLICY job_post_versions_tenant_isolation ON job_post_versions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_post_versions' AND policyname = 'job_post_versions_tenant_insert') THEN
        CREATE POLICY job_post_versions_tenant_insert ON job_post_versions FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jpv_tenant ON job_post_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jpv_job ON job_post_versions(job_id);
CREATE INDEX IF NOT EXISTS idx_jpv_job_version ON job_post_versions(tenant_id, job_id, version_number);
CREATE INDEX IF NOT EXISTS idx_jpv_changed_by ON job_post_versions(changed_by);

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. MESSAGE INTERACTIONS
-- ──────────────────────────────────────────────────────────────────────────────

-- Edit history for chat messages
CREATE TABLE IF NOT EXISTS message_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    previous_content TEXT NOT NULL,
    edited_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE message_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_edits FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_edits' AND policyname = 'message_edits_tenant_isolation') THEN
        CREATE POLICY message_edits_tenant_isolation ON message_edits FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_edits' AND policyname = 'message_edits_tenant_insert') THEN
        CREATE POLICY message_edits_tenant_insert ON message_edits FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_edits_tenant ON message_edits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_edits_message ON message_edits(message_id);
CREATE INDEX IF NOT EXISTS idx_message_edits_edited_by ON message_edits(edited_by);

-- Emoji reactions on chat messages
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'message_reactions_tenant_isolation') THEN
        CREATE POLICY message_reactions_tenant_isolation ON message_reactions FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'message_reactions' AND policyname = 'message_reactions_tenant_insert') THEN
        CREATE POLICY message_reactions_tenant_insert ON message_reactions FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_message_reactions_tenant ON message_reactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. MEETING STATUS TRACKING
-- ──────────────────────────────────────────────────────────────────────────────

-- Status change event log for meetings
CREATE TABLE IF NOT EXISTS meeting_status_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    meeting_id UUID NOT NULL REFERENCES meeting_requests(id),
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meeting_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_status_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_status_events' AND policyname = 'meeting_status_events_tenant_isolation') THEN
        CREATE POLICY meeting_status_events_tenant_isolation ON meeting_status_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meeting_status_events' AND policyname = 'meeting_status_events_tenant_insert') THEN
        CREATE POLICY meeting_status_events_tenant_insert ON meeting_status_events FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mse_tenant ON meeting_status_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mse_meeting ON meeting_status_events(meeting_id);
CREATE INDEX IF NOT EXISTS idx_mse_changed_by ON meeting_status_events(changed_by);
CREATE INDEX IF NOT EXISTS idx_mse_to_status ON meeting_status_events(tenant_id, to_status);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. VIDEO SESSION PARTICIPANTS & PiP
-- ──────────────────────────────────────────────────────────────────────────────

-- Per-participant tracking within a video session
CREATE TABLE IF NOT EXISTS video_session_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id UUID NOT NULL REFERENCES video_sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    connection_quality TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'
);

ALTER TABLE video_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_session_participants FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_session_participants' AND policyname = 'video_session_participants_tenant_isolation') THEN
        CREATE POLICY video_session_participants_tenant_isolation ON video_session_participants FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_session_participants' AND policyname = 'video_session_participants_tenant_insert') THEN
        CREATE POLICY video_session_participants_tenant_insert ON video_session_participants FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_vsp_tenant ON video_session_participants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vsp_session ON video_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_vsp_user ON video_session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_vsp_session_user ON video_session_participants(session_id, user_id);

-- PiP (Picture-in-Picture) session state tracking
CREATE TABLE IF NOT EXISTS pip_session_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id UUID NOT NULL REFERENCES video_sessions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    is_pip_active BOOLEAN NOT NULL DEFAULT false,
    pip_started_at TIMESTAMPTZ,
    pip_ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pip_session_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_session_states FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pip_session_states' AND policyname = 'pip_session_states_tenant_isolation') THEN
        CREATE POLICY pip_session_states_tenant_isolation ON pip_session_states FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pip_session_states' AND policyname = 'pip_session_states_tenant_insert') THEN
        CREATE POLICY pip_session_states_tenant_insert ON pip_session_states FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pss_tenant ON pip_session_states(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pss_session ON pip_session_states(session_id);
CREATE INDEX IF NOT EXISTS idx_pss_user ON pip_session_states(user_id);
CREATE INDEX IF NOT EXISTS idx_pss_active ON pip_session_states(tenant_id, is_pip_active) WHERE is_pip_active = true;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. BILLING EXTENSIONS
-- ──────────────────────────────────────────────────────────────────────────────

-- Feature definitions linked to subscription plans (global — no tenant_id)
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    limit_value BIGINT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS for plan_features — plans are global across tenants

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(plan_id, feature_key);

-- Subscription line-item tracking
CREATE TABLE IF NOT EXISTS subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    plan_feature_id UUID REFERENCES plan_features(id),
    quantity INT NOT NULL DEFAULT 1,
    unit_price_cents BIGINT NOT NULL DEFAULT 0,
    stripe_item_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_items FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_items' AND policyname = 'subscription_items_tenant_isolation') THEN
        CREATE POLICY subscription_items_tenant_isolation ON subscription_items FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscription_items' AND policyname = 'subscription_items_tenant_insert') THEN
        CREATE POLICY subscription_items_tenant_insert ON subscription_items FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_si_tenant ON subscription_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_si_subscription ON subscription_items(subscription_id);
CREATE INDEX IF NOT EXISTS idx_si_plan_feature ON subscription_items(plan_feature_id);
CREATE INDEX IF NOT EXISTS idx_si_stripe_item ON subscription_items(stripe_item_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. GDPR & PRIVACY
-- ──────────────────────────────────────────────────────────────────────────────

-- Consent records for GDPR/privacy compliance
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    consent_type TEXT NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consents' AND policyname = 'consents_tenant_isolation') THEN
        CREATE POLICY consents_tenant_isolation ON consents FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'consents' AND policyname = 'consents_tenant_insert') THEN
        CREATE POLICY consents_tenant_insert ON consents FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consents_tenant ON consents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_consents_user ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_type ON consents(tenant_id, user_id, consent_type);

-- GDPR deletion request workflow
CREATE TABLE IF NOT EXISTS deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deletion_requests' AND policyname = 'deletion_requests_tenant_isolation') THEN
        CREATE POLICY deletion_requests_tenant_isolation ON deletion_requests FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deletion_requests' AND policyname = 'deletion_requests_tenant_insert') THEN
        CREATE POLICY deletion_requests_tenant_insert ON deletion_requests FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dr_tenant ON deletion_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dr_user ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dr_status ON deletion_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dr_processed_by ON deletion_requests(processed_by);

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. SECURITY AUDIT TRAIL
-- ──────────────────────────────────────────────────────────────────────────────

-- Security-specific event log
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'security_events_tenant_isolation') THEN
        CREATE POLICY security_events_tenant_isolation ON security_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_events' AND policyname = 'security_events_tenant_insert') THEN
        CREATE POLICY security_events_tenant_insert ON security_events FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_se_tenant ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_se_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_se_event_type ON security_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_se_created_at ON security_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_se_ip ON security_events(ip_address);

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. KEYBOARD SHORTCUTS & COMMAND PALETTE
-- ──────────────────────────────────────────────────────────────────────────────

-- Keyboard shortcut customization profiles
CREATE TABLE IF NOT EXISTS shortcut_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL DEFAULT 'Default',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id, name)
);

ALTER TABLE shortcut_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcut_profiles FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shortcut_profiles' AND policyname = 'shortcut_profiles_tenant_isolation') THEN
        CREATE POLICY shortcut_profiles_tenant_isolation ON shortcut_profiles FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shortcut_profiles' AND policyname = 'shortcut_profiles_tenant_insert') THEN
        CREATE POLICY shortcut_profiles_tenant_insert ON shortcut_profiles FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sp_tenant ON shortcut_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sp_user ON shortcut_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_active ON shortcut_profiles(tenant_id, user_id) WHERE is_active = true;

-- Individual key binding records within a shortcut profile
CREATE TABLE IF NOT EXISTS shortcut_bindings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_id UUID NOT NULL REFERENCES shortcut_profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    keys TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'page', 'modal')),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shortcut_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcut_bindings FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shortcut_bindings' AND policyname = 'shortcut_bindings_tenant_isolation') THEN
        CREATE POLICY shortcut_bindings_tenant_isolation ON shortcut_bindings FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shortcut_bindings' AND policyname = 'shortcut_bindings_tenant_insert') THEN
        CREATE POLICY shortcut_bindings_tenant_insert ON shortcut_bindings FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sb_tenant ON shortcut_bindings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sb_profile ON shortcut_bindings(profile_id);
CREATE INDEX IF NOT EXISTS idx_sb_action ON shortcut_bindings(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_sb_scope ON shortcut_bindings(tenant_id, scope);

-- Shortcut usage analytics events
CREATE TABLE IF NOT EXISTS shortcut_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    keys TEXT NOT NULL,
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shortcut_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcut_usage_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shortcut_usage_events' AND policyname = 'shortcut_usage_events_tenant_isolation') THEN
        CREATE POLICY shortcut_usage_events_tenant_isolation ON shortcut_usage_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shortcut_usage_events' AND policyname = 'shortcut_usage_events_tenant_insert') THEN
        CREATE POLICY shortcut_usage_events_tenant_insert ON shortcut_usage_events FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sue_tenant ON shortcut_usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sue_user ON shortcut_usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sue_action ON shortcut_usage_events(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_sue_created_at ON shortcut_usage_events(tenant_id, created_at);

-- Command palette usage analytics
CREATE TABLE IF NOT EXISTS command_palette_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    query TEXT,
    selected_action TEXT,
    result_count INT,
    latency_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE command_palette_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_palette_events FORCE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'command_palette_events' AND policyname = 'command_palette_events_tenant_isolation') THEN
        CREATE POLICY command_palette_events_tenant_isolation ON command_palette_events FOR ALL
            USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'command_palette_events' AND policyname = 'command_palette_events_tenant_insert') THEN
        CREATE POLICY command_palette_events_tenant_insert ON command_palette_events FOR INSERT
            WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::UUID);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cpe_tenant ON command_palette_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cpe_user ON command_palette_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cpe_selected_action ON command_palette_events(tenant_id, selected_action);
CREATE INDEX IF NOT EXISTS idx_cpe_created_at ON command_palette_events(tenant_id, created_at);
