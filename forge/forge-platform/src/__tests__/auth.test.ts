/**
 * Auth API tests — 19 tests covering the full auth + CRUD surface
 */
import request from 'supertest';
import path from 'path';
import fs from 'fs';

process.env.DB_PATH = '/tmp/forge-test.db';
process.env.JWT_SECRET = 'test-secret-key-for-tests-only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // random port so tests don't clash

import app from '../index';

const TEST_USER = {
  email: `test-${Date.now()}@forge.test`,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
};

let accessToken: string;
let server: any;

beforeAll(done => { server = app.listen(0, done); });
afterAll(done => {
  server.close(() => {
    const db = process.env.DB_PATH!;
    if (fs.existsSync(db)) fs.unlinkSync(db);
    done();
  });
});

// ── Register ──────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a new account', async () => {
    const res = await request(server).post('/api/auth/register').send(TEST_USER).expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data).not.toHaveProperty('password');
  });
  it('rejects duplicate email', async () => {
    const res = await request(server).post('/api/auth/register').send(TEST_USER).expect(409);
    expect(res.body.error).toBe('DUPLICATE_EMAIL');
  });
  it('rejects missing password', async () => {
    await request(server).post('/api/auth/register').send({ email: 'x@x.com' }).expect(400);
  });
  it('rejects short password', async () => {
    const res = await request(server).post('/api/auth/register').send({ email: 'x@x.com', password: '123' }).expect(400);
    expect(res.body.error).toBe('INVALID_PASSWORD');
  });
  it('rejects invalid email', async () => {
    const res = await request(server).post('/api/auth/register').send({ email: 'not-email', password: 'Test1234!' }).expect(400);
    expect(res.body.error).toBe('INVALID_EMAIL');
  });
});

// ── Login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns accessToken on valid credentials', async () => {
    const res = await request(server).post('/api/auth/login').send({ email: TEST_USER.email, password: TEST_USER.password }).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    expect(res.headers['set-cookie']).toBeDefined();
    accessToken = res.body.data.accessToken;
  });
  it('rejects wrong password', async () => {
    const res = await request(server).post('/api/auth/login').send({ email: TEST_USER.email, password: 'wrongpass' }).expect(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });
  it('rejects unknown email', async () => {
    await request(server).post('/api/auth/login').send({ email: 'ghost@x.com', password: 'Test1234!' }).expect(401);
  });
});

// ── Protected routes ──────────────────────────────────────────
describe('GET /api/profile', () => {
  it('returns profile with valid token', async () => {
    const res = await request(server).get('/api/profile').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
  });
  it('returns 401 with no token', async () => { await request(server).get('/api/profile').expect(401); });
  it('returns 401 with bad token', async () => {
    await request(server).get('/api/profile').set('Authorization', 'Bearer badtoken').expect(401);
  });
});

// ── Agents CRUD ───────────────────────────────────────────────
describe('Agents CRUD', () => {
  let agentId: string;
  it('creates an agent', async () => {
    const res = await request(server).post('/api/agents').set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Test Agent', description: 'A test agent', model: 'claude-3-sonnet' }).expect(201);
    expect(res.body.data.name).toBe('Test Agent');
    agentId = res.body.data.id;
  });
  it('lists agents', async () => {
    const res = await request(server).get('/api/agents').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
  it('gets agent by id', async () => {
    const res = await request(server).get(`/api/agents/${agentId}`).set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(res.body.data.id).toBe(agentId);
  });
  it('updates agent', async () => {
    const res = await request(server).put(`/api/agents/${agentId}`).set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Updated Agent', status: 'active' }).expect(200);
    expect(res.body.data.name).toBe('Updated Agent');
    expect(res.body.data.status).toBe('active');
  });
  it('deletes agent', async () => {
    await request(server).delete(`/api/agents/${agentId}`).set('Authorization', `Bearer ${accessToken}`).expect(200);
    await request(server).get(`/api/agents/${agentId}`).set('Authorization', `Bearer ${accessToken}`).expect(404);
  });
});

// ── Dashboard + Health + Logout ───────────────────────────────
describe('GET /api/dashboard', () => {
  it('returns stats', async () => {
    const res = await request(server).get('/api/dashboard').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(res.body.data).toHaveProperty('agentCount');
    expect(res.body.data).toHaveProperty('activeWorkflows');
  });
});
describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(server).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
describe('POST /api/auth/logout', () => {
  it('logs out', async () => {
    const res = await request(server).post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(res.body.success).toBe(true);
  });
});
