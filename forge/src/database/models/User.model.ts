/**
 * User Model
 * Represents the user entity with authentication, profile, and security data
 */

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuth {
  id: string;
  email: string;
  passwordHash: string;
  passwordChangedAt?: Date;
  passwordExpiresAt?: Date;
  passwordHistory: string[]; // Last 5 hashed passwords
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  lastLogin?: Date;
  lastIpAddress?: string;
  lastUserAgent?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  role: 'user' | 'admin' | 'agent' | 'service';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface UserPermission {
  id: string;
  userId: string;
  permission: string; // e.g., 'read:profile', 'write:workflow'
  scope?: string; // e.g., 'own', 'team', 'org'
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface User extends UserProfile, UserAuth, Omit<UserRole, 'id' | 'userId'> {
  permissions: string[];
  mfaVerified: boolean;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  isActive: boolean;
  deletedAt?: Date; // Soft delete
}

/**
 * Database Table Schema for users
 */
export const UserTableSchema = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  bio TEXT,
  company VARCHAR(255),
  website VARCHAR(255),
  location VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'agent', 'service')),
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret VARCHAR(255),
  mfa_backup_codes TEXT[], -- Array of backup codes
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  password_expires_at TIMESTAMPTZ,
  password_history TEXT[], -- Array of hashed passwords
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_ip_address VARCHAR(45),
  last_user_agent TEXT,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ, -- Soft delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
  ON users FOR EACH ROW EXECUTE FUNCTION update_users_updated_at_column();
`;

/**
 * User Permissions Table Schema
 */
export const UserPermissionsTableSchema = `
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  scope VARCHAR(50) DEFAULT 'own' CHECK (scope IN ('own', 'team', 'org')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission, scope)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_permissions_is_active ON user_permissions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at);
`;
