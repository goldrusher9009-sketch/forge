/**
 * Database Migration System
 *
 * Manages schema version control and incremental migrations.
 */

import { DatabaseConnection } from './connection';

export interface Migration {
  version: number;
  name: string;
  up: (connection: DatabaseConnection) => Promise<void>;
  down: (connection: DatabaseConnection) => Promise<void>;
}

export interface MigrationStatus {
  version: number;
  name: string;
  appliedAt: Date;
}

/**
 * Migration Manager
 *
 * Tracks and applies database migrations in order.
 */
export class MigrationManager {
  private connection: DatabaseConnection;
  private migrations: Migration[] = [];
  private appliedMigrations: Set<number> = new Set();

  constructor(connection: DatabaseConnection) {
    this.connection = connection;
  }

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    if (this.migrations.find(m => m.version === migration.version)) {
      throw new Error(`Migration version ${migration.version} already registered`);
    }
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Initialize migration tracking table
   */
  async initialize(): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      // Get connection and execute
      const conn = await this.connection.acquire();
      try {
        await conn.exec(createTableSql);
      } finally {
        this.connection.release(conn);
      }

      // Load applied migrations
      await this.loadAppliedMigrations();
    } catch (error) {
      throw new Error(`Failed to initialize migrations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load applied migrations from database
   */
  private async loadAppliedMigrations(): Promise<void> {
    const sql = 'SELECT version FROM _migrations ORDER BY version';

    try {
      const conn = await this.connection.acquire();
      try {
        const result = await conn.query(sql);
        this.appliedMigrations.clear();

        if (Array.isArray(result)) {
          (result as Array<{ version: number }>).forEach(row => {
            this.appliedMigrations.add(row.version);
          });
        }
      } finally {
        this.connection.release(conn);
      }
    } catch (error) {
      console.warn('Could not load applied migrations:', error);
    }
  }

  /**
   * Apply all pending migrations
   */
  async migrate(): Promise<MigrationStatus[]> {
    const applied: MigrationStatus[] = [];

    for (const migration of this.migrations) {
      if (!this.appliedMigrations.has(migration.version)) {
        try {
          await migration.up(this.connection);
          await this.recordMigration(migration);
          this.appliedMigrations.add(migration.version);

          applied.push({
            version: migration.version,
            name: migration.name,
            appliedAt: new Date()
          });
        } catch (error) {
          throw new Error(
            `Failed to apply migration ${migration.version} (${migration.name}): ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    return applied;
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<void> {
    const sortedMigrations = [...this.migrations].sort((a, b) => b.version - a.version);

    for (const migration of sortedMigrations) {
      if (this.appliedMigrations.has(migration.version)) {
        try {
          await migration.down(this.connection);
          await this.removeMigration(migration);
          this.appliedMigrations.delete(migration.version);
          return;
        } catch (error) {
          throw new Error(
            `Failed to rollback migration ${migration.version} (${migration.name}): ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    throw new Error('No migrations to rollback');
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    const sql = 'INSERT INTO _migrations (version, name) VALUES ($1, $2)';
    const params = [migration.version, migration.name];

    const conn = await this.connection.acquire();
    try {
      await conn.query(sql, params);
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Remove migration record
   */
  private async removeMigration(migration: Migration): Promise<void> {
    const sql = 'DELETE FROM _migrations WHERE version = $1';
    const params = [migration.version];

    const conn = await this.connection.acquire();
    try {
      await conn.query(sql, params);
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Get status of all migrations
   */
  async getStatus(): Promise<MigrationStatus[]> {
    const sql = 'SELECT version, name, applied_at FROM _migrations ORDER BY version';

    const conn = await this.connection.acquire();
    try {
      const result = await conn.query(sql);
      return (Array.isArray(result) ? result : []) as MigrationStatus[];
    } finally {
      this.connection.release(conn);
    }
  }

  /**
   * Get pending migrations
   */
  getPending(): Migration[] {
    return this.migrations.filter(m => !this.appliedMigrations.has(m.version));
  }
}

export default MigrationManager;
