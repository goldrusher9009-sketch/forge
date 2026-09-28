import { BrainError, BrainService } from './brain-service';

const field = (value: any, camel: string, snake: string) => value?.[camel] !== undefined ? value[camel] : value?.[snake];

/** Register before legacy Brain routes. Concrete paths deliberately avoid a GET
 * /:id catch-all so existing /summary, /glossary and other views still resolve. */
export function registerBrainRoutes(app: any, requireAuth: any, brain: BrainService): void {
  const handler = (run: (req: any, userId: string) => unknown) => (req: any, res: any) => {
    try {
      const userId = req.user?.sub || req.user?.id;
      if (!userId) throw new BrainError('UNAUTHORIZED', 401);
      res.json(run(req, userId));
    } catch (error) {
      if (error instanceof BrainError) res.status(error.status).json({ success: false, error: error.code });
      else res.status(500).json({ success: false, error: 'BRAIN_OPERATION_FAILED' });
    }
  };
  const scope = (value: any) => ({ projectId: field(value, 'projectId', 'project_id'), threadId: field(value, 'threadId', 'thread_id') });
  const searchOptions = (value: any) => ({ ...scope(value), query: value?.query ?? value?.q, limit: value?.limit });
  const input = (value: any) => ({
    ...scope(value), topic: value?.topic, insight: value?.insight, category: value?.category,
    sourceThreadId: field(value, 'sourceThreadId', 'source_thread_id'), sourceId: field(value, 'sourceId', 'source_id'),
    provenance: value?.provenance, expiresAt: field(value, 'expiresAt', 'expires_at'),
  });
  const expectedVersion = (value: any): number | undefined => {
    const version = field(value, 'expectedVersion', 'expected_version');
    if (version === undefined) return undefined;
    const parsed = Number(version);
    if (!Number.isInteger(parsed) || parsed < 1) throw new BrainError('BRAIN_INVALID_VERSION');
    return parsed;
  };
  app.get('/api/brain', requireAuth, handler((req, userId) => ({ success: true,
    data: brain.list(userId, { status: req.query.status, limit: req.query.limit, offset: req.query.offset }) })));
  app.get('/api/brain/search', requireAuth, handler((req, userId) => ({ success: true,
    data: brain.search(userId, { ...searchOptions(req.query), status: req.query.status,
      includeExpired: req.query.include_expired === 'true' }) })));
  const recall = handler((req, userId) => ({ success: true, data: brain.recall(userId, {
    ...searchOptions(req.method === 'GET' ? req.query : req.body),
    maxChars: field(req.method === 'GET' ? req.query : req.body, 'maxChars', 'max_chars'),
  }) }));
  app.get('/api/brain/recall', requireAuth, recall);
  app.post('/api/brain/recall', requireAuth, recall);
  app.post('/api/brain/proposals', requireAuth, handler((req, userId) => {
    const data = brain.propose(userId, { ...input(req.body), source: 'user_proposal' });
    return { success: true, id: data.id, data, requires_approval: true };
  }));
  app.post('/api/brain', requireAuth, handler((req, userId) => {
    const data = brain.createApproved(userId, { ...input(req.body), source: 'user' });
    return { success: true, id: data.id, data, category: data.category, reinforced: false };
  }));
  app.post('/api/brain/:id/approve', requireAuth, handler((req, userId) => ({ success: true,
    data: brain.approve(userId, req.params.id, expectedVersion(req.body)) })));
  app.put('/api/brain/:id', requireAuth, handler((req, userId) => ({ success: true, updated: true,
    data: brain.update(userId, req.params.id, { topic: req.body?.topic, insight: req.body?.insight,
      category: req.body?.category, expiresAt: field(req.body, 'expiresAt', 'expires_at'), expectedVersion: expectedVersion(req.body) }) })));
  app.delete('/api/brain/:id', requireAuth, handler((req, userId) => ({ success: true,
    ...brain.remove(userId, req.params.id, expectedVersion({ ...req.query, ...req.body })) })));
}
