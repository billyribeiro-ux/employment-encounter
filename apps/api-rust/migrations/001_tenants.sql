-- Migration 001: Tenants
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'solo' CHECK (tier IN ('solo', 'growing', 'scale', 'demo')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'offboarding', 'deleted')),
    settings JSONB NOT NULL DEFAULT '{}',
    stripe_customer_id VARCHAR(255),
    kms_key_id VARCHAR(255) NOT NULL,
    onboarding_completed_at TIMESTAMPTZ,
    offboarding_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
