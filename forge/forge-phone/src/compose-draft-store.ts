import * as FileSystem from 'expo-file-system';
import { normalizeForgeApiUrl } from './config';

export type ComposeDraft = { kind: 'reply' | 'marketing'; name: string; source: string; releaseId: string };
type Owner = { apiUrl: string; userId: string };
type Entry = Owner & { draft: ComposeDraft };
type Store = { schemaVersion: 1; drafts: Entry[] };

const FILE_NAME = 'forge-compose-drafts-v1.json';
// Bound parsing and retained account drafts to 4 MiB. A future schema can migrate
// or split this store explicitly; never evict another account's draft to fit.
const MAX_BYTES = 4 * 1024 * 1024;
let queue: Promise<void> = Promise.resolve();

function fail(code: string): never { throw new Error(code); }
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function exactKeys(value: Record<string, unknown>, names: string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === names.length && names.every(name => keys.includes(name));
}
function validUserId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256
    && !!value.trim() && !/[\u0000-\u001f\u007f]/.test(value);
}
function owner(apiUrl: string, userId: string): Owner {
  if (typeof apiUrl !== 'string' || !validUserId(userId)) fail('COMPOSE_DRAFT_INPUT_INVALID');
  return { apiUrl: normalizeForgeApiUrl(apiUrl), userId };
}
function checkedDraft(value: unknown, stored = false): ComposeDraft {
  const code = stored ? 'COMPOSE_DRAFT_STORAGE_INVALID' : 'COMPOSE_DRAFT_INPUT_INVALID';
  if (!object(value) || stored && !exactKeys(value, ['kind', 'name', 'source', 'releaseId'])
    || !['reply', 'marketing'].includes(value.kind as string)
    || typeof value.name !== 'string' || value.name.length > 100
    || typeof value.source !== 'string' || value.source.length > 6000
    || typeof value.releaseId !== 'string' || value.releaseId.length > 256
    || /[\u0000-\u001f\u007f]/.test(value.releaseId)) fail(code);
  // Copy just editable inputs, even if a caller accidentally supplies extra state.
  return { kind: value.kind as ComposeDraft['kind'], name: value.name, source: value.source, releaseId: value.releaseId };
}
function serial<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation);
  // Return each failure to its caller while keeping later operations usable.
  queue = result.then(() => {}, () => {});
  return result;
}
function bytes(text: string): number {
  let size = 0;
  for (let i = 0; i < text.length; i += 1) {
    const unit = text.charCodeAt(i);
    if (unit < 0x80) size += 1;
    else if (unit < 0x800) size += 2;
    else if (unit >= 0xd800 && unit <= 0xdbff && i + 1 < text.length
      && text.charCodeAt(i + 1) >= 0xdc00 && text.charCodeAt(i + 1) <= 0xdfff) { size += 4; i += 1; }
    else size += 3;
    if (size > MAX_BYTES) fail('COMPOSE_DRAFT_STORAGE_LIMIT');
  }
  return size;
}
async function path(): Promise<string> {
  const directory = FileSystem.documentDirectory;
  if (!directory || !directory.startsWith('file://')) fail('COMPOSE_DRAFT_STORAGE_UNAVAILABLE');
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists || !info.isDirectory) fail('COMPOSE_DRAFT_STORAGE_UNAVAILABLE');
  return `${directory}${directory.endsWith('/') ? '' : '/'}${FILE_NAME}`;
}
async function load(file: string): Promise<Store> {
  const info = await FileSystem.getInfoAsync(file);
  if (!info.exists) return { schemaVersion: 1, drafts: [] };
  if (info.isDirectory || !Number.isFinite(info.size) || info.size < 0) fail('COMPOSE_DRAFT_STORAGE_INVALID');
  if (info.size > MAX_BYTES) fail('COMPOSE_DRAFT_STORAGE_LIMIT');
  const text = await FileSystem.readAsStringAsync(file, { encoding: FileSystem.EncodingType.UTF8 });
  bytes(text);
  let value: unknown;
  try { value = JSON.parse(text); } catch { fail('COMPOSE_DRAFT_STORAGE_INVALID'); }
  if (!object(value) || !exactKeys(value, ['schemaVersion', 'drafts']) || value.schemaVersion !== 1
    || !Array.isArray(value.drafts)) fail('COMPOSE_DRAFT_STORAGE_INVALID');
  const seen = new Set<string>();
  const drafts: Entry[] = value.drafts.map(entry => {
    if (!object(entry) || !exactKeys(entry, ['apiUrl', 'userId', 'draft'])
      || typeof entry.apiUrl !== 'string' || !validUserId(entry.userId)) fail('COMPOSE_DRAFT_STORAGE_INVALID');
    let normalized: string;
    try { normalized = normalizeForgeApiUrl(entry.apiUrl); } catch { fail('COMPOSE_DRAFT_STORAGE_INVALID'); }
    const key = JSON.stringify([normalized, entry.userId]);
    if (normalized !== entry.apiUrl || seen.has(key)) fail('COMPOSE_DRAFT_STORAGE_INVALID');
    seen.add(key);
    return { apiUrl: normalized, userId: entry.userId, draft: checkedDraft(entry.draft, true) };
  });
  return { schemaVersion: 1, drafts };
}
async function write(file: string, store: Store): Promise<void> {
  const text = JSON.stringify(store);
  bytes(text);
  const temporary = `${file}.tmp`;
  await FileSystem.writeAsStringAsync(temporary, text, { encoding: FileSystem.EncodingType.UTF8 });
  // expo-file-system 17's Android file:// move uses File.renameTo. The sibling
  // temp stays on the same filesystem; never delete the last complete file first.
  // Failed writes/moves leave only a temp file, overwritten by the next save.
  await FileSystem.moveAsync({ from: temporary, to: file });
}
const matches = (entry: Owner, expected: Owner) => entry.apiUrl === expected.apiUrl && entry.userId === expected.userId;

export async function readComposeDraft(apiUrl: string, userId: string): Promise<ComposeDraft | null> {
  const expected = owner(apiUrl, userId);
  return serial(async () => {
    const store = await load(await path());
    const entry = store.drafts.find(item => matches(item, expected));
    return entry ? { ...entry.draft } : null;
  });
}
export async function saveComposeDraft(apiUrl: string, userId: string, draft: ComposeDraft): Promise<void> {
  const expected = owner(apiUrl, userId);
  const snapshot = checkedDraft(draft);
  return serial(async () => {
    const file = await path();
    const store = await load(file);
    store.drafts = store.drafts.filter(item => !matches(item, expected));
    store.drafts.push({ ...expected, draft: snapshot });
    await write(file, store);
  });
}
export async function clearComposeDraft(apiUrl: string, userId: string): Promise<void> {
  const expected = owner(apiUrl, userId);
  return serial(async () => {
    const file = await path();
    const store = await load(file);
    const kept = store.drafts.filter(item => !matches(item, expected));
    if (kept.length === store.drafts.length) return;
    await write(file, { schemaVersion: 1, drafts: kept });
  });
}
