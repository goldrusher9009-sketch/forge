const assert = require('node:assert/strict');
const contract = require('../dist/sandbox-contract.js');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('state machine preserves terminal finality', () => {
  assert.equal(contract.canTransitionSandboxState('running', 'artifact_committing'), true);
  assert.equal(contract.canTransitionSandboxState('artifact_committing', 'completed'), true);
  assert.equal(contract.canTransitionSandboxState('completed', 'running'), false);
  assert.equal(contract.canTransitionSandboxState('destroyed', 'running'), false);
});

test('workspace paths reject absolute and traversal paths', () => {
  assert.equal(contract.normalizeSandboxPath('reports/final.md'), 'reports/final.md');
  assert.throws(() => contract.normalizeSandboxPath('../forge.db'), /SANDBOX_PATH_ESCAPE_REJECTED/);
  assert.throws(() => contract.normalizeSandboxPath('/etc/passwd'), /SANDBOX_ABSOLUTE_PATH_REJECTED/);
  assert.throws(() => contract.normalizeSandboxPath('C:\\Windows\\system.ini'), /SANDBOX_ABSOLUTE_PATH_REJECTED/);
});

test('read-only browser is A and external mutation is B', () => {
  assert.equal(contract.classifySandboxTool('sandbox_browser', { actions: [{ action: 'navigate', url: 'https://example.com' }, { action: 'extract' }] }).approvalClass, 'A');
  assert.equal(contract.classifySandboxTool('sandbox_browser', { actions: [{ action: 'fill', selector: '#email', value: 'a@example.com' }] }).approvalClass, 'B');
});

test('payments, credential changes, and privileged shell are C', () => {
  assert.equal(contract.classifySandboxTool('sandbox_browser', { actions: [{ action: 'click', selector: '#pay' }], note: 'confirm payment' }).approvalClass, 'C');
  assert.equal(contract.classifySandboxTool('sandbox_shell', { command: 'sudo mount /dev/sda /mnt' }).approvalClass, 'C');
});

test('destructive workspace shell requires approval', () => {
  assert.equal(contract.classifySandboxTool('sandbox_shell', { command: 'node process.js input.csv' }).approvalClass, 'A');
  assert.equal(contract.classifySandboxTool('sandbox_shell', { command: 'rm -rf old-results' }).approvalClass, 'B');
});

test('typed tool validation enforces bounded inputs', () => {
  assert.deepEqual(contract.validateSandboxToolInput('sandbox_file', { operation: 'read', path: 'input/data.csv' }), { operation: 'read', path: 'input/data.csv' });
  assert.throws(() => contract.validateSandboxToolInput('sandbox_browser', { actions: [] }), /SANDBOX_BROWSER_ACTIONS_INVALID/);
  assert.throws(() => contract.validateSandboxToolInput('not_a_tool', {}), /SANDBOX_TOOL_NOT_ALLOWED/);
});

let failures = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}
console.log(`${tests.length - failures}/${tests.length} sandbox contract checks passed`);
if (failures) process.exit(1);
