'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createConcurrencyLimiter, createSandboxAdmission } = require('../src/runtime-limits');

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('tool limiter never exceeds the configured concurrency', async () => {
  const limiter = createConcurrencyLimiter(1);
  const firstGate = deferred();
  const started = [];
  const first = limiter.run(async () => {
    started.push('first');
    await firstGate.promise;
    return 1;
  });
  const second = limiter.run(async () => {
    started.push('second');
    return 2;
  });

  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, ['first']);
  assert.deepEqual(limiter.stats(), { active: 1, waiting: 1 });
  firstGate.resolve();
  assert.deepEqual(await Promise.all([first, second]), [1, 2]);
  assert.deepEqual(started, ['first', 'second']);
  assert.deepEqual(limiter.stats(), { active: 0, waiting: 0 });
});

test('tool limiter releases capacity when an operation fails', async () => {
  const limiter = createConcurrencyLimiter(1);
  await assert.rejects(limiter.run(async () => { throw new Error('expected'); }), /expected/);
  assert.equal(await limiter.run(async () => 'recovered'), 'recovered');
  assert.deepEqual(limiter.stats(), { active: 0, waiting: 0 });
});

test('sandbox admission counts persisted and in-flight sandbox ids once', async () => {
  const persisted = [{ Labels: { 'com.forge.sandbox.id': 'sandbox_existing' } }];
  const docker = { request: async () => ({ statusCode: 200, data: persisted }) };
  const admission = createSandboxAdmission(docker, 3);

  const releaseSecond = await admission.reserve('sandbox_second');
  const releaseThird = await admission.reserve('sandbox_third');
  await assert.rejects(admission.reserve('sandbox_fourth'), /SANDBOX_CAPACITY_EXCEEDED/);
  releaseSecond();
  const releaseFourth = await admission.reserve('sandbox_fourth');

  releaseThird();
  releaseFourth();
  assert.deepEqual(admission.stats(), { pending: 0 });
});

test('sandbox admission rejects duplicate concurrent provisioning', async () => {
  const docker = { request: async () => ({ statusCode: 200, data: [] }) };
  const admission = createSandboxAdmission(docker, 3);
  const release = await admission.reserve('sandbox_duplicate');
  await assert.rejects(admission.reserve('sandbox_duplicate'), /SANDBOX_PROVISION_IN_PROGRESS/);
  release();
  const releaseRetry = await admission.reserve('sandbox_duplicate');
  assert.equal(typeof releaseRetry, 'function');
  releaseRetry();
  assert.deepEqual(admission.stats(), { pending: 0 });
});
