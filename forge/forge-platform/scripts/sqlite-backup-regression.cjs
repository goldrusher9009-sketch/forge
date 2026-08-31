'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const Database = require('better-sqlite3');
const { createCompressedSqliteSnapshot } = require('../src/sqlite-backup');

function counts(database) {
  return {
    users: database.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    workspaces: database.prepare('SELECT COUNT(*) AS count FROM workspaces').get().count,
    artifacts: database.prepare('SELECT COUNT(*) AS count FROM artifacts').get().count,
  };
}

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-sqlite-backup-'));
  const sourcePath = path.join(tempDir, 'source.db');
  const snapshotPath = path.join(tempDir, 'snapshot.db');
  const gzipPath = path.join(tempDir, 'snapshot.db.gz');
  const restoredPath = path.join(tempDir, 'restored.db');
  let source;
  let restored;

  try {
    source = new Database(sourcePath);
    source.pragma('journal_mode = WAL');
    source.pragma('foreign_keys = ON');
    source.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);
      CREATE TABLE workspaces (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), name TEXT NOT NULL);
      CREATE TABLE artifacts (id INTEGER PRIMARY KEY, workspace_id INTEGER NOT NULL REFERENCES workspaces(id), sha256 TEXT NOT NULL);
    `);
    source.prepare('INSERT INTO users(email) VALUES (?)').run('backup-regression@forge.test');
    source.prepare('INSERT INTO workspaces(user_id, name) VALUES (?, ?)').run(1, 'Backup regression');
    const artifactHash = crypto.createHash('sha256').update('immutable-backup-regression-artifact').digest('hex');
    source.prepare('INSERT INTO artifacts(workspace_id, sha256) VALUES (?, ?)').run(1, artifactHash);

    assert.equal(fs.existsSync(`${sourcePath}-wal`), true, 'source WAL must exist before backup');
    const sourceCounts = counts(source);
    const compressed = await createCompressedSqliteSnapshot(source, snapshotPath, gzipPath);
    assert.ok(compressed.length > 0, 'compressed backup must not be empty');
    fs.writeFileSync(restoredPath, zlib.gunzipSync(compressed));

    restored = new Database(restoredPath, { readonly: true, fileMustExist: true });
    const integrity = restored.pragma('integrity_check', { simple: true });
    const restoredCounts = counts(restored);
    const restoredHash = restored.prepare('SELECT sha256 FROM artifacts WHERE id = 1').get().sha256;

    assert.equal(integrity, 'ok');
    assert.deepEqual(restoredCounts, sourceCounts);
    assert.equal(restoredHash, artifactHash);

    process.stdout.write(`${JSON.stringify({
      success: true,
      walIncluded: true,
      integrity,
      sourceCounts,
      restoredCounts,
      artifactHashPreserved: restoredHash === artifactHash,
      compressedBytes: compressed.length,
    })}\n`);
  } finally {
    if (restored) restored.close();
    if (source) source.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  process.stderr.write(`${String(error && error.stack || error)}\n`);
  process.exitCode = 1;
});
