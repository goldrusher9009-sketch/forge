/**
 * Database Core Module
 *
 * Central export point for all database functionality.
 */

export { DatabaseConnection, type ConnectionConfig, type Connection, type ConnectionPool, type DatabaseDriver } from './connection';
export { Repository, type QueryOptions, type InsertOptions, type UpdateOptions, type DeleteOptions } from './repository';
export { TransactionContext, TransactionManager, type TransactionOptions } from './transaction';
export { MigrationManager, type Migration, type MigrationStatus } from './migration';
