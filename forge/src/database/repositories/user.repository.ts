import { PoolClient } from 'pg';
import { getDatabase } from '../db';
import { UserProfile, UserAuth, UserRole } from '../models/User.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * User Repository - Data access layer for user operations
 * Handles CRUD operations on users, roles, and permissions
 */

export class UserRepository {
  /**
   * Create a new user with authentication credentials
   */
  async createUser(userData: {
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    organization_id?: string;
  }): Promise<UserProfile> {
    const db = getDatabase();
    const userId = uuidv4();

    const result = await db.query(
      `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name,
        avatar_url, organization_id, is_active, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, false)
      RETURNING *
      `,
      [
        userId,
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.avatar_url || null,
        userData.organization_id || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user with all permissions
   */
  async getUserWithPermissions(userId: string): Promise<(UserProfile & { permissions: string[] }) | null> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT 
        u.*,
        ARRAY_AGG(DISTINCT up.permission) FILTER (WHERE up.permission IS NOT NULL) as permissions
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      WHERE u.id = $1 AND u.deleted_at IS NULL
      GROUP BY u.id
      `,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const db = getDatabase();
    const fields = Object.keys(updates)
      .filter(key => updates[key as keyof UserProfile] !== undefined)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    if (!fields) return this.getUserById(userId);

    const values = [userId, ...Object.values(updates).filter(v => v !== undefined)];

    const result = await db.query(
      `
      UPDATE users
      SET ${fields}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
      `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2 AND deleted_at IS NULL
      `,
      [newPasswordHash, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Verify email
   */
  async verifyEmail(userId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE users
      SET email_verified = true, email_verified_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Soft delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Permanently delete user (hard delete)
   */
  async permanentlyDeleteUser(userId: string): Promise<boolean> {
    const db = getDatabase();
    return db.transaction(async (client: PoolClient) => {
      // Delete all related data first
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM mfa_configs WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM api_keys WHERE user_id = $1', [userId]);
      
      // Delete user
      const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
      return result.rowCount > 0;
    });
  }

  /**
   * List users with pagination
   */
  async listUsers(offset: number = 0, limit: number = 50): Promise<{
    users: UserProfile[];
    total: number;
  }> {
    const db = getDatabase();
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'
    );
    
    const result = await db.query(
      `
      SELECT * FROM users
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      OFFSET $1 LIMIT $2
      `,
      [offset, limit]
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
      `,
      [userId, roleId]
    );
    return result.rowCount > 0;
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    return result.rowCount > 0;
  }

  /**
   * Grant permission to user
   */
  async grantPermission(
    userId: string,
    permission: string,
    scope: 'own' | 'team' | 'org'
  ): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      INSERT INTO user_permissions (id, user_id, permission, scope)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, permission, scope) DO NOTHING
      `,
      [uuidv4(), userId, permission, scope]
    );
    return result.rowCount > 0;
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(
    userId: string,
    permission: string,
    scope?: 'own' | 'team' | 'org'
  ): Promise<boolean> {
    const db = getDatabase();
    
    let query = 'DELETE FROM user_permissions WHERE user_id = $1 AND permission = $2';
    const params = [userId, permission];

    if (scope) {
      query += ' AND scope = $3';
      params.push(scope);
    }

    const result = await db.query(query, params);
    return result.rowCount > 0;
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    permission: string,
    scope?: 'own' | 'team' | 'org'
  ): Promise<boolean> {
    const db = getDatabase();
    
    let query = `
      SELECT 1 FROM user_permissions
      WHERE user_id = $1 AND permission = $2
    `;
    const params = [userId, permission];

    if (scope) {
      query += ' AND scope = $3';
      params.push(scope);
    }

    const result = await db.query(query, params);
    return result.rows.length > 0;
  }

  /**
   * Get all users in organization
   */
  async getUsersByOrganization(organizationId: string): Promise<UserProfile[]> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT * FROM users
      WHERE organization_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [organizationId]
    );
    return result.rows;
  }

  /**
   * Enable MFA for user
   */
  async enableMFA(userId: string, mfaType: string, secret: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE users
      SET mfa_enabled = true, mfa_method = $1
      WHERE id = $2 AND deleted_at IS NULL
      `,
      [mfaType, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE users
      SET mfa_enabled = false, mfa_method = NULL
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [userId]
    );
    return result.rowCount > 0;
  }
}

export const userRepository = new UserRepository();
