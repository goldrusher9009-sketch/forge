type BudgetDatabase = { exec(sql: string): unknown; prepare(sql: string): any; transaction<T extends (...args: any[]) => any>(fn: T): T };
type Allowance = { allowance: number; exempt?: boolean };
export type PiTokenReservation = { key: string; userId: string; tokens: number; exempt: boolean; expiresAt: number; active: boolean };

export class PiBudgetError extends Error {
  constructor(public code: string, public statusCode = 409) { super(code); this.name = 'PiBudgetError'; }
}

/** Admission reservations are separate from usage billing. Settle the actual usage
 * ledger and release the hold in the same caller-owned SQLite transaction. A run
 * paused beyond the lease must reacquire against the current allowance on resume. */
export function createPiBudgetService(db: BudgetDatabase, options: { now?: () => number; ttlMs?: number } = {}) {
  const now = options.now || Date.now;
  const ttlMs = options.ttlMs ?? 30 * 60000;
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1000 || ttlMs > 24 * 60 * 60000) throw new PiBudgetError('PI_RESERVATION_TTL_INVALID', 400);
  db.exec(`CREATE TABLE IF NOT EXISTS pi_token_reservations (
    reservation_key TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tokens INTEGER NOT NULL CHECK(tokens>0),exempt INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS pi_token_reservations_owner ON pi_token_reservations(user_id,expires_at);`);

  const identity = (userId: string, key: string) => {
    if (typeof userId !== 'string' || !userId || userId.length > 200 || typeof key !== 'string' || !/^[A-Za-z0-9_.:-]{1,512}$/.test(key)) throw new PiBudgetError('PI_RESERVATION_ID_INVALID', 400);
    if (!db.prepare('SELECT id FROM users WHERE id=?').get(userId)) throw new PiBudgetError('USER_NOT_FOUND', 404);
  };
  const limits = (tokens: number, allowance: Allowance) => {
    if (!Number.isSafeInteger(tokens) || tokens < 1 || tokens > 1000000000) throw new PiBudgetError('PI_TOKEN_BUDGET_INVALID', 400);
    if (!allowance || (allowance.exempt !== undefined && typeof allowance.exempt !== 'boolean') ||
        (allowance.exempt !== true && (!Number.isSafeInteger(allowance.allowance) || allowance.allowance < 0))) throw new PiBudgetError('PI_TOKEN_ALLOWANCE_INVALID', 400);
  };
  const decode = (row: any): PiTokenReservation | null => row ? {
    key: row.reservation_key, userId: row.user_id, tokens: row.tokens, exempt: Boolean(row.exempt), expiresAt: row.expires_at, active: row.expires_at > now(),
  } : null;
  // Internal lookup. External callers must supply/verify the persisted owner.
  const get = (key: string, userId?: string): PiTokenReservation | null => {
    const row = db.prepare('SELECT * FROM pi_token_reservations WHERE reservation_key=?').get(key);
    return row && (userId === undefined || row.user_id === userId) ? decode(row) : null;
  };
  const acquire = (userId: string, key: string, tokens: number, allowance: Allowance, renew: boolean) => {
    identity(userId, key); limits(tokens, allowance);
    const current = db.prepare('SELECT * FROM pi_token_reservations WHERE reservation_key=?').get(key);
    if (current && (current.user_id !== userId || current.tokens !== tokens || Boolean(current.exempt) !== (allowance.exempt === true))) throw new PiBudgetError('PI_TOKEN_RESERVATION_CONFLICT');
    const time = now();
    if (current && current.expires_at > time && !renew) return decode(current)!;
    // Count every other live hold against the caller's authoritative remaining
    // allowance. No read/await/write gap exists between the sum and insertion.
    const held = Number(db.prepare('SELECT COALESCE(SUM(tokens),0) AS tokens FROM pi_token_reservations WHERE user_id=? AND reservation_key!=? AND expires_at>?').get(userId, key, time).tokens);
    if (allowance.exempt !== true && tokens > Math.max(0, allowance.allowance - held)) throw new PiBudgetError('TOKEN_LIMIT_EXCEEDED', 402);
    db.prepare(`INSERT INTO pi_token_reservations(reservation_key,user_id,tokens,exempt,expires_at,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(reservation_key) DO UPDATE SET expires_at=excluded.expires_at,updated_at=excluded.updated_at`)
      .run(key, userId, tokens, allowance.exempt === true ? 1 : 0, time + ttlMs, time, time);
    return get(key)!;
  };
  const reserve = db.transaction((userId: string, key: string, tokens: number, allowance: Allowance): PiTokenReservation => acquire(userId, key, tokens, allowance, false));
  const renew = db.transaction((userId: string, key: string, allowance: Allowance): PiTokenReservation => {
    identity(userId, key);
    const current = get(key, userId);
    if (!current) throw new PiBudgetError('PI_TOKEN_RESERVATION_NOT_FOUND', 404);
    return acquire(userId, key, current.tokens, allowance, true);
  });
  const release = db.transaction((userId: string, key: string) => {
    identity(userId, key);
    const current = db.prepare('SELECT * FROM pi_token_reservations WHERE reservation_key=?').get(key);
    if (current && current.user_id !== userId) throw new PiBudgetError('PI_TOKEN_RESERVATION_NOT_FOUND', 404);
    const result = db.prepare('DELETE FROM pi_token_reservations WHERE reservation_key=? AND user_id=?').run(key, userId);
    return { released: result.changes === 1, tokens: current?.tokens || 0 };
  });
  return { reserve, get, renew, release };
}
