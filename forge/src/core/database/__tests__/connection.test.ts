/**
 * Database Connection Tests
 */

import { DatabaseConnection, type ConnectionConfig } from '../connection';

describe('DatabaseConnection', () => {
  let connection: DatabaseConnection;

  beforeEach(() => {
    const config: ConnectionConfig = {
      driver: 'sqlite',
      database: ':memory:',
      poolSize: 5,
      connectionTimeout: 5000,
      idleTimeout: 30000
    };
    connection = new DatabaseConnection(config);
  });

  describe('initialize', () => {
    it('should initialize connection pool', async () => {
      await connection.initialize();
      const stats = connection.getStats();

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.total).toBeLessThanOrEqual(5);
    });
  });

  describe('acquire', () => {
    beforeEach(async () => {
      await connection.initialize();
    });

    it('should acquire connection from pool', async () => {
      const conn = await connection.acquire(5000);
      expect(conn).toBeTruthy();
      expect(conn.isActive()).toBe(true);
    });

    it('should reuse idle connections', async () => {
      const conn1 = await connection.acquire(5000);
      connection.release(conn1);

      const conn2 = await connection.acquire(5000);
      expect(conn2).toBe(conn1);
    });

    it('should create new connection when pool available', async () => {
      const conn1 = await connection.acquire(5000);
      const conn2 = await connection.acquire(5000);

      expect(conn1).not.toBe(conn2);
      connection.release(conn1);
      connection.release(conn2);
    });

    it('should timeout when no connections available', async () => {
      const config: ConnectionConfig = {
        driver: 'sqlite',
        database: ':memory:',
        poolSize: 1,
        connectionTimeout: 100
      };
      const smallPool = new DatabaseConnection(config);
      await smallPool.initialize();

      const conn1 = await smallPool.acquire(5000);

      try {
        await smallPool.acquire(100);
        fail('Should have timed out');
      } catch (error) {
        expect((error as Error).message).toContain('timeout');
      } finally {
        smallPool.release(conn1);
      }
    });
  });

  describe('release', () => {
    beforeEach(async () => {
      await connection.initialize();
    });

    it('should return connection to pool', async () => {
      const conn = await connection.acquire(5000);
      const statsBefore = connection.getStats();

      connection.release(conn);
      const statsAfter = connection.getStats();

      expect(statsAfter.idle).toBe(statsBefore.idle + 1);
      expect(statsAfter.active).toBe(statsBefore.active - 1);
    });

    it('should notify waiting requests', async () => {
      const config: ConnectionConfig = {
        driver: 'sqlite',
        database: ':memory:',
        poolSize: 1,
        connectionTimeout: 5000
      };
      const smallPool = new DatabaseConnection(config);
      await smallPool.initialize();

      const conn1 = await smallPool.acquire(5000);
      const waitPromise = smallPool.acquire(5000);

      setTimeout(() => {
        smallPool.release(conn1);
      }, 100);

      const conn2 = await waitPromise;
      expect(conn2).toBeTruthy();
      smallPool.release(conn2);
    });
  });

  describe('drain', () => {
    beforeEach(async () => {
      await connection.initialize();
    });

    it('should close all connections', async () => {
      const conn = await connection.acquire(5000);
      connection.release(conn);

      await connection.drain();
      const stats = connection.getStats();

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.idle).toBe(0);
    });
  });

  describe('health', () => {
    beforeEach(async () => {
      await connection.initialize();
    });

    it('should check pool health', async () => {
      const health = await connection.health();
      expect(typeof health).toBe('boolean');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await connection.initialize();
    });

    it('should return pool statistics', async () => {
      const stats = connection.getStats();

      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.active).toBeGreaterThanOrEqual(0);
      expect(stats.idle).toBeGreaterThanOrEqual(0);
      expect(stats.waiting).toBeGreaterThanOrEqual(0);
      expect(stats.total).toBe(stats.active + stats.idle);
    });

    it('should track active connections', async () => {
      const statsBefore = connection.getStats();
      const conn = await connection.acquire(5000);
      const statsActive = connection.getStats();

      expect(statsActive.active).toBe(statsBefore.active + 1);

      connection.release(conn);
      const statsAfter = connection.getStats();

      expect(statsAfter.active).toBe(statsBefore.active);
    });
  });
});
