import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { createApptopiaRuntime } from './apptopia-runtime';

export interface PublishAgent { id: string; user_id: string; name: string; is_builtin?: number; }

export interface PublicRuntimeReference { publicationId: string; releaseId: string; contentHash: string; version: number; }
export function createApptopiaHandoff(agent: PublishAgent, ownerId: string, summary: unknown, env = process.env, runtime?: PublicRuntimeReference) {
  if (agent.user_id !== ownerId) throw new Error('AGENT_NOT_FOUND');
  if (agent.is_builtin) throw new Error('BUILTIN_AGENT_NOT_PUBLISHABLE');
  if (typeof summary !== 'string' || summary.trim().length < 20 || summary.trim().length > 280) throw new Error('PUBLIC_SUMMARY_REQUIRED');
  if (agent.name.trim().length < 3 || agent.name.trim().length > 100) throw new Error('AGENT_NAME_INVALID');
  const key = env.FORGE_PUBLISH_SECRET || '';
  if (key.length < 32 || !env.APPTOPIA_PUBLISH_URL) throw new Error('APPTOPIA_PUBLISH_NOT_CONFIGURED');
  const destination = new URL(env.APPTOPIA_PUBLISH_URL);
  if (destination.username || destination.password || destination.search || destination.hash) throw new Error('APPTOPIA_PUBLISH_URL_INVALID');
  if (destination.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && destination.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(destination.hostname))) throw new Error('APPTOPIA_PUBLISH_URL_INVALID');
  destination.pathname = '/sell';
  // Explicit allowlist: never copy the agent row, prompt, tools, credentials or conversations.
  const manifest = {
    schemaVersion: 'apptopia.product/v1', name: agent.name.trim(), summary: summary.trim(),
    description: '', category: 'productivity', version: '1.0.0', outcomes: [], requirements: [],
    limitations: '', dataPolicy: '', supportEmail: '', delivery: ['browser', 'api'], endpointUrl: '',
    pricing: { model: 'free', currency: 'USD', amountCents: 0, modelCosts: 'included' },
  };
  if (runtime) manifest.version = `${runtime.version}.0.0`;
  const token = jwt.sign({ agentId: `workspace:${agent.id}`, manifest, ...(runtime ? { runtime } : {}) }, key, {
    algorithm: 'HS256', issuer: 'forge', audience: 'apptopia:publish', subject: ownerId,
    jwtid: randomUUID(), expiresIn: '10m',
  });
  destination.hash = new URLSearchParams({ forge: token }).toString();
  return { url: destination.href, expiresInSeconds: 600 };
}

export function registerApptopiaPublishRoutes(app: any, requireAuth: any, db: any, runtime?: ReturnType<typeof createApptopiaRuntime>) {
  app.post('/api/workspace/agents/:id/apptopia-publish', requireAuth, (req: any, res: any) => {
    res.setHeader('Cache-Control', 'no-store');
    const agent = db.prepare('SELECT id, user_id, name, is_builtin FROM workspace_agents WHERE id=? AND user_id=?').get(req.params.id, req.user.sub);
    if (!agent) return res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' });
    try {
      let reference: PublicRuntimeReference | undefined;
      if (req.body?.publicationId) {
        const publication = runtime?.list(req.user.sub, req.params.id).find((row: any) => row.id === req.body.publicationId && !row.revoked);
        if (!publication) return res.status(409).json({ success: false, error: 'MARKETPLACE_PUBLICATION_NOT_FOUND' });
        reference = { publicationId: publication.id, releaseId: publication.releaseId, contentHash: publication.contentHash, version: publication.version };
      }
      res.json({ success: true, data: createApptopiaHandoff(agent, req.user.sub, req.body?.summary, process.env, reference) });
    }
    catch (error) {
      const code = error instanceof Error ? error.message : 'PUBLISH_FAILED';
      const status = code.includes('NOT_CONFIGURED') || code.includes('URL_INVALID') ? 503 : 400;
      res.status(status).json({ success: false, error: code });
    }
  });
}
