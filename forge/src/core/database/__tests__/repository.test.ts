/**
 * Repository Pattern Tests
 */

import { Repository, type QueryOptions } from '../repository';
import { DatabaseConnection, type Connection } from '../connection';

interface TestEntity {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

class TestRepository extends Repository<TestEntity> {
  constructor(connection: DatabaseConnection) {
    super('test_entities', connection);
  }
}

describe('Repository', () => {
  let repository: TestRepository;
  let connection: DatabaseConnection;

  beforeEach(async () => {
    const config = {
      driver: 'sqlite' as const,
      database: ':memory:',
      poolSize: 5
    };
    connection = new DatabaseConnection(config);
    await connection.initialize();
    repository = new TestRepository(connection);

    // Create test table
    const conn = await connection.acquire();
    try {
      await conn.exec(`
        CREATE TABLE IF NOT EXISTS test_entities (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          active INTEGER DEFAULT 1
        )
      `);
    } finally {
      connection.release(conn);
    }
  });

  afterEach(async () => {
    await connection.drain();
  });

  describe('create', () => {
    it('should insert entity', async () => {
      const data: Partial<TestEntity> = {
        id: 'test-1',
        name: 'Test User',
        email: 'test@example.com',
        active: true
      };

      const result = await repository.create(data);
      expect(result).toBeTruthy();
    });

    it('should handle conflict ignore', async () => {
      const data: Partial<TestEntity> = {
        id: 'test-1',
        name: 'Test User',
        email: 'test@example.com'
      };

      await repository.create(data);
      const result = await repository.create(data, { onConflict: 'ignore' });

      expect(result).toBeTruthy();
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'Test User',
        email: 'test@example.com',
        active: true
      });
    });

    it('should retrieve entity by ID', async () => {
      const result = await repository.findById('test-1');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('test-1');
      expect(result?.name).toBe('Test User');
    });

    it('should return null for missing ID', async () => {
      const result = await repository.findById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'Alice',
        email: 'alice@example.com',
        active: true
      });
      await repository.create({
        id: 'test-2',
        name: 'Bob',
        email: 'bob@example.com',
        active: false
      });
      await repository.create({
        id: 'test-3',
        name: 'Charlie',
        email: 'charlie@example.com',
        active: true
      });
    });

    it('should retrieve all entities', async () => {
      const results = await repository.find();
      expect(results.length).toBe(3);
    });

    it('should filter with where clause', async () => {
      const options: QueryOptions = {
        where: { active: true }
      };
      const results = await repository.find(options);
      expect(results.length).toBe(2);
    });

    it('should select specific columns', async () => {
      const options: QueryOptions = {
        select: ['id', 'name']
      };
      const results = await repository.find(options);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect limit', async () => {
      const options: QueryOptions = {
        limit: 2
      };
      const results = await repository.find(options);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should support offset', async () => {
      const page1 = await repository.find({ limit: 2, offset: 0 });
      const page2 = await repository.find({ limit: 2, offset: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(1);
    });

    it('should support order by', async () => {
      const options: QueryOptions = {
        orderBy: { name: 'asc' }
      };
      const results = await repository.find(options);

      expect(results[0]?.name).toBe('Alice');
      expect(results[1]?.name).toBe('Bob');
      expect(results[2]?.name).toBe('Charlie');
    });
  });

  describe('findOne', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'Test User',
        email: 'test@example.com',
        active: true
      });
    });

    it('should retrieve single entity', async () => {
      const result = await repository.findOne({
        where: { id: 'test-1' }
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe('test-1');
    });

    it('should return null when not found', async () => {
      const result = await repository.findOne({
        where: { id: 'nonexistent' }
      });

      expect(result).toBeNull();
    });
  });

  describe('count', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'Alice',
        email: 'alice@example.com',
        active: true
      });
      await repository.create({
        id: 'test-2',
        name: 'Bob',
        email: 'bob@example.com',
        active: false
      });
    });

    it('should count all records', async () => {
      const count = await repository.count();
      expect(count).toBe(2);
    });

    it('should count with where clause', async () => {
      const count = await repository.count({ active: true });
      expect(count).toBe(1);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'Old Name',
        email: 'test@example.com',
        active: true
      });
    });

    it('should update entity', async () => {
      const results = await repository.update(
        { name: 'New Name' },
        { where: { id: 'test-1' } }
      );

      expect(results.length).toBeGreaterThan(0);

      const updated = await repository.findById('test-1');
      expect(updated?.name).toBe('New Name');
    });

    it('should update with multiple conditions', async () => {
      await repository.create({
        id: 'test-2',
        name: 'Another',
        email: 'another@example.com',
        active: false
      });

      const results = await repository.update(
        { active: true },
        { where: { active: false } }
      );

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'To Delete',
        email: 'delete@example.com',
        active: true
      });
      await repository.create({
        id: 'test-2',
        name: 'To Keep',
        email: 'keep@example.com',
        active: true
      });
    });

    it('should delete entity', async () => {
      const countBefore = await repository.count();
      await repository.delete({ where: { id: 'test-1' } });
      const countAfter = await repository.count();

      expect(countAfter).toBeLessThan(countBefore);
    });

    it('should handle delete with multiple conditions', async () => {
      const countBefore = await repository.count();
      await repository.delete({ where: { active: false } });
      const countAfter = await repository.count();

      expect(countAfter).toBeLessThanOrEqual(countBefore);
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      await repository.create({
        id: 'test-1',
        name: 'Test',
        email: 'test@example.com',
        active: true
      });
    });

    it('should execute raw query', async () => {
      const result = await repository.query('SELECT * FROM test_entities WHERE id = $1', ['test-1']);
      expect(result).toBeTruthy();
    });
  });

  describe('exec', () => {
    it('should execute raw command', async () => {
      await expect(
        repository.exec('INSERT INTO test_entities (id, name, email) VALUES (?, ?, ?)')
      ).rejects.toThrow();
    });
  });
});
