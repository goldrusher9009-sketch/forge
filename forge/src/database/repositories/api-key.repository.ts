import { getDatabase } from '../db';
import { ApiKey } from '../models/ApiKey.model';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * API Key Repository - Data access layer for API key operations
 * Handles creation, rotation, and revocation of API keys
 */

export class ApiKeyRepository {
  /**
   * Generate a secure API key
   */
  private generateKey(): string {
    return 'forge_' + crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash API key for storage
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Create new API key
   */
  async createKey(
    userId: string,
    organizationId: string,
    keyData: {
      name: string;
      scopes?: string[];
      ip_whitelist?: string[];
      rate_limit?: Record<string, any>;
      expires_at?: Date;
    }
  ): Promise<{ key: string; apiKeyRecord: ApiKey }> {
    const db = getDatabase();
    const keyId = uuidv4();
    const plainKey = this.generateKey();
    const hashedKey = this.hashKey(plainKey);

    const result = await db.query(
      `
      INSERT INTO api_keys (
        id, user_id, organization_id, name, key_hash, key_preview,
        scopes, ip_whitelist, rate_limit, expires_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      RETURNING *
      `,
      [
        keyId,
        userId,
        organizationId,
        keyData.name,
        hashedKey,
        plainKey.slice(-8),
        keyData.scopes || [],
        keyData.ip_whitelist || [],
        JSON.stringify(keyData.rate_limit || {}),
        keyData.expires_at || null,
      ]
    );

    const apiKeyRecord = this.formatApiKey(result.rows[0]);
    return { key: plainKey, apiKeyRecord };
  }

  /**
   * Verify API key (returns user/org info if valid)
   */
  async verifyKey(plainKey: string): Promise<(ApiKey & { user_id: string; organization_id: string }) | null> {
    const db = getDatabase();
    const hashedKey = this.hashKey(plainKey);

    const result = await db.query(
      `
      SELECT * FROM api_keys
      WHERE key_hash = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())
      `,
      [hashedKey]
    );

    if (result.rows.length === 0) return null;

    // Update last used timestamp
    await db.query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = $1',
      [result.rows[0].id]
    );

    return this.formatApiKey(result.rows[0]);
  }

  /**
   * Get API key by ID
   */
  async getKeyById(keyId: string): Promise<ApiKey | null> {
    const db = getDatabase();
    const result = await db.query(
      'SELECT * FROM api_keys WHERE id = $1 AND deleted_at IS NULL',
      [keyId]
    );
    return result.rows[0] ? this.formatApiKey(result.rows[0]) : null;
  }

