/**
 * Transaction Management
 *
 * Provides ACID transaction support for atomic operations.
 */

import { DatabaseConnection, Connection } from './connection';

export interface TransactionOptions {
  isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  timeout?: number;
}

/**
 * Transaction Context
 *
 * Manages a database transaction with automatic rollback on error.
 */
export class TransactionContext {
  private connection: Connection;
  private isActive: boolean = false;
  private isCommitted: boolean = false;
  private isRolledBack: boolean = false;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Begin transaction
   */
  async begin(options?: TransactionOptions): Promise<void> {
    if (this.isActive) {
      throw new Error('Transaction already active');
    }

    try {
      let sql = 'BEGIN';

      if (options?.isolationLevel) {
        const level = options.isolationLevel.toUpperCase().replace(/_/g, ' ');
        sql += ` ISOLATION LEVEL ${level}`;
      }

      await this.connection.exec(sql);
      this.isActive = true;
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Commit transaction
   */
  async commit(): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction to commit');
    }

    if (this.isCommitted) {
      throw new Error('Transaction already committed');
    }

    if (this.isRolledBack) {
      throw new Error('Transaction already rolled back');
    }

    try {
      await this.connection.exec('COMMIT');
      this.isCommitted = true;
      this.isActive = false;
    } catch (error) {
      throw new Error(`Failed to commit transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction to rollback');
    }

    if (this.isCommitted) {
      throw new Error('Cannot rollback committed transaction');
    }

    if (this.isRolledBack) {
      return; // Already rolled back
    }

    try {
      await this.connection.exec('ROLLBACK');
      this.isRolledBack = true;
      this.isActive = false;
    } catch (error) {
      console.error('Error during rollback:', error);
      this.isRolledBack = true;
      this.isActive = false;
    }
  }

  /**
   * Execute query in transaction
   */
  async query(sql: string, params?: unknown[]): Promise<unknown> {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    return await this.connection.query(sql, params);
  }

  /**
   * Execute command in transaction
   */
  async exec(sql: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    return await this.connection.exec(sql);
  }

  /**
   * Save point in transaction
   */
  async savepoint(name: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    await this.connection.exec(`SAVEPOINT ${name}`);
  }

  /**
   * Rollback to save point
   */
  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    await this.connection.exec(`ROLLBACK TO SAVEPOINT ${name}`);
  }

  /**
   * Release save point
   */
  async releaseSavepoint(name: string): Promise<void> {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    await this.connection.exec(`RELEASE SAVEPOINT ${name}`);
  }

  /**
   * Get transaction status
   */
  getStatus(): {
    isActive: boolean;
    isCommitted: boolean;
    isRolledBack: boolean;
  } {
    return {
      isActive: this.isActive,
      isCommitted: this.isCommitted,
      isRolledBack: this.isRolledBack
    };
  }
}

/**
 * Transaction Manager
 *
 * Provides convenient transaction handling with automatic rollback.
 */
export class TransactionManager {
  private dbConnection: DatabaseConnection;

  constructor(dbConnection: DatabaseConnection) {
    this.dbConnection = dbConnection;
  }

  /**
   * Execute function within transaction
   */
  async transaction<T>(
    fn: (context: TransactionContext) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const conn = await this.dbConnection.acquire();
    const context = new TransactionContext(conn);

    try {
      await context.begin(options);

      const result = await fn(context);

      // Auto-commit if not already committed or rolled back
      const status = context.getStatus();
      if (status.isActive && !status.isCommitted && !status.isRolledBack) {
        await context.commit();
      }

      return result;
    } catch (error) {
      // Auto-rollback on error
      const status = context.getStatus();
      if (status.isActive && !status.isCommitted && !status.isRolledBack) {
        await context.rollback();
      }

      throw error;
    } finally {
      this.dbConnection.release(conn);
    }
  }

  /**
   * Execute multiple operations as atomic unit
   */
  async batch<T>(
    operations: Array<() => Promise<T>>,
    options?: TransactionOptions
  ): Promise<T[]> {
    return this.transaction(async (context) => {
      const results: T[] = [];

      for (const op of operations) {
        const result = await op();
        results.push(result);
      }

      return results;
    }, options);
  }
}

export default TransactionManager;
