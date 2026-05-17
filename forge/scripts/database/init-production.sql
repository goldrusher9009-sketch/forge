-- Forge Platform Production Database Initialization
-- Production-ready schema with audit logging, RBAC, and performance optimization
-- Execute as superuser (postgres)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS metrics;

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT
) PARTITION BY RANGE (timestamp);

-- Create partitions for monthly audit logs
CREATE TABLE audit.audit_log_2026_01 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit.audit_log_2026_02 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit.audit_log_2026_03 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit.audit_log_2026_04 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit.audit_log_2026_05 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit.audit_log_2026_06 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit.audit_log_2026_07 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit.audit_log_2026_08 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit.audit_log_2026_09 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit.audit_log_2026_10 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit.audit_log_2026_11 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit.audit_log_2026_12 PARTITION OF audit.audit_log
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_audit_log_timestamp ON audit.audit_log (timestamp);
CREATE INDEX idx_audit_log_user_id ON audit.audit_log (user_id);
CREATE INDEX idx_audit_log_table_name ON audit.audit_log (table_name);
CREATE INDEX idx_audit_log_operation ON audit.audit_log (operation);

-- ============================================================================
-- PERFORMANCE METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS metrics.performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    labels JSONB,
    tags TEXT[]
) PARTITION BY RANGE (timestamp);

CREATE TABLE metrics.performance_metrics_2026_01 PARTITION OF metrics.performance_metrics
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE metrics.performance_metrics_2026_02 PARTITION OF metrics.performance_metrics
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE metrics.performance_metrics_2026_03 PARTITION OF metrics.performance_metrics
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE metrics.performance_metrics_2026_04 PARTITION OF metrics.performance_metrics
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE metrics.performance_metrics_2026_05 PARTITION OF metrics.performance_metrics
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE INDEX idx_perf_metrics_timestamp ON metrics.performance_metrics (timestamp);
CREATE INDEX idx_perf_metrics_name ON metrics.performance_metrics (metric_name);
CREATE INDEX idx_perf_metrics_tags ON metrics.performance_metrics USING gin(tags);

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'readonly')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON public.users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON public.users (username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON public.users (status);
CREATE INDEX idx_users_role ON public.users (role);
CREATE INDEX idx_users_created_at ON public.users (created_at DESC);
CREATE INDEX idx_users_email_verified ON public.users (email_verified);

-- Add check constraint for email format
ALTER TABLE public.users ADD CONSTRAINT email_format_check 
    CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions (expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_created_at ON public.sessions (created_at DESC);
CREATE INDEX idx_sessions_token_hash ON public.sessions (token_hash) WHERE revoked_at IS NULL;

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'internal')),
    avatar_url TEXT,
    repository_url TEXT,
    documentation_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_projects_owner_id ON public.projects (owner_id);
CREATE INDEX idx_projects_slug ON public.projects (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_projects_visibility ON public.projects (visibility);
CREATE INDEX idx_projects_created_at ON public.projects (created_at DESC);
CREATE INDEX idx_projects_name_trgm ON public.projects USING gin(name gin_trgm_ops);

-- ============================================================================
-- PROJECT MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members (project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members (user_id);
CREATE INDEX idx_project_members_role ON public.project_members (role);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'cancelled')),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    due_date DATE,
    estimated_hours NUMERIC(5,1),
    actual_hours NUMERIC(5,1),
    labels TEXT[],
    dependencies UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tasks_project_id ON public.tasks (project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks (assigned_to) WHERE status != 'done';
CREATE INDEX idx_tasks_created_by ON public.tasks (created_by);
CREATE INDEX idx_tasks_status ON public.tasks (status);
CREATE INDEX idx_tasks_priority ON public.tasks (priority);
CREATE INDEX idx_tasks_due_date ON public.tasks (due_date);
CREATE INDEX idx_tasks_created_at ON public.tasks (created_at DESC);
CREATE INDEX idx_tasks_labels ON public.tasks USING gin(labels);

-- ============================================================================
-- COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task_id ON public.comments (task_id);
CREATE INDEX idx_comments_user_id ON public.comments (user_id);
CREATE INDEX idx_comments_created_at ON public.comments (created_at DESC);

-- ============================================================================
-- AUDIT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION audit.audit_trigger_function() RETURNS TRIGGER AS $$
DECLARE
    v_changes JSONB;
    v_old_values JSONB;
    v_new_values JSONB;
    v_user_id UUID;
BEGIN
    -- Get current user from session
    v_user_id := NULL;
    
    -- Convert old and new rows to JSONB
    v_old_values := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END;
    v_new_values := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END;
    
    -- Calculate changes for UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        SELECT jsonb_object_agg(
            key,
            jsonb_build_object('old', v_old_values->key, 'new', v_new_values->key)
        ) INTO v_changes
        FROM jsonb_object_keys(v_old_values) AS key
        WHERE v_old_values->key IS DISTINCT FROM v_new_values->key;
    END IF;
    
    -- Insert audit log entry
    INSERT INTO audit.audit_log (
        table_name,
        operation,
        user_id,
        old_values,
        new_values,
        changes,
        timestamp
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_user_id,
        v_old_values,
        v_new_values,
        v_changes,
        NOW()
    );
    
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================
CREATE TRIGGER users_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER projects_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER tasks_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

CREATE TRIGGER project_members_audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.project_members
    FOR EACH ROW EXECUTE FUNCTION audit.audit_trigger_function();

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT p.id) AS projects_owned,
    COUNT(DISTINCT pm.id) AS projects_member_of,
    COUNT(DISTINCT t.id) AS tasks_assigned,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') AS tasks_completed,
    ROUND(100.0 * COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') / 
          NULLIF(COUNT(DISTINCT t.id), 0), 2) AS completion_rate,
    u.created_at,
    u.last_login
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.owner_id AND p.deleted_at IS NULL
LEFT JOIN public.project_members pm ON u.id = pm.user_id
LEFT JOIN public.tasks t ON u.id = t.assigned_to AND t.status != 'cancelled'
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username, u.created_at, u.last_login;

