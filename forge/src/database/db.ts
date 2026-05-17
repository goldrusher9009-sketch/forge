import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Database connection pool and migration manager
 * Handles PostgreSQL connections, query execution, and schema migrations
 */

export class Database {
  private pool: Pool;
  private isInitialized = false;

  constructor(connectionConfig: {
    user: string;
    password: string;
    host: string;
    port: number;
    database: string;
  }) {
    this.pool = new Pool({
      ...connectionConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    this.pool.on('connect', () => {
      logger.debug('New database connection established');
    });
  }

  /**
   * Initialize database: run migrations and set up connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Database already initialized');
      return;
    }

    try {
      await this.pool.query('SELECT NOW()');
      logger.info('✓ Database connection successful');

      await this.runMigrations();
      this.isInitialized = true;
      logger.info('✓ Database initialized with all migrations');
    } catch (error) {
      logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  /**
   * Run all pending migrations in order
   */
  private async runMigrations(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Create migrations tracking table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const migrationsDir = path.join(__dirname, 'migrations');
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));

      for (const file of files.sort()) {
        const migrationName = file.replace('.ts', '');
        const { up, down } = require(path.join(migrationsDir, file));

        // Check if migration already executed
        const result = await client.query(
          'SELECT id FROM schema_migrations WHERE name = $1',
          [migrationName]
        );

        if (result.rows.length === 0) {
          logger.info(`Running migration: ${migrationName}`);
          await client.query('BEGIN');
          try {
            await up(client);
            await client.query(
              'INSERT INTO schema_migrations (name) VALUES ($1)',
              [migrationName]
            );
            await client.query('COMMIT');
            logger.info(`✓ Migration completed: ${migrationName}`);
          } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`✗ Migration failed: ${migrationName}`, error);
            throw error;
          }
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query and return results
   */
  async query<T = any>(
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, values);
      const duration = Date.now() - start;
      if (duration > 1000) {
        logger.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
      }
      return result;
    } catch (error) {
      logger.error('Query error', { text: text.substring(0, 100), error });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client for complex operations requiring transaction management
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  /**
   * Health check: verify database is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1');
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export function initializeDatabase(config: {
  user: string;
  password: string;
  host: string;
  port: number;
  database: string;
}): Database {
  if (!dbInstance) {
    dbInstance = new Database(config);
  }
  return dbInstance;
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return dbInstance;
}
