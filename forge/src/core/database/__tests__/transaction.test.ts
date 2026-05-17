/**
 * Transaction Management Tests
 */

import { TransactionContext, TransactionManager } from '../transaction';
import { DatabaseConnection } from '../connection';
import { type Connection } from '../connection';

describe('TransactionContext', () => {
  let mockConnection: Connection;
  let context: TransactionContext;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(async () => ({ success: true })),
      exec: jest.fn(async () => {}),
      close: jest.fn(async () => {}),
      isActive: jest.fn(() => true),
      getLastUsed: jest.fn(() => new Date())
    };
    context = new TransactionContext(mockConnection);
  });

  describe('begin', () => {
    it('should start transaction', async () => {
      await context.begin();
      const status = context.getStatus();

      expect(status.isActive).toBe(true);
      expect(status.isCommitted).toBe(false);
      expect(status.isRolledBack).toBe(false);
    });

    it('should set isolation level', async () => {
      await context.begin({ isolationLevel: 'serializable' });

      expect(mockConnection.exec).toHaveBeenCalledWith(
        expect.stringContaining('ISOLATION LEVEL')
      );
    });

    it('should throw if already active', async () => {
      await context.begin();

      try {
        await context.begin();
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('already active');
      }
    });
  });

  describe('commit', () => {
    beforeEach(async () => {
      await context.begin();
    });

    it('should commit transaction', async () => {
      await context.commit();
      const status = context.getStatus();

      expect(status.isCommitted).toBe(true);
      expect(status.isActive).toBe(false);
      expect(mockConnection.exec).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw if not active', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.commit();
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });

    it('should throw if already committed', async () => {
      await context.commit();

      try {
        await context.commit();
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('already committed');
      }
    });
  });

  describe('rollback', () => {
    beforeEach(async () => {
      await context.begin();
    });

    it('should rollback transaction', async () => {
      await context.rollback();
      const status = context.getStatus();

      expect(status.isRolledBack).toBe(true);
      expect(status.isActive).toBe(false);
      expect(mockConnection.exec).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should return silently if already rolled back', async () => {
      await context.rollback();
      await context.rollback();

      expect(mockConnection.exec).toHaveBeenCalledTimes(2); // BEGIN + ROLLBACK
    });

    it('should throw if not active', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.rollback();
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });

    it('should throw if already committed', async () => {
      await context.commit();

      try {
        await context.rollback();
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('Cannot rollback committed');
      }
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await context.begin();
    });

    it('should execute query in transaction', async () => {
      const result = await context.query('SELECT * FROM users WHERE id = $1', ['123']);

      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        ['123']
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw if not in transaction', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.query('SELECT 1');
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });
  });

  describe('exec', () => {
    beforeEach(async () => {
      await context.begin();
    });

    it('should execute command in transaction', async () => {
      await context.exec('INSERT INTO users VALUES (1, "test")');

      expect(mockConnection.exec).toHaveBeenCalledWith(
        'INSERT INTO users VALUES (1, "test")'
      );
    });

    it('should throw if not in transaction', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.exec('DELETE FROM users');
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });
  });

  describe('savepoint', () => {
    beforeEach(async () => {
      await context.begin();
    });

    it('should create savepoint', async () => {
      await context.savepoint('sp1');

      expect(mockConnection.exec).toHaveBeenCalledWith('SAVEPOINT sp1');
    });

    it('should throw if not in transaction', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.savepoint('sp1');
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });
  });

  describe('rollbackToSavepoint', () => {
    beforeEach(async () => {
      await context.begin();
      await context.savepoint('sp1');
    });

    it('should rollback to savepoint', async () => {
      await context.rollbackToSavepoint('sp1');

      expect(mockConnection.exec).toHaveBeenCalledWith('ROLLBACK TO SAVEPOINT sp1');
    });

    it('should throw if not in transaction', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.rollbackToSavepoint('sp1');
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });
  });

  describe('releaseSavepoint', () => {
    beforeEach(async () => {
      await context.begin();
      await context.savepoint('sp1');
    });

    it('should release savepoint', async () => {
      await context.releaseSavepoint('sp1');

      expect(mockConnection.exec).toHaveBeenCalledWith('RELEASE SAVEPOINT sp1');
    });

    it('should throw if not in transaction', async () => {
      const newContext = new TransactionContext(mockConnection);

      try {
        await newContext.releaseSavepoint('sp1');
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('No active transaction');
      }
    });
  });
});

describe('TransactionManager', () => {
  let dbConnection: DatabaseConnection;
  let manager: TransactionManager;

  beforeEach(async () => {
    const config = {
      driver: 'sqlite' as const,
      database: ':memory:',
      poolSize: 5
    };
    dbConnection = new DatabaseConnection(config);
    await dbConnection.initialize();
    manager = new TransactionManager(dbConnection);
  });

  afterEach(async () => {
    await dbConnection.drain();
  });

  describe('transaction', () => {
    it('should execute function in transaction and auto-commit', async () => {
      const result = await manager.transaction(async (context) => {
        const status = context.getStatus();
        expect(status.isActive).toBe(true);
        return 'success';
      });

      expect(result).toBe('success');
    });

    it('should auto-rollback on error', async () => {
      try {
        await manager.transaction(async (context) => {
          throw new Error('Test error');
        });
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Test error');
      }
    });

    it('should release connection on completion', async () => {
      const statsBefore = dbConnection.getStats();

      await manager.transaction(async () => {
        return 'done';
      });

      const statsAfter = dbConnection.getStats();
      expect(statsAfter.active).toBeLessThanOrEqual(statsBefore.active);
    });

    it('should support custom isolation levels', async () => {
      await manager.transaction(
        async (context) => {
          return 'success';
        },
        { isolationLevel: 'read_committed' }
      );
    });
  });

  describe('batch', () => {
    it('should execute multiple operations atomically', async () => {
      const operations = [
        async () => 'result1',
        async () => 'result2',
        async () => 'result3'
      ];

      const results = await manager.batch(operations);

      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should rollback all on any failure', async () => {
      const operations = [
        async () => 'result1',
        async () => {
          throw new Error('Batch failure');
        },
        async () => 'result3'
      ];

      try {
        await manager.batch(operations);
        fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toBe('Batch failure');
      }
    });

    it('should maintain order of results', async () => {
      const operations = [
        async () => 1,
        async () => 2,
        async () => 3,
        async () => 4,
        async () => 5
      ];

      const results = await manager.batch(operations);
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