  /**
   * List API keys for user
   */
  async listKeys(userId: string): Promise<ApiKey[]> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT * FROM api_keys
      WHERE user_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      `,
      [userId]
    );
    return result.rows.map(r => this.formatApiKey(r));
  }

  /**
   * Update API key (metadata only, not the actual key)
   */
  async updateKey(
    keyId: string,
    updates: Partial<ApiKey>
  ): Promise<ApiKey | null> {
    const db = getDatabase();
    const fields = Object.keys(updates)
      .filter(k => !['id', 'key_hash', 'key_preview'].includes(k))
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    if (!fields) return this.getKeyById(keyId);

    const values = [
      keyId,
      ...Object.entries(updates)
        .filter(([k]) => !['id', 'key_hash', 'key_preview'].includes(k))
        .map(([, v]) => (typeof v === 'object' ? JSON.stringify(v) : v)),
    ];

    const result = await db.query(
      `
      UPDATE api_keys
      SET ${fields}
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
      `,
      values
    );

    return result.rows[0] ? this.formatApiKey(result.rows[0]) : null;
  }

  /**
   * Rotate API key (revoke old, create new)
   */
  async rotateKey(keyId: string): Promise<{ newKey: string; apiKeyRecord: ApiKey } | null> {
    const db = getDatabase();
    
    const oldKey = await this.getKeyById(keyId);
    if (!oldKey) return null;

    return db.transaction(async (client) => {
      // Revoke old key
      await client.query(
        'UPDATE api_keys SET is_active = false, revoked_at = CURRENT_TIMESTAMP WHERE id = $1',
        [keyId]
      );

      // Create new key with same metadata
      const newKeyId = uuidv4();
      const plainKey = this.generateKey();
      const hashedKey = this.hashKey(plainKey);

      const result = await client.query(
        `
        INSERT INTO api_keys (
          id, user_id, organization_id, name, key_hash, key_preview,
          scopes, ip_whitelist, rate_limit, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING *
        `,
        [
          newKeyId,
          oldKey.user_id,
          oldKey.organization_id,
          oldKey.name,
          hashedKey,
          plainKey.slice(-8),
          JSON.stringify(oldKey.scopes),
          JSON.stringify(oldKey.ip_whitelist),
          JSON.stringify(oldKey.rate_limit),
          oldKey.expires_at,
        ]
      );

      return { newKey: plainKey, apiKeyRecord: this.formatApiKey(result.rows[0]) };
    });
  }

  /**
   * Revoke API key
   */
  async revokeKey(keyId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE api_keys
      SET is_active = false, revoked_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [keyId]
    );
    return result.rowCount > 0;
  }

  /**
   * Delete API key (soft delete)
   */
  async deleteKey(keyId: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.query(
      `
      UPDATE api_keys
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      `,
      [keyId]
    );
    return result.rowCount > 0;
  }

  /**
   * Check rate limit for key
   */
  async checkRateLimit(keyId: string, now: Date = new Date()): Promise<boolean> {
    const db = getDatabase();
    
    const key = await this.getKeyById(keyId);
    if (!key || !key.rate_limit || Object.keys(key.rate_limit).length === 0) {
      return true;
    }

    const windowMs = key.rate_limit.window_ms || 60000;
    const maxRequests = key.rate_limit.max_requests || 1000;
    const windowStart = new Date(now.getTime() - windowMs);

    const result = await db.query(
      `
      SELECT COUNT(*) FROM api_key_audit
      WHERE key_id = $1 AND created_at > $2
      `,
      [keyId, windowStart]
    );

    const requestCount = parseInt(result.rows[0].count, 10);
    return requestCount < maxRequests;
  }

  /**
   * Record API key audit event
   */
  async auditKeyUsage(
    keyId: string,
    auditData: {
      action: string;
      resource?: string;
      method?: string;
      status_code?: number;
      error?: string;
      ip_address?: string;
    }
  ): Promise<void> {
    const db = getDatabase();
    
    await db.query(
      `
      INSERT INTO api_key_audit (
        id, key_id, action, resource, method, status_code, error, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        uuidv4(),
        keyId,
        auditData.action,
        auditData.resource || null,
        auditData.method || null,
        auditData.status_code || null,
        auditData.error || null,
        auditData.ip_address || null,
      ]
    );
  }

  /**
   * Get API key audit history
   */
  async getAuditHistory(keyId: string, limit: number = 100): Promise<any[]> {
    const db = getDatabase();
    const result = await db.query(
      `
      SELECT * FROM api_key_audit
      WHERE key_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [keyId, limit]
    );
    return result.rows;
  }

  /**
   * Format API key from database row
   */
  private formatApiKey(row: any): ApiKey {
    return {
      ...row,
      scopes: Array.isArray(row.scopes) ? row.scopes : JSON.parse(row.scopes || '[]'),
      ip_whitelist: Array.isArray(row.ip_whitelist) ? row.ip_whitelist : JSON.parse(row.ip_whitelist || '[]'),
      rate_limit: typeof row.rate_limit === 'string' ? JSON.parse(row.rate_limit) : row.rate_limit,
    };
  }
}

export const apiKeyRepository = new ApiKeyRepository();
