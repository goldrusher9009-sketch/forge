/**
 * API Key Model
 * Represents API keys for programmatic access and integrations
 */

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string; // Hashed in database
  keyPreview: string; // Last 8 characters visible
  scopes: string[]; // e.g., ['read:workflows', 'write:agents', 'read:executions']
  rateLimit?: {
    requests: number;
    window: 'minute' | 'hour' | 'day';
  };
  ipWhitelist?: string[]; // Optional IP restrictions
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyAudit {
  id: string;
  apiKeyId: string;
  action: 'created' | 'used' | 'rotated' | 'revoked' | 'regenerated';
  ipAddress: string;
  userAgent: string;
  success: boolean;
  error?: string;
  createdAt: Date;
}

/**
 * Database Table Schema for API keys
 */
export const ApiKeyTableSchema = `
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_preview VARCHAR(8) NOT NULL,
  scopes TEXT[] NOT NULL,
  rate_limit JSONB,
  ip_whitelist TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at DESC);

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE
  ON api_keys FOR EACH ROW EXECUTE FUNCTION update_api_keys_updated_at_column();
`;

/**
 * Database Table Schema for API key audit log
 */
export const ApiKeyAuditTableSchema = `
CREATE TABLE IF NOT EXISTS api_key_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'used', 'rotated', 'revoked', 'regenerated')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_key_audit_api_key_id ON api_key_audit(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_action ON api_key_audit(action);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_created_at ON api_key_audit(created_at DESC);
`;
