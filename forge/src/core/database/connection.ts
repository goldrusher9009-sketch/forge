/**
 * Database Connection Management
 *
 * Handles connection pooling, lifecycle management, and health checks.
 * Supports PostgreSQL and SQLite with configurable options.
 */

export type DatabaseDriver = 'postgres' | 'sqlite';

export interface ConnectionConfig {
  driver: DatabaseDriver;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filepath?: string; // For SQLite
  poolSize?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  ssl?: boolean;
}

export interface ConnectionPool {
  acquire(): Promise<Connection>;
  release(connection: Connection): void;
  drain(): Promise<void>;
  health(): Promise<boolean>;
  size(): number;
}

export interface Connection {
  query(sql: string, params?: unknown[]): Promise<unknown>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  isActive(): boolean;
  getLastUsed(): Date;
}

/**
 * Database Connection Manager
 *
 * Manages connection pooling and provides database access.
 */
export class DatabaseConnection {
  private config: ConnectionConfig;
  private pool: Map<string, Connection> = new Map();
  private activeConnections: Set<string> = new Set();
  private waiting: Array<{
    resolve: (conn: Connection) => void;
    reject: (error: Error) => void;
  }> = [];
  private poolSize: number = 0;
  private maxPoolSize: number;
  private healthCheckInterval: NodeJS.Timer | null = null;

  constructor(config: ConnectionConfig) {
    this.config = {
      poolSize: 10,
      connectionTimeout: 30000,
      idleTimeout: 900000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
    this.maxPoolSize = this.config.poolSize || 10;
  }

  /**
   * Initialize connection pool
   */
  async initialize(): Promise<void> {
    try {
      // Create initial connections
      const initialSize = Math.min(this.maxPoolSize, 2);
      for (let i = 0; i < initialSize; i++) {
        const conn = await this.createConnection();
        this.pool.set(`conn-${i}`, conn);
      }

      // Start health check interval
      this.startHealthCheck();
    } catch (error) {
      throw new Error(`Failed to initialize database connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(timeoutMs: number = this.config.connectionTimeout!): Promise<Connection> {
    // Return existing idle connection
    for (const [key, conn] of this.pool) {
      if (!this.activeConnections.has(key) && conn.isActive()) {
        this.activeConnections.add(key);
        return conn;
      }
    }

    // Create new connection if pool not full
    if (this.poolSize < this.maxPoolSize) {
      try {
        const conn = await this.createConnection();
        this.poolSize++;
        const key = `conn-${Date.now()}-${Math.random()}`;
        this.pool.set(key, conn);
        this.activeConnections.add(key);
        return conn;
      } catch (error) {
        // Fall through to wait queue
      }
    }

    // Wait for connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waiting.indexOf(waiter);
        if (index > -1) {
          this.waiting.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, timeoutMs);

      const waiter = {
        resolve: (conn: Connection) => {
          clearTimeout(timeout);
          resolve(conn);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        }
      };

      this.waiting.push(waiter);
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: Connection): void {
    for (const [key, conn] of this.pool) {
      if (conn === connection) {
        this.activeConnections.delete(key);

        // Notify waiting requests
        if (this.waiting.length > 0) {
          const waiter = this.waiting.shift();
          if (waiter) {
            waiter.resolve(connection);
            this.activeConnections.add(key);
          }
        }
        return;
      }
    }
  }

  /**
   * Drain all connections and close pool
   */
  async drain(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    const closePromises = Array.from(this.pool.values()).map(conn =>
      conn.close().catch(err => console.error('Error closing connection:', err))
    );

    await Promise.all(closePromises);
    this.pool.clear();
    this.activeConnections.clear();
    this.poolSize = 0;
  }

  /**
   * Check pool health
   */
  async health(): Promise<boolean> {
    try {
      const conn = await this.acquire(5000);
      const result = await conn.query('SELECT 1');
      this.release(conn);
      return result !== null && result !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  } {
    return {
      total: this.pool.size,
      active: this.activeConnections.size,
      idle: this.pool.size - this.activeConnections.size,
      waiting: this.waiting.length
    };
  }

  /**
   * Private: Create a new database connection
   */
  private async createConnection(): Promise<Connection> {
    // Simulate connection creation - in real implementation,
    // would use actual database driver
    return {
      query: async (sql: string, params?: unknown[]) => {
        // Placeholder implementation
        return null;
      },
      exec: async (sql: string) => {
        // Placeholder implementation
      },
      close: async () => {
        // Placeholder implementation
      },
      isActive: () => true,
      getLastUsed: () => new Date()
    };
  }

  /**
   * Private: Start periodic health checks
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      const staleThreshold = this.config.idleTimeout || 900000;
      const now = Date.now();

      for (const [key, conn] of this.pool) {
        if (!this.activeConnections.has(key)) {
          const lastUsed = conn.getLastUsed().getTime();
          if (now - lastUsed > staleThreshold) {
            try {
              await conn.close();
              this.pool.delete(key);
            } catch (error) {
              console.error('Error closing stale connection:', error);
            }
          }
        }
      }
    }, 60000); // Check every minute
  }
}

export default DatabaseConnection;
