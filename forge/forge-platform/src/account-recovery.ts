import { createHash, randomBytes } from 'node:crypto';

/** Fixed-window failure counters. Keys are opaque; callers combine identity and network scope. */
export function createAuthThrottle(now: () => number = Date.now) {
  const buckets = new Map<string, { count: number; reset: number }>();
  const sweep = () => { const t = now(); for (const [key, entry] of buckets) if (entry.reset <= t) buckets.delete(key); };
  /** Seconds to wait when any rule is exhausted, otherwise 0. */
  const retryAfter = (rules: { key: string; max: number; windowMs: number }[]) => {
    const t = now(); let wait = 0;
    for (const rule of rules) {
      const entry = buckets.get(rule.key);
      if (entry && entry.reset > t && entry.count >= rule.max) wait = Math.max(wait, Math.ceil((entry.reset - t) / 1000));
    }
    return wait;
  };
  const record = (rules: { key: string; max: number; windowMs: number }[]) => {
    const t = now(); if (buckets.size > 50000) sweep();
    for (const rule of rules) {
      const entry = buckets.get(rule.key);
      if (!entry || entry.reset <= t) buckets.set(rule.key, { count: 1, reset: t + rule.windowMs });
      else entry.count++;
    }
  };
  const clear = (keys: string[]) => { for (const key of keys) buckets.delete(key); };
  return { retryAfter, record, clear };
}

export const AUTH_LIMITS = {
  loginEmail: { max: 10, windowMs: 15 * 60000 },
  loginIp: { max: 60, windowMs: 15 * 60000 },
  registerIp: { max: 20, windowMs: 60 * 60000 },
  resetEmail: { max: 3, windowMs: 15 * 60000 },
  resetIp: { max: 20, windowMs: 60 * 60000 },
};

/** First X-Forwarded-For entry when present; the platform only receives proxied traffic. */
export function clientAddress(req: { headers: Record<string, unknown>; ip?: string; socket?: { remoteAddress?: string } }) {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : typeof forwarded === 'string' ? forwarded : '').split(',')[0].trim();
  return (first || req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 64);
}

type ResetDatabase = { exec(sql: string): unknown; prepare(sql: string): { run(...p: any[]): { changes: number }; get(...p: any[]): any }; transaction<T extends (...a: any[]) => any>(fn: T): T };

export const PASSWORD_RESET_TTL_MS = 30 * 60000;

/** Single-use, hashed password reset tokens. The plain token only ever leaves through the e-mail. */
export function createPasswordResets(db: ResetDatabase, now: () => number = Date.now) {
  db.exec(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL)`);
  const hash = (token: string) => createHash('sha256').update(token).digest('hex');
  const issue = db.transaction((userId: string) => {
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id=? OR expires_at<=?').run(userId, now());
    const token = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO password_reset_tokens(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)').run(hash(token), userId, now() + PASSWORD_RESET_TTL_MS, now());
    return token;
  });
  /** Returns the owning user ID and consumes the token, or null when it is unknown, expired or used. */
  const consume = db.transaction((token: unknown): string | null => {
    if (typeof token !== 'string' || token.length < 32 || token.length > 128) return null;
    const row = db.prepare('SELECT user_id,expires_at,used_at FROM password_reset_tokens WHERE token_hash=?').get(hash(token));
    if (!row || row.used_at || row.expires_at <= now()) return null;
    const changed = db.prepare('UPDATE password_reset_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL').run(now(), hash(token)).changes;
    return changed === 1 ? String(row.user_id) : null;
  });
  return { issue, consume };
}

export type MailMessage = { to: string; subject: string; text: string; html: string };

/** Transactional e-mail through the Resend HTTP API. Unconfigured mail is an explicit state, never a silent drop. */
export function createAccountMail(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch) {
  const apiKey = (env.RESEND_API_KEY || '').trim(), from = (env.FORGE_MAIL_FROM || '').trim();
  const configured = Boolean(apiKey && from && /^(?:[^<>@\s]+\s+)?<?[^\s<>@]+@[^\s<>@]+>?$/.test(from));
  async function send(message: MailMessage) {
    if (!configured) throw new Error('MAIL_NOT_CONFIGURED');
    let response: Response;
    try {
      response = await fetcher('https://api.resend.com/emails', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [message.to], subject: message.subject, text: message.text, html: message.html }) });
    } catch { throw new Error('MAIL_DELIVERY_FAILED'); }
    if (!response.ok) throw new Error(`MAIL_DELIVERY_FAILED_${response.status}`);
    const body: any = await response.json().catch(() => ({}));
    return { id: typeof body?.id === 'string' ? body.id : null };
  }
  return { configured, send };
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

export function passwordResetMessage(to: string, link: string, language: 'en' | 'zh'): MailMessage {
  const zh = language === 'zh', minutes = PASSWORD_RESET_TTL_MS / 60000;
  const subject = zh ? 'Forge 密码重置' : 'Reset your Forge password';
  const intro = zh ? '我们收到了重置你 Forge 账号密码的请求。点击下面的链接设置新密码：' : 'We received a request to reset the password for your Forge account. Use the link below to choose a new password:';
  const expiry = zh ? `该链接 ${minutes} 分钟内有效，且只能使用一次。` : `This link works for ${minutes} minutes and can be used once.`;
  const ignore = zh ? '如果这不是你本人的操作，请忽略此邮件，你的密码不会改变。' : 'If you did not request this, you can ignore this e-mail. Your password will not change.';
  const text = `${intro}\n\n${link}\n\n${expiry}\n${ignore}\n\n— Forge`;
  const html = `<div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;max-width:520px;margin:auto;color:#1b1d1a;line-height:1.6"><p style="font-size:20px;font-weight:700;margin:0 0 16px">Forge</p><p>${escapeHtml(intro)}</p><p style="margin:24px 0"><a href="${escapeHtml(link)}" style="background:#1b2115;color:#e1e7d1;padding:12px 20px;border-radius:7px;text-decoration:none;font-weight:700">${zh ? '设置新密码' : 'Choose a new password'}</a></p><p style="font-size:13px;color:#555">${escapeHtml(link)}</p><p style="font-size:13px;color:#555">${escapeHtml(expiry)}<br>${escapeHtml(ignore)}</p></div>`;
  return { to, subject, text, html };
}