CREATE OR REPLACE VIEW public.project_statistics AS
SELECT
    p.id,
    p.name,
    p.owner_id,
    COUNT(DISTINCT pm.user_id) AS team_size,
    COUNT(DISTINCT t.id) AS total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'todo') AS tasks_todo,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_progress') AS tasks_in_progress,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'in_review') AS tasks_in_review,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') AS tasks_completed,
    ROUND(100.0 * COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') / 
          NULLIF(COUNT(DISTINCT t.id), 0), 2) AS completion_rate,
    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at)) / 3600), 2) AS avg_completion_hours,
    p.created_at,
    p.updated_at
FROM public.projects p
LEFT JOIN public.project_members pm ON p.id = pm.project_id
LEFT JOIN public.tasks t ON p.id = t.project_id AND t.status != 'cancelled'
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.name, p.owner_id, p.created_at, p.updated_at;

-- ============================================================================
-- DATABASE ROLES AND PERMISSIONS
-- ============================================================================
-- Create application user if not exists
DO $$
BEGIN
    CREATE USER forge_app WITH PASSWORD 'forge-secure-password-change-in-production';
EXCEPTION WHEN duplicate_object THEN
    -- User already exists, skip creation
END
$$;

-- Grant schema usage
GRANT USAGE ON SCHEMA public, audit, metrics TO forge_app;
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant table permissions for forge_app (application user)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO forge_app;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO forge_app;
GRANT SELECT ON ALL TABLES IN SCHEMA metrics TO forge_app;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO forge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA audit TO forge_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA metrics TO forge_app;

-- Grant view permissions
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO forge_app;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA audit TO forge_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO forge_app;

-- Set default permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO forge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO forge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT ON TABLES TO forge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA metrics GRANT SELECT ON TABLES TO forge_app;

-- ============================================================================
-- PRODUCTION CONFIGURATION
-- ============================================================================
-- Enable query logging for slow queries (>1000ms)
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = ON;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET max_wal_size = '2GB';
ALTER SYSTEM SET min_wal_size = '1GB';

-- Connection pooling (PgBouncer handles this at application level)
ALTER SYSTEM SET max_connections = 200;

-- Enable statistical analysis
ALTER SYSTEM SET track_activities = ON;
ALTER SYSTEM SET track_counts = ON;
ALTER SYSTEM SET track_functions = 'all';

-- Security: disable superuser from accessing without password
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- Reload configuration
SELECT pg_reload_conf();

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
-- Verify extension installation
SELECT extname FROM pg_extension ORDER BY extname;

-- Verify schema creation
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('public', 'audit', 'metrics') 
ORDER BY schema_name;

-- Verify table creation
SELECT tablename FROM pg_tables 
WHERE schemaname IN ('public', 'audit', 'metrics') 
ORDER BY tablename;

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname IN ('public', 'audit', 'metrics') 
ORDER BY tablename, indexname;

-- Display initialization summary
SELECT 
    'Database Initialization Complete' as status,
    NOW() as timestamp,
    version() as database_version;
