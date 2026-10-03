// Local workspace data has an explicit Forge account owner. Never adopt old
// unowned browser records: they may have been written by another signed-in user.
const prefix = 'forge_account_v1:';
const credentialKeys = ['forge_service_creds', 'forge_llm_creds', 'forge_web_creds', 'forge_connector_keys'];
let generation = 0;
export const invalidateAccountLocalState = () => { generation++; };
function currentAccount(): string | null {
  try { const id = JSON.parse(localStorage.getItem('forge_user') || 'null')?.id; return typeof id === 'string' && id ? id : null; } catch { return null; }
}
function accountPrefix(id: string) { return prefix + encodeURIComponent(id) + ':'; }
export function hasUnownedLocalWorkspaceData() {
  try {
    return ['forge_tracker', 'forge_custom_skills', 'forge_custom_skills_v2'].some(key => {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(rows) && rows.length > 0;
    });
  } catch { return false; }
}
export function retireLegacyLocalCredentials() {
  if (typeof localStorage === 'undefined') return false;
  const hasValue = (value: unknown): boolean => typeof value === 'string' ? !!value.trim()
    : value === true || (!!value && typeof value === 'object' && Object.values(value).some(hasValue));
  let hadRecords = false;
  for (const key of [...credentialKeys, 'llmCreds']) {
    const raw = localStorage.getItem(key);
    if (raw) { try { hadRecords ||= hasValue(JSON.parse(raw)); } catch { hadRecords = true; } }
    localStorage.removeItem(key);
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('forge_svc_')) { hadRecords = true; localStorage.removeItem(key); }
  }
  return hadRecords;
}
export function clearAccountLocalCredentials(id?: string | null) {
  if (typeof localStorage === 'undefined') return;
  if (id) for (const key of credentialKeys) localStorage.removeItem(accountPrefix(id) + key);
  retireLegacyLocalCredentials();
}
export function createAccountLocalState() {
  const account = currentAccount(), session = generation;
  const current = () => !!account && session === generation && currentAccount() === account;
  return {
    getItem(key: string): string | null {
      return current() ? localStorage.getItem(accountPrefix(account!) + key) : null;
    },
    setItem(key: string, value: string) {
      if (current()) localStorage.setItem(accountPrefix(account!) + key, value);
    },
    removeItem(key: string) {
      if (current()) localStorage.removeItem(accountPrefix(account!) + key);
    },
  };
}
