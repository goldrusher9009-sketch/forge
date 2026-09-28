import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';

/**
 * Asks Apptopia what happened to this creator's handed-off agents (draft, in review, live, rejected, retired, sales).
 * Signed with the shared publish secret; Apptopia answers only for drafts whose Forge lineage belongs to this user.
 */
export type ListingStatusFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;
const listingStates = new Set(['NOT_IMPORTED', 'DRAFT', 'IN_REVIEW', 'LIVE', 'REJECTED', 'RETIRED', 'SUSPENDED']);

export function createApptopiaStatusRequest(sourceUserId: string, agentIds: string[], env = process.env) {
  const key = env.FORGE_PUBLISH_SECRET || '';
  if (key.length < 32 || !env.APPTOPIA_PUBLISH_URL) throw new Error('APPTOPIA_PUBLISH_NOT_CONFIGURED');
  const destination = new URL(env.APPTOPIA_PUBLISH_URL);
  if (destination.username || destination.password || destination.search || destination.hash) throw new Error('APPTOPIA_PUBLISH_URL_INVALID');
  if (destination.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && destination.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(destination.hostname))) throw new Error('APPTOPIA_PUBLISH_URL_INVALID');
  const body = JSON.stringify({ sourceUserId, agentIds });
  const token = jwt.sign({ bodyHash: createHash('sha256').update(body).digest('hex') }, key, {
    algorithm: 'HS256', issuer: 'forge', audience: 'apptopia:listing-status', subject: sourceUserId, jwtid: randomUUID(), expiresIn: 60,
  });
  return { url: new URL('/api/internal/forge/listing-status', destination.origin).href, body, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
}

export async function fetchApptopiaListingStatus(sourceUserId: string, agentIds: string[], env = process.env, fetchImpl: ListingStatusFetch = fetch as unknown as ListingStatusFetch) {
  const request = createApptopiaStatusRequest(sourceUserId, agentIds, env);
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetchImpl(request.url, { method: 'POST', headers: request.headers, body: request.body, signal: controller.signal });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !Array.isArray(payload.listings)) throw new Error(typeof payload?.error === 'string' ? payload.error : 'APPTOPIA_STATUS_UNAVAILABLE');
    const requested = new Set(agentIds), seen = new Set<string>();
    for (const row of payload.listings) {
      if (!row || typeof row.agentId !== 'string' || !requested.has(row.agentId) || seen.has(row.agentId) || !listingStates.has(row.state)) throw new Error('APPTOPIA_STATUS_UNAVAILABLE');
      seen.add(row.agentId);
    }
    if (payload.storefront != null) {
      let storefront: URL;
      try { storefront = new URL(payload.storefront); } catch { throw new Error('APPTOPIA_STATUS_UNAVAILABLE'); }
      if (storefront.username || storefront.password || (storefront.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && storefront.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(storefront.hostname)))) throw new Error('APPTOPIA_STATUS_UNAVAILABLE');
    }
    return payload as { storefront: string; listings: any[] };
  } finally { clearTimeout(timer); }
}

export function registerApptopiaStatusRoutes(app: any, requireAuth: any, db: any, fetchImpl?: ListingStatusFetch) {
  app.get('/api/workspace/apptopia-listings', requireAuth, async (req: any, res: any) => {
    res.setHeader('Cache-Control', 'private, no-store');
    const requested = String(req.query.agentIds || '').split(',').map((id: string) => id.trim()).filter(Boolean).slice(0, 50);
    const rows = requested.length
      ? db.prepare(`SELECT id, name FROM workspace_agents WHERE user_id=? AND is_builtin=0 AND id IN (${requested.map(() => '?').join(',')})`).all(req.user.sub, ...requested)
      : db.prepare('SELECT id, name FROM workspace_agents WHERE user_id=? AND is_builtin=0 ORDER BY updated_at DESC LIMIT 50').all(req.user.sub);
    if (!rows.length) return res.json({ success: true, data: { storefront: null, listings: [] } });
    try {
      const result = await fetchApptopiaListingStatus(req.user.sub, rows.map((row: any) => row.id), process.env, fetchImpl);
      const names = new Map(rows.map((row: any) => [row.id, row.name]));
      res.json({ success: true, data: { storefront: result.storefront, listings: result.listings.map((row: any) => ({ ...row, forgeName: names.get(row.agentId) || null })) } });
    } catch (error) {
      const code = error instanceof Error ? error.message : 'APPTOPIA_STATUS_UNAVAILABLE';
      res.status(code.includes('NOT_CONFIGURED') || code.includes('URL_INVALID') ? 503 : 502).json({ success: false, error: code });
    }
  });
}
