'use strict';

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(Math.trunc(parsed), maximum));
}

function createConcurrencyLimiter(limitValue) {
  const limit = boundedInteger(limitValue, 1, 1, 8);
  const waiting = [];
  let active = 0;

  async function acquire() {
    if (active < limit) {
      active += 1;
      return;
    }
    await new Promise(resolve => waiting.push(resolve));
  }

  function release() {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  }

  return {
    limit,
    stats: () => ({ active, waiting: waiting.length }),
    async run(operation) {
      await acquire();
      try { return await operation(); }
      finally { release(); }
    },
  };
}

function createSandboxAdmission(docker, maxActiveValue, maxActivePerTenantValue) {
  const maxActive = boundedInteger(maxActiveValue, 3, 1, 32);
  const maxActivePerTenant = boundedInteger(maxActivePerTenantValue, 1, 1, maxActive);
  const pending = new Map();
  let lockTail = Promise.resolve();

  async function synchronized(operation) {
    const previous = lockTail;
    let unlock;
    lockTail = new Promise(resolve => { unlock = resolve; });
    await previous;
    try { return await operation(); }
    finally { unlock(); }
  }

  async function activeSandboxes() {
    const filters = encodeURIComponent(JSON.stringify({
      label: ['com.forge.managed=sandbox-v1', 'com.forge.role=shell'],
    }));
    const response = await docker.request('GET', `/containers/json?all=1&filters=${filters}`, null);
    if (!Array.isArray(response.data)) throw new Error('SANDBOX_CAPACITY_STATE_INVALID');
    return new Map(response.data.map(container => {
      const labels = container && container.Labels || {};
      return [labels['com.forge.sandbox.id'], labels['com.forge.tenant.id']];
    }).filter(([sandboxId]) => sandboxId));
  }

  async function reserve(sandboxId, tenantId) {
    return synchronized(async () => {
      if (pending.has(sandboxId)) throw new Error('SANDBOX_PROVISION_IN_PROGRESS');
      const used = await activeSandboxes();
      for (const [id, pendingTenantId] of pending) {
        if (!used.has(id)) used.set(id, pendingTenantId);
      }
      if (!used.has(sandboxId)) {
        const tenantActive = [...used.values()].filter(value => value === tenantId).length;
        if (tenantActive >= maxActivePerTenant) throw new Error('SANDBOX_TENANT_CAPACITY_EXCEEDED');
        if (used.size >= maxActive) throw new Error('SANDBOX_CAPACITY_EXCEEDED');
      }
      pending.set(sandboxId, tenantId);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        pending.delete(sandboxId);
      };
    });
  }

  return {
    maxActive,
    maxActivePerTenant,
    reserve,
    stats: () => ({ pending: pending.size, pendingTenants: new Set(pending.values()).size }),
  };
}

module.exports = { boundedInteger, createConcurrencyLimiter, createSandboxAdmission };
