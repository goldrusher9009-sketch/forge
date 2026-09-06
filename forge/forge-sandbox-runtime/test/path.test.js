'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeRelative, resolveInside } = require('../tool');

test('normalizes workspace-relative paths', () => {
  assert.equal(normalizeRelative('input/../output/report.md'), 'output/report.md');
  assert.equal(resolveInside('/workspace', 'output/report.md'), '/workspace/output/report.md');
});

test('rejects path escape and absolute paths', () => {
  assert.throws(() => normalizeRelative('../forge.db'), /PATH_ESCAPE/);
  assert.throws(() => normalizeRelative('/etc/passwd'), /ABSOLUTE_PATH/);
  assert.throws(() => normalizeRelative('C:\\Windows\\system.ini'), /ABSOLUTE_PATH/);
});
