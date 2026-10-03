import { SessionManager } from '@earendil-works/pi-coding-agent';

const clone = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const invalid = () => { throw new Error('PI_SESSION_SNAPSHOT_INVALID'); };

/** Forge owns this versioned envelope. Entries remain native Pi records, including
 * abandoned branches, extension state and compaction provenance. */
export function snapshotSession(manager) {
  return clone({ version: 1, sessionId: manager.getSessionId(), header: manager.getHeader(),
    entries: manager.getEntries(), leafId: manager.getLeafId() });
}

export function restoreSession(cwd, snapshot) {
  if (!object(snapshot) || snapshot.version !== 1 || !Array.isArray(snapshot.entries) || snapshot.entries.length > 100000) invalid();
  const { header, entries, leafId, sessionId } = clone(snapshot);
  if (typeof sessionId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) invalid();
  if (header !== undefined && (!object(header) || header.type !== 'session' || header.id !== sessionId || header.version !== 3 || typeof header.timestamp !== 'string')) invalid();
  const ids = new Set();
  for (const entry of entries) {
    if (!object(entry) || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) || typeof entry.type !== 'string' || entry.type === 'session' || typeof entry.timestamp !== 'string') invalid();
    // Native entries are append-only: a parent must precede its child. This also
    // rejects cyclic/unreachable histories before SDK traversal can loop forever.
    if (entry.parentId !== null && !ids.has(entry.parentId)) invalid();
    if (entry.type === 'message' && (!object(entry.message) || !['user', 'assistant', 'toolResult', 'custom', 'bashExecution'].includes(entry.message.role))) invalid();
    if (entry.type === 'compaction' && (typeof entry.summary !== 'string' || !ids.has(entry.firstKeptEntryId))) invalid();
    ids.add(entry.id);
  }
  if (leafId !== null && !ids.has(leafId)) invalid();
  // The supplied header is data only; never use its cwd/path for IO.
  const manager = SessionManager.inMemory(cwd, { id: sessionId }, header ? [header, ...entries] : entries);
  if (leafId === null) manager.resetLeaf(); else manager.branch(leafId);
  return manager;
}

export function appendLegacyMessage(manager, message) {
  // A legacy messages-only checkpoint has already projected away native IDs.
  // Preserve its summary as context; only piSession can retain the original tree.
  if (message.role === 'compactionSummary' || message.role === 'branchSummary') {
    manager.appendCustomMessageEntry(`forge-legacy-${message.role}`, String(message.summary || ''), false);
  } else manager.appendMessage(message);
}

export function sessionPlan(manager) {
  const entry = [...manager.getBranch()].reverse().find(value => value.type === 'custom' && value.customType === 'forge-plan');
  return Array.isArray(entry?.data?.steps) ? clone(entry.data.steps) : [];
}
