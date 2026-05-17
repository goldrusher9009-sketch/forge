/**
 * Audit Log Model
 * Persistent audit logging for compliance and security monitoring
 */

export interface AuditLog {
  id: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource: string;
  action: string;
  changes?: Record<string, { before: any; after: any }>;
  status: 'success' | 'failure';
  errorMessage?: string;
  additionalData?: Record<string, any>;
  createdAt: Date;
}

/**
 * Database Table Schema for persistent audit logs
 */
export const AuditLogTableSchema = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  resource VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  additional_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_severity ON audit_logs(created_at DESC, severity);

-- Partitioning for large audit log tables (monthly)
CREATE TABLE IF NOT EXISTS audit_logs_2025_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-05-01'::timestamp) TO ('2025-06-01'::timestamp);

CREATE TABLE IF NOT EXISTS audit_logs_2025_06 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-06-01'::timestamp) TO ('2025-07-01'::timestamp);

-- View for critical events
CREATE OR REPLACE VIEW critical_audit_events AS
SELECT * FROM audit_logs
WHERE severity = 'CRITICAL'
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- View for security events
CREATE OR REPLACE VIEW security_audit_events AS
SELECT * FROM audit_logs
WHERE event_type IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGED', 'MFA_ENABLED', 'MFA_DISABLED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED')
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;
`;

/**
 * Database Table Schema for rate limit tracking
 */
export const RateLimitTableSchema = `
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL, -- e.g., user_id, ip_address, api_key
  limit_type VARCHAR(50) NOT NULL, -- e.g., 'auth', 'api', 'webhook'
  requests INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  exceeded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(key, limit_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_limit_type ON rate_limits(limit_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_exceeded ON rate_limits(exceeded);

-- Cleanup old rate limit records (older than 90 days)
-- This should be run as a scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_end < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
`;

/**
 * Database Table Schema for MFA configurations
 */
export const MfaConfigTableSchema = `
CREATE TABLE IF NOT EXISTS mfa_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup_codes')),
  secret VARCHAR(255),
  phone_number VARCHAR(20),
  backup_codes TEXT[],
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mfa_configs_user_id ON mfa_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_configs_method ON mfa_configs(method);
CREATE INDEX IF NOT EXISTS idx_mfa_configs_enabled ON mfa_configs(enabled);

CREATE TRIGGER update_mfa_configs_updated_at BEFORE UPDATE
  ON mfa_configs FOR EACH ROW EXECUTE FUNCTION update_mfa_configs_updated_at_column();
`;
