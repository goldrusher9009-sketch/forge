import fs from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

export type SqliteBackupDatabase = {
  backup(destination: string): Promise<unknown>;
};

export async function createCompressedSqliteSnapshot(
  database: SqliteBackupDatabase,
  snapshotPath: string,
  gzipPath: string,
): Promise<Buffer> {
  if (!snapshotPath || !gzipPath || snapshotPath === gzipPath) {
    throw new Error('SQLITE_BACKUP_PATHS_INVALID');
  }

  fs.rmSync(snapshotPath, { force: true });
  fs.rmSync(gzipPath, { force: true });

  try {
    await database.backup(snapshotPath);
    await pipeline(
      fs.createReadStream(snapshotPath),
      createGzip({ level: 9 }),
      fs.createWriteStream(gzipPath),
    );
    return fs.readFileSync(gzipPath);
  } catch (error) {
    fs.rmSync(snapshotPath, { force: true });
    fs.rmSync(gzipPath, { force: true });
    throw error;
  }
}
