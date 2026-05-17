/**
 * Repository Pattern Implementation
 *
 * Provides data access abstraction for different entity types.
 * Implements CRUD operations and query building.
 */

import { DatabaseConnection } from './connection';

export interface QueryOptions {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  select?: string[];
}

export interface InsertOptions {
  onConflict?: 'ignore' | 'replace';
}

export interface UpdateOptions {
  where: Record<string, unknown>;
}

export interface DeleteOptions {
  where: Record<string, unknown>;
}

/**
 * Base Repository
 *
 * Provides common CRUD and query operations for any entity.
 */
export abstract class Repository<T extends Record<string, unknown>> {
  protected tableName: string;
  protected connection: DatabaseConnection;
  protected primaryKey: string = 'id';

  constructor(tableName: string, connection: DatabaseConnection) {
    this.tableName = tableName;
    this.connection = connection;
  }

  /**
   * Create/Insert entity
   */
  async create(data: Partial<T>, options?: InsertOptions): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    let sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    if (options?.onConflict === 'ignore') {
      sql += ' ON CONFLICT DO NOTHING';
    } else if (options?.onConflict === 'replace') {
      sql += ' ON CONFLICT (${this.primaryKey}) DO UPDATE SET ';
      sql += keys.map(k => `${k} = EXCLUDED.${k}`).join(', ');
    }

    sql += ` RETURNING *`;

    const conn = await this.connection.acquire();
    try {
      const result = await conn.query(sql, values);
      return result as T;
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Read/Find by ID
   */
  async findById(id: unknown): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = $1`;

    const conn = await this.connection.acquire();
    try {
      const result = await conn.query(sql, [id]);
      return result as T | null;
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Find with query options
   */
  async find(options?: QueryOptions): Promise<T[]> {
    let sql = `SELECT ${options?.select ? options.select.join(', ') : '*'} FROM ${this.tableName}`;

    const params: unknown[] = [];
    let paramIndex = 1;

    // WHERE clause
    if (options?.where) {
      const conditions = Object.entries(options.where).map(([key, value]) => {
        if (value === null) {
          return `${key} IS NULL`;
        }
        params.push(value);
        return `${key} = $${paramIndex++}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // ORDER BY clause
    if (options?.orderBy) {
      const orderClauses = Object.entries(options.orderBy)
        .map(([key, direction]) => `${key} ${direction.toUpperCase()}`)
        .join(', ');
      sql += ` ORDER BY ${orderClauses}`;
    }

    // LIMIT clause
    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    // OFFSET clause
    if (options?.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    const conn = await this.connection.acquire();
    try {
      const result = await conn.query(sql, params);
      return (result as T[]) || [];
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Find one record
   */
  async findOne(options?: QueryOptions): Promise<T | null> {
    const results = await this.find({
      ...options,
      limit: 1
    });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Count records
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params: unknown[] = [];

    if (where) {
      const conditions = Object.entries(where).map(([key, value], idx) => {
        if (value === null) {
          return `${key} IS NULL`;
        }
        params.push(value);
        return `${key} = $${idx + 1}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const conn = await this.connection.acquire();
    try {
      const result = await conn.query(sql, params) as { count: number };
      return result?.count || 0;
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Update entity
   */
  async update(data: Partial<T>, options: UpdateOptions): Promise<T[]> {
    const keys = Object.keys(data);
    const values = Object.values(data);

    let paramIndex = 1;
    const setClause = keys.map(k => `${k} = $${paramIndex++}`).join(', ');

    const whereConditions = Object.entries(options.where).map(([key, value]) => {
      if (value === null) {
        return `${key} IS NULL`;
      }
      values.push(value);
      return `${key} = $${paramIndex++}`;
    });

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${whereConditions.join(' AND ')} RETURNING *`;

    const conn = await this.connection.acquire();
    try {
      const result = await conn.query(sql, values);
      return (result as T[]) || [];
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Delete records
   */
  async delete(options: DeleteOptions): Promise<number> {
    const params: unknown[] = [];
    const conditions = Object.entries(options.where).map(([key, value], idx) => {
      if (value === null) {
        return `${key} IS NULL`;
      }
      params.push(value);
      return `${key} = $${idx + 1}`;
    });

    const sql = `DELETE FROM ${this.tableName} WHERE ${conditions.join(' AND ')}`;

    const conn = await this.connection.acquire();
    try {
      await conn.exec(sql);
      return params.length; // Simplified - would need actual row count
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Execute raw query
   */
  async query(sql: string, params?: unknown[]): Promise<unknown> {
    const conn = await this.connection.acquire();
    try {
      return await conn.query(sql, params);
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Execute raw command
   */
  async exec(sql: string): Promise<void> {
    const conn = await this.connection.acquire();
    try {
      await conn.exec(sql);
    } finally {
      this.connection.release(conn);
    }
  }
}

export default Repository;
