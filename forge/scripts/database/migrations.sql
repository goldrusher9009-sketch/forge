-- Forge Platform Database Migrations
-- Version-controlled schema changes for production deployments
-- Usage: psql -d forge -f migrations.sql

-- ============================================================================
-- MIGRATION: 001_initial_schema.sql (Completed in init-production.sql)
-- Description: Initialize core schema with users, projects, tasks, and audit logging
-- Status: APPLIED
-- ============================================================================

-- ============================================================================
-- MIGRATION: 002_add_api_keys_table.sql
-- Description: Add API keys table for service authentication
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT UNIQUE,
    permissions TEXT[] DEFAULT ARRAY['read']::TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys (user_id);
CREATE INDEX idx_api_keys_prefix ON public.api_keys (prefix) WHERE revoked_at IS NULL;
CREATE INDEX idx_api_keys_expires_at ON public.api_keys (expires_at) WHERE revoked_at IS NULL;

CREATE TRIGGER api_keys_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- ============================================================================
-- MIGRATION: 003_add_notifications_table.sql
-- Description: Add notifications table for user alerts
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_assigned', 'comment_added', 'project_updated', 'mention', 'system')),
    title TEXT NOT NULL,
    content TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications (is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON public.notifications (type);
CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications (expires_at);

-- Auto-cleanup of expired notifications
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications() RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION: 004_add_activity_log_table.sql
-- Description: Add activity log for user actions tracking
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    resource_name TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for monthly activity logs
CREATE TABLE public.activity_logs_2026_01 PARTITION OF public.activity_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE public.activity_logs_2026_02 PARTITION OF public.activity_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE public.activity_logs_2026_03 PARTITION OF public.activity_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.activity_logs_2026_04 PARTITION OF public.activity_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.activity_logs_2026_05 PARTITION OF public.activity_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs (action);

-- ============================================================================
-- MIGRATION: 005_add_file_storage_table.sql
-- Description: Add file storage metadata table for attachments
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    checksum_sha256 TEXT UNIQUE,
    is_public BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_files_user_id ON public.files (user_id);
CREATE INDEX idx_files_created_at ON public.files (created_at DESC);
CREATE INDEX idx_files_expires_at ON public.files (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_files_deleted_at ON public.files (deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER files_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.files
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- ============================================================================
-- MIGRATION: 006_add_webhooks_table.sql
-- Description: Add webhooks for event notifications
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    secret TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_project_id ON public.webhooks (project_id);
CREATE INDEX idx_webhooks_active ON public.webhooks (active);

-- Webhook deliveries log
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id BIGSERIAL PRIMARY KEY,
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 1,
    last_attempted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries (webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries (created_at DESC);

-- ============================================================================
-- MIGRATION: 007_add_rate_limiting_table.sql
-- Description: Add rate limiting tracking
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    ip_address INET,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CHECK (user_id IS NOT NULL OR api_key_id IS NOT NULL)
);

CREATE INDEX idx_rate_limits_user_id ON public.rate_limits (user_id);
CREATE INDEX idx_rate_limits_api_key_id ON public.rate_limits (api_key_id);
CREATE INDEX idx_rate_limits_window ON public.rate_limits (window_start, window_end);
CREATE INDEX idx_rate_limits_endpoint ON public.rate_limits (endpoint);

-- ============================================================================
-- MIGRATION: 008_add_backup_metadata_table.sql
-- Description: Track database backups for disaster recovery
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.backup_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_name TEXT NOT NULL UNIQUE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'wal')),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'verified')),
    size_bytes BIGINT,
    storage_location TEXT NOT NULL,
    checksum_sha256 TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    retention_days INTEGER DEFAULT 30,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_backup_metadata_started_at ON public.backup_metadata (started_at DESC);
CREATE INDEX idx_backup_metadata_status ON public.backup_metadata (status);
CREATE INDEX idx_backup_metadata_expires_at ON public.backup_metadata (expires_at);

-- ============================================================================
-- MIGRATION: 009_add_custom_fields_table.sql
-- Description: Support custom fields on tasks
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'date', 'checkbox', 'textarea')),
    required BOOLEAN DEFAULT FALSE,
    options JSONB,
    position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX idx_custom_fields_project_id ON public.custom_fields (project_id);

-- Custom field values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, custom_field_id)
);

CREATE INDEX idx_custom_field_values_task_id ON public.custom_field_values (task_id);
CREATE INDEX idx_custom_field_values_field_id ON public.custom_field_values (custom_field_id);

-- ============================================================================
-- MIGRATION: 010_add_tags_table.sql
-- Description: Add full-text searchable tags
-- Status: PENDING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#808080',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, name)
);

CREATE INDEX idx_tags_project_id ON public.tags (project_id);
CREATE INDEX idx_tags_name_trgm ON public.tags USING gin(name gin_trgm_ops);

-- Task tags junction table
CREATE TABLE IF NOT EXISTS public.task_tags (
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX idx_task_tags_tag_id ON public.task_tags (tag_id);

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.migrations (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    execution_time_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed'))
);

-- Record all applied migrations
INSERT INTO public.migrations (version, description, status) VALUES
    ('001', 'Initial schema creation', 'success'),
    ('002', 'Add API keys table', 'success'),
    ('003', 'Add notifications table', 'success'),
    ('004', 'Add activity log table', 'success'),
    ('005', 'Add file storage table', 'success'),
    ('006', 'Add webhooks table', 'success'),
    ('007', 'Add rate limiting table', 'success'),
    ('008', 'Add backup metadata table', 'success'),
    ('009', 'Add custom fields table', 'success'),
    ('010', 'Add tags table', 'success')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
SELECT 
    'Database migrations completed' as status,
    COUNT(*) as total_migrations,
    COUNT(*) FILTER (WHERE status = 'success') as successful,
    COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM public.migrations;
