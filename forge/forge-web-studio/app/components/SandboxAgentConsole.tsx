'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SandboxAgentConsoleProps = {
  apiBase: string;
  token: string;
  initialModel: string;
  onModelChange: (model: string) => void;
  onToast?: (message: string) => void;
};

type GoogleDriveConnectionCardProps = {
  apiBase: string;
  token: string;
  onToast?: (message: string) => void;
};

type TokenRef = React.MutableRefObject<string>;

const TERMINAL_RUN_STATES = new Set(['completed', 'failed', 'cancelled']);
const ACTIVE_RUN_STATES = new Set([
  'requested', 'provisioning', 'ready', 'hydrating_workspace', 'running',
  'waiting_approval', 'paused', 'retrying', 'checkpointing',
  'artifact_committing', 'destroying',
]);
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

let googleIdentityScriptPromise: Promise<void> | null = null;
let googlePickerScriptPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    const onLoad = () => { script.dataset.loaded = 'true'; resolve(); };
    const onError = () => reject(new Error(`Failed to load ${new URL(src).hostname}`));
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!existing) {
      script.src = src;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

async function ensureGooglePickerRuntime(): Promise<any> {
  googleIdentityScriptPromise ||= loadScript('https://accounts.google.com/gsi/client');
  googlePickerScriptPromise ||= loadScript('https://apis.google.com/js/api.js');
  await Promise.all([googleIdentityScriptPromise, googlePickerScriptPromise]);
  const googleRuntime = (window as any).google;
  const gapiRuntime = (window as any).gapi;
  if (!googleRuntime?.accounts?.oauth2 || !gapiRuntime?.load) throw new Error('GOOGLE_PICKER_RUNTIME_UNAVAILABLE');
  if (!googleRuntime.picker) {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };
      gapiRuntime.load('picker', {
        callback: () => finish(resolve),
        onerror: () => finish(() => reject(new Error('GOOGLE_PICKER_MODULE_FAILED'))),
        timeout: 15_000,
        ontimeout: () => finish(() => reject(new Error('GOOGLE_PICKER_MODULE_TIMEOUT'))),
      });
    });
  }
  return (window as any).google;
}

async function refreshForgeToken(apiBase: string, tokenRef: TokenRef): Promise<string | null> {
  const response = await fetch(`${apiBase}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    cache: 'no-store',
  }).catch(() => null);
  if (!response?.ok) return null;
  const body = await response.json().catch(() => ({}));
  const token = body?.data?.accessToken || body?.accessToken || '';
  if (!token) return null;
  tokenRef.current = token;
  try {
    const stored = JSON.parse(localStorage.getItem('forge_user') || '{}');
    stored.token = token;
    localStorage.setItem('forge_user', JSON.stringify(stored));
  } catch {}
  return token;
}

async function forgeJson(
  apiBase: string,
  tokenRef: TokenRef,
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<any> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${tokenRef.current}`,
    },
  });
  if (response.status === 401 && retry && await refreshForgeToken(apiBase, tokenRef)) {
    return forgeJson(apiBase, tokenRef, path, options, false);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = typeof body?.error === 'string' ? body.error : '';
    const friendlyByCode: Record<string, string> = {
      PI_RUNTIME_UNAVAILABLE: 'The Forge execution runtime is temporarily unavailable. Please retry in a moment.',
    };
    throw new Error(body?.message || friendlyByCode[code] || code || `HTTP_${response.status}`);
  }
  return body;
}

function unwrapRows(value: any): any[] {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.data) ? value.data : [];
}

function parseJson(value: unknown, fallback: any = {}): any {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function formatBytes(value: unknown): string {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value: unknown): string {
  if (!value) return '—';
  const date = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function shortHash(value: unknown): string {
  const text = String(value || '');
  return text ? `${text.slice(0, 10)}…${text.slice(-6)}` : '—';
}

function sanitizeUploadName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '_').replace(/[. ]+$/g, '').slice(0, 160) || 'upload.bin';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length))));
  }
  return btoa(chunks.join(''));
}

function statusColor(status: unknown): string {
  const normalized = String(status || '').toLowerCase();
  if (['completed', 'destroyed', 'approved', 'active', 'connected'].includes(normalized)) return '#37d996';
  if (['failed', 'cancelled', 'rejected', 'error', 'revoked'].includes(normalized)) return '#ff5364';
  if (['waiting_approval', 'pending', 'processing', 'destroying'].includes(normalized)) return '#ffba49';
  return '#7aa7ff';
}

function ErrorNotice({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  if (!message) return null;
  return (
    <div className="sac-error" role="alert">
      <span>!</span><div>{message}</div>
      {onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss error">×</button>}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="sac-metric">
      <span>{label}</span>
      <strong style={accent ? { color: accent } : undefined}>{value}</strong>
    </div>
  );
}

function ActionButton({
  children, onClick, disabled, tone = 'neutral', title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'neutral' | 'danger' | 'approval';
  title?: string;
}) {
  return (
    <button type="button" className={`sac-action sac-action-${tone}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

function useTokenRef(token: string): TokenRef {
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);
  return tokenRef;
}

async function startGoogleOAuth(apiBase: string, tokenRef: TokenRef): Promise<Window | null> {
  const returnPath = `${window.location.pathname}${window.location.search}`;
  const response = await forgeJson(apiBase, tokenRef, '/google-drive/oauth/start', {
    method: 'POST',
    body: JSON.stringify({ returnPath }),
  });
  const authorizationUrl = String(response?.authorizationUrl || '');
  if (!authorizationUrl) throw new Error('GOOGLE_DRIVE_AUTHORIZATION_URL_MISSING');
  const popup = window.open(authorizationUrl, 'forge-google-drive-oauth', 'popup=yes,width=560,height=760');
  if (!popup) window.location.assign(authorizationUrl);
  return popup;
}

function GoogleDriveConnectionCard({ apiBase, token, onToast }: GoogleDriveConnectionCardProps) {
  const tokenRef = useTokenRef(token);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const next = await forgeJson(apiBase, tokenRef, '/google-drive/config');
      setConfig(next);
      setError('');
      return next;
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_CONFIG_FAILED');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiBase, tokenRef]);

  useEffect(() => { void load(); }, [load]);

  const connect = async () => {
    setBusy(true); setError('');
    try {
      const popup = await startGoogleOAuth(apiBase, tokenRef);
      if (!popup) return;
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline) {
        await new Promise(resolve => window.setTimeout(resolve, 1000));
        const next = await load();
        if (next?.connected) {
          try { popup.close(); } catch {}
          onToast?.('Google Drive connected with encrypted server-side OAuth');
          return;
        }
        if (popup.closed) break;
      }
      throw new Error('Google Drive connection was not completed');
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_CONNECT_FAILED');
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Google Drive and revoke Forge access? Existing audit records will remain.')) return;
    setBusy(true); setError('');
    try {
      await forgeJson(apiBase, tokenRef, '/google-drive/connection', { method: 'DELETE' });
      await load();
      onToast?.('Google Drive disconnected and stored OAuth credentials removed');
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_DISCONNECT_FAILED');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gdc-card">
      <style>{DRIVE_CARD_STYLES}</style>
      <div className="gdc-mark">G</div>
      <div className="gdc-copy">
        <div className="gdc-title-row">
          <strong>Google Drive</strong>
          <span className="gdc-badge" style={{ color: statusColor(config?.connected ? 'connected' : 'offline') }}>
            {loading ? 'CHECKING' : config?.connected ? 'CONNECTED' : 'NOT CONNECTED'}
          </span>
        </div>
        <p>
          User-owned persistent storage for selected inputs and approved artifact write-back. OAuth tokens stay encrypted in Forge and never enter a sandbox.
        </p>
        {config?.connected && (
          <div className="gdc-account">
            <span>{config.account?.displayName || 'Google account'}</span>
            <code>{config.account?.email || 'Account email unavailable'}</code>
          </div>
        )}
        {!config?.configured && !loading && <div className="gdc-warning">Google OAuth environment variables are not configured on the Forge backend.</div>}
        {config?.configured && !config?.pickerConfigured && <div className="gdc-warning">OAuth is configured, but Picker requires GOOGLE_DRIVE_DEVELOPER_KEY and GOOGLE_DRIVE_APP_ID.</div>}
        {config?.reauthorizationRequired && <div className="gdc-warning">Reconnect to grant offline access and restore automatic token refresh.</div>}
        <ErrorNotice message={error} onDismiss={() => setError('')} />
      </div>
      <div className="gdc-actions">
        {config?.connected
          ? <ActionButton tone="danger" onClick={disconnect} disabled={busy}>Disconnect</ActionButton>
          : <ActionButton tone="primary" onClick={connect} disabled={busy || !config?.configured}>{busy ? 'Connecting…' : 'Connect Drive'}</ActionButton>}
      </div>
    </div>
  );
}

function GoogleDriveRunPanel({
  apiBase, tokenRef, workspaceId, selectedRun, details, onToast,
}: {
  apiBase: string;
  tokenRef: TokenRef;
  workspaceId: string;
  selectedRun: any;
  details: any;
  onToast?: (message: string) => void;
}) {
  const [config, setConfig] = useState<any>(null);
  const [selections, setSelections] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [writebacks, setWritebacks] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const loadDrive = useCallback(async () => {
    try {
      const [nextConfig, nextSelections, nextTransfers, nextWritebacks] = await Promise.all([
        forgeJson(apiBase, tokenRef, '/google-drive/config'),
        forgeJson(apiBase, tokenRef, '/google-drive/selections'),
        forgeJson(apiBase, tokenRef, `/google-drive/transfers${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''}`),
        forgeJson(apiBase, tokenRef, `/google-drive/writebacks${selectedRun?.id ? `?runId=${encodeURIComponent(selectedRun.id)}` : ''}`),
      ]);
      setConfig(nextConfig);
      setSelections(unwrapRows(nextSelections));
      setTransfers(unwrapRows(nextTransfers));
      setWritebacks(unwrapRows(nextWritebacks));
      setError('');
      return nextConfig;
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_LOAD_FAILED');
      return null;
    }
  }, [apiBase, tokenRef, workspaceId, selectedRun?.id]);

  useEffect(() => { void loadDrive(); }, [loadDrive]);

  const connect = async () => {
    setBusy('connect'); setError('');
    try {
      const popup = await startGoogleOAuth(apiBase, tokenRef);
      if (!popup) return;
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline) {
        await new Promise(resolve => window.setTimeout(resolve, 1000));
        const next = await loadDrive();
        if (next?.connected) {
          try { popup.close(); } catch {}
          onToast?.('Google Drive connected');
          return;
        }
        if (popup.closed) break;
      }
      throw new Error('Google Drive connection was not completed');
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_CONNECT_FAILED');
    } finally {
      setBusy('');
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Google Drive and revoke Forge access?')) return;
    setBusy('disconnect'); setError('');
    try {
      await forgeJson(apiBase, tokenRef, '/google-drive/connection', { method: 'DELETE' });
      await loadDrive();
      onToast?.('Google Drive disconnected');
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_DISCONNECT_FAILED');
    } finally { setBusy(''); }
  };

  const requestPickerToken = async (): Promise<string> => {
    if (!config?.picker?.clientId || !config?.picker?.scope) throw new Error('GOOGLE_DRIVE_PICKER_NOT_CONFIGURED');
    const googleRuntime = await ensureGooglePickerRuntime();
    return new Promise<string>((resolve, reject) => {
      const client = googleRuntime.accounts.oauth2.initTokenClient({
        client_id: config.picker.clientId,
        scope: config.picker.scope,
        callback: (response: any) => {
          if (response?.error || !response?.access_token) reject(new Error(response?.error || 'GOOGLE_PICKER_TOKEN_FAILED'));
          else resolve(String(response.access_token));
        },
        error_callback: (response: any) => reject(new Error(response?.message || response?.type || 'GOOGLE_PICKER_TOKEN_FAILED')),
      });
      client.requestAccessToken({ prompt: '' });
    });
  };

  const chooseFromDrive = async (role: 'input' | 'output_folder') => {
    setBusy(`picker:${role}`); setError('');
    try {
      const googleRuntime = await ensureGooglePickerRuntime();
      // The short-lived Picker token is kept only in this stack frame and is never stored in React state.
      const accessToken = await requestPickerToken();
      const items = await new Promise<Array<{ id: string; resourceKey?: string }>>((resolve, reject) => {
        try {
          const picker = googleRuntime.picker;
          const viewId = role === 'output_folder' ? picker.ViewId.FOLDERS : picker.ViewId.DOCS;
          const view = new picker.DocsView(viewId);
          if (role === 'output_folder') {
            view.setIncludeFolders(true);
            view.setSelectFolderEnabled(true);
          } else {
            view.setIncludeFolders(false);
          }
          let builder = new picker.PickerBuilder()
            .setOAuthToken(accessToken)
            .setDeveloperKey(config.picker.developerKey)
            .setAppId(config.picker.appId)
            .setTitle(role === 'output_folder' ? 'Choose a Forge output folder' : 'Choose files to import into Forge')
            .addView(view)
            .setCallback((data: any) => {
              if (data?.action === picker.Action.CANCEL) resolve([]);
              if (data?.action !== picker.Action.PICKED) return;
              const docs = Array.isArray(data.docs) ? data.docs : [];
              const picked = docs.map((doc: any) => {
                const id = doc.id || doc[picker.Document?.ID];
                const resourceKey = doc.resourceKey || doc.resource_key || doc[picker.Document?.RESOURCE_KEY];
                return { id: String(id || ''), ...(resourceKey ? { resourceKey: String(resourceKey) } : {}) };
              }).filter((item: any) => item.id);
              resolve(role === 'output_folder' ? picked.slice(0, 1) : picked);
            });
          if (role === 'input') builder = builder.enableFeature(picker.Feature.MULTISELECT_ENABLED);
          if (picker.Feature?.SUPPORT_DRIVES) builder = builder.enableFeature(picker.Feature.SUPPORT_DRIVES);
          if (typeof builder.setOrigin === 'function') builder = builder.setOrigin(window.location.origin);
          builder.build().setVisible(true);
        } catch (pickerError) { reject(pickerError); }
      });
      if (!items.length) return;
      await forgeJson(apiBase, tokenRef, '/google-drive/selections', {
        method: 'POST',
        body: JSON.stringify({ role, items }),
      });
      await loadDrive();
      onToast?.(role === 'output_folder' ? 'Drive output folder verified by Forge' : `${items.length} Drive file selection(s) verified by Forge`);
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_PICKER_FAILED');
    } finally { setBusy(''); }
  };

  const importSelection = async (selection: any) => {
    if (!workspaceId) { setError('Create or select a Workspace before importing Drive files'); return; }
    setBusy(`import:${selection.id}`); setError('');
    try {
      const response = await forgeJson(apiBase, tokenRef, `/google-drive/selections/${encodeURIComponent(selection.id)}/import`, {
        method: 'POST',
        body: JSON.stringify({ workspaceId }),
      });
      await loadDrive();
      onToast?.(response?.deduplicated ? `${selection.name} already exists at the verified Drive version` : `${selection.name} imported into the Workspace`);
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_IMPORT_FAILED');
      await loadDrive();
    } finally { setBusy(''); }
  };

  const requestWriteback = async (artifact: any, folderId: string) => {
    if (!selectedRun?.id || !folderId) return;
    setBusy(`writeback:${artifact.id}`); setError('');
    try {
      await forgeJson(apiBase, tokenRef, `/agent-runs/${selectedRun.id}/artifacts/${encodeURIComponent(artifact.id)}/google-drive/writebacks`, {
        method: 'POST',
        body: JSON.stringify({ targetSelectionId: folderId }),
      });
      await loadDrive();
      onToast?.('Drive write-back approval requested; no Drive write has occurred yet');
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_WRITEBACK_REQUEST_FAILED');
    } finally { setBusy(''); }
  };

  const approveWriteback = async (writeback: any) => {
    setBusy(`approve-writeback:${writeback.id}`); setError('');
    try {
      await forgeJson(apiBase, tokenRef, `/google-drive/writebacks/${encodeURIComponent(writeback.id)}/approve`, { method: 'POST', body: '{}' });
      await loadDrive();
      onToast?.('Artifact created in Google Drive as a new file');
    } catch (nextError: any) {
      setError(nextError?.message || 'GOOGLE_DRIVE_WRITEBACK_FAILED');
      await loadDrive();
    } finally { setBusy(''); }
  };

  const inputSelections = selections.filter(selection => selection.role === 'input');
  const outputFolders = selections.filter(selection => selection.role === 'output_folder');
  const latestTransferFor = (selectionId: string) => transfers.find(transfer => transfer.selection_id === selectionId && transfer.direction === 'import');
  const writebackFor = (artifactId: string) => writebacks.find(writeback => String(writeback.artifact_id) === String(artifactId));

  return (
    <section className="sac-panel sac-drive-panel">
      <div className="sac-panel-heading">
        <div>
          <span className="sac-eyebrow">USER-OWNED STORAGE</span>
          <h3>Google Drive bridge</h3>
        </div>
        <div className="sac-heading-actions">
          {config?.connected
            ? <><span className="sac-inline-status"><i style={{ background: '#37d996' }} />{config.account?.email || 'Connected'}</span><ActionButton tone="danger" onClick={disconnect} disabled={Boolean(busy)}>Disconnect</ActionButton></>
            : <ActionButton tone="primary" onClick={connect} disabled={Boolean(busy) || !config?.configured}>{busy === 'connect' ? 'Connecting…' : 'Connect Drive'}</ActionButton>}
        </div>
      </div>

      <div className="sac-security-rail">
        <span>OAUTH</span><b>Forge encrypted vault</b><em>→</em><b>verified selection IDs</b><em>→</em><b>Workspace copy</b><em>→</em><b>approval</b><em>→</em><b>new Drive file</b>
      </div>
      {!config?.configured && <div className="sac-empty">Backend OAuth configuration is missing. Add the five GOOGLE_DRIVE_* environment variables before connecting.</div>}
      {config?.reauthorizationRequired && <div className="sac-approval-box"><strong>Reauthorization required</strong><p>Reconnect to obtain offline access. The browser never receives the stored Forge refresh token.</p></div>}
      <ErrorNotice message={error} onDismiss={() => setError('')} />

      {config?.connected && (
        <div className="sac-drive-grid">
          <div className="sac-drive-column">
            <div className="sac-subhead">
              <div><strong>Inputs</strong><span>Verified copies imported into the selected Workspace</span></div>
              <ActionButton onClick={() => chooseFromDrive('input')} disabled={Boolean(busy) || !config?.pickerConfigured}>{busy === 'picker:input' ? 'Opening…' : '+ Select files'}</ActionButton>
            </div>
            {inputSelections.length === 0 && <div className="sac-empty compact">No Drive input files selected.</div>}
            {inputSelections.map(selection => {
              const transfer = latestTransferFor(selection.id);
              return (
                <div className="sac-file-row" key={selection.id}>
                  <div className="sac-file-icon">{selection.mimeType?.includes('google-apps') ? 'G' : 'F'}</div>
                  <div className="sac-file-copy">
                    <strong>{selection.name}</strong>
                    <span>{selection.driveId ? 'Shared Drive' : 'My Drive'} · v{selection.driveVersion || '?'} · {formatBytes(selection.sizeBytes)}</span>
                    {transfer && <code style={{ color: statusColor(transfer.status) }}>{String(transfer.status).toUpperCase()} · {transfer.workspace_path || transfer.error || shortHash(transfer.sha256)}</code>}
                  </div>
                  <ActionButton onClick={() => importSelection(selection)} disabled={Boolean(busy) || !workspaceId}>{busy === `import:${selection.id}` ? 'Importing…' : transfer?.status === 'completed' || transfer?.status === 'deduplicated' ? 'Recheck' : 'Import'}</ActionButton>
                </div>
              );
            })}
          </div>

          <div className="sac-drive-column">
            <div className="sac-subhead">
              <div><strong>Approved outputs</strong><span>Create-new-file only; overwrite, move, share, and delete are blocked</span></div>
              <ActionButton onClick={() => chooseFromDrive('output_folder')} disabled={Boolean(busy) || !config?.pickerConfigured}>{busy === 'picker:output_folder' ? 'Opening…' : '+ Choose folder'}</ActionButton>
            </div>
            {outputFolders.length === 0 && <div className="sac-empty compact">Choose one output folder before requesting a write-back.</div>}
            {outputFolders.map(folder => (
              <div className="sac-folder-row" key={folder.id}>
                <span>▰</span><div><strong>{folder.name}</strong><code>{folder.driveId ? 'Shared Drive' : 'My Drive'} · {folder.driveFileId}</code></div>
              </div>
            ))}

            {(details?.artifacts || []).map((artifact: any) => {
              const existing = writebackFor(artifact.id);
              const selectedFolder = existing?.target_selection_id || outputFolders[0]?.id || '';
              return (
                <div className="sac-artifact-drive" key={artifact.id}>
                  <div className="sac-file-copy">
                    <strong>{artifact.title || artifact.path}</strong>
                    <span>{formatBytes(artifact.bytes)} · SHA-256 {shortHash(artifact.sha256)}</span>
                  </div>
                  {!existing && (
                    <ActionButton
                      tone="approval"
                      onClick={() => requestWriteback(artifact, selectedFolder)}
                      disabled={selectedRun?.status !== 'completed' || !selectedFolder || Boolean(busy)}
                    >
                      {busy === `writeback:${artifact.id}` ? 'Requesting…' : 'Request write-back'}
                    </ActionButton>
                  )}
                  {existing && <span className="sac-inline-status" style={{ color: statusColor(existing.status) }}><i style={{ background: statusColor(existing.status) }} />{existing.status}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {writebacks.map(writeback => {
        const apiEvidence = parseJson(writeback.api_response, {});
        const driveUrl = apiEvidence.webViewLink || (writeback.drive_file_id ? `https://drive.google.com/open?id=${encodeURIComponent(writeback.drive_file_id)}` : '');
        return (
          <div className="sac-writeback" key={writeback.id}>
            <div className="sac-writeback-head">
              <span>EXTERNAL WRITE APPROVAL</span>
              <b style={{ color: statusColor(writeback.status) }}>{String(writeback.status).toUpperCase()}</b>
            </div>
            <p>{writeback.request_summary}</p>
            <div className="sac-writeback-evidence">
              <code>ACTION create-new-file</code><code>BYTES {formatBytes(writeback.bytes)}</code><code>SHA {shortHash(writeback.artifact_sha256)}</code>
            </div>
            {writeback.error && <div className="sac-error"><span>!</span><div>{writeback.error}</div></div>}
            {writeback.status === 'pending' && (
              <ActionButton tone="approval" onClick={() => approveWriteback(writeback)} disabled={Boolean(busy)}>
                {busy === `approve-writeback:${writeback.id}` ? 'Writing…' : 'Approve exact create action'}
              </ActionButton>
            )}
            {writeback.status === 'completed' && (
              <div className="sac-created-evidence">
                <span>CREATED FILE</span><code>{writeback.drive_file_id}</code><code>version {writeback.drive_version || '—'}</code>
                {driveUrl && <a href={driveUrl} target="_blank" rel="noreferrer">Open in Drive ↗</a>}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

export function SandboxAgentConsole({ apiBase, token, initialModel, onModelChange, onToast }: SandboxAgentConsoleProps) {
  const tokenRef = useTokenRef(token);
  const [runs, setRuns] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [details, setDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState('');
  const [steering, setSteering] = useState('');
  const [streamState, setStreamState] = useState<'idle' | 'connecting' | 'live' | 'reconnecting' | 'complete'>('idle');
  const latestEventId = useRef(0);
  const [form, setForm] = useState({
    name: '',
    prompt: '',
    model: initialModel || '',
    workspaceId: '',
    maxCostUsd: '2.00',
    maxToolCalls: '30',
  });

  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name?: string; provider?: string; tier?: string }>>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    if (initialModel && !form.model) setForm(previous => ({ ...previous, model: initialModel }));
  }, [initialModel, form.model]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await forgeJson(apiBase, tokenRef, '/models/available');
        const list = Array.isArray(response?.data?.models) ? response.data.models : [];
        if (!cancelled) setAvailableModels(list.filter((model: any) => model && model.id));
      } catch {
        if (!cancelled) setAvailableModels([]);
      } finally {
        if (!cancelled) setModelsLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [apiBase, tokenRef]);

  useEffect(() => {
    if (!availableModels.length) return;
    setForm(previous => {
      if (previous.model && availableModels.some(model => model.id === previous.model)) return previous;
      const preferred = initialModel && availableModels.some(model => model.id === initialModel)
        ? initialModel
        : availableModels[0].id;
      return { ...previous, model: preferred };
    });
  }, [availableModels, initialModel]);

  const loadRuns = useCallback(async () => {
    const response = await forgeJson(apiBase, tokenRef, '/agent-runs');
    const nextRuns = unwrapRows(response).filter(run => run.execution_mode === 'sandbox');
    setRuns(nextRuns);
    setSelectedRunId(previous => previous && nextRuns.some(run => String(run.id) === previous)
      ? previous
      : nextRuns[0] ? String(nextRuns[0].id) : '');
    return nextRuns;
  }, [apiBase, tokenRef]);

  const loadWorkspaces = useCallback(async () => {
    const response = await forgeJson(apiBase, tokenRef, '/sandbox-workspaces');
    const nextWorkspaces = unwrapRows(response);
    setWorkspaces(nextWorkspaces);
    setForm(previous => ({ ...previous, workspaceId: previous.workspaceId || nextWorkspaces[0]?.id || '' }));
    return nextWorkspaces;
  }, [apiBase, tokenRef]);

  const loadDetails = useCallback(async (runId: string, quiet = false) => {
    if (!runId) { setDetails(null); return null; }
    if (!quiet) setLoadingDetails(true);
    try {
      const response = await forgeJson(apiBase, tokenRef, `/agent-runs/${encodeURIComponent(runId)}/details`);
      setDetails(response);
      return response;
    } catch (nextError: any) {
      if (!quiet) setError(nextError?.message || 'SANDBOX_RUN_DETAILS_FAILED');
      return null;
    } finally {
      if (!quiet) setLoadingDetails(false);
    }
  }, [apiBase, tokenRef]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadRuns(), loadWorkspaces()]).catch((nextError: any) => {
      if (!cancelled) setError(nextError?.message || 'SANDBOX_CONSOLE_LOAD_FAILED');
    });
    const interval = window.setInterval(() => { void loadRuns().catch(() => undefined); }, 5000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [loadRuns, loadWorkspaces]);

  useEffect(() => {
    latestEventId.current = 0;
    if (!selectedRunId) { setDetails(null); setStreamState('idle'); return; }
    void loadDetails(selectedRunId);
    const controller = new AbortController();
    let stopped = false;
    let refreshTimer: number | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void loadDetails(selectedRunId, true);
        void loadRuns().catch(() => undefined);
      }, 250);
    };

    const stream = async () => {
      let firstAttempt = true;
      while (!stopped) {
        setStreamState(firstAttempt ? 'connecting' : 'reconnecting');
        try {
          let response = await fetch(`${apiBase}/agent-runs/${encodeURIComponent(selectedRunId)}/events?after=${latestEventId.current}`, {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
              'Last-Event-ID': String(latestEventId.current),
            },
            credentials: 'include',
            cache: 'no-store',
            signal: controller.signal,
          });
          if (response.status === 401 && await refreshForgeToken(apiBase, tokenRef)) {
            response = await fetch(`${apiBase}/agent-runs/${encodeURIComponent(selectedRunId)}/events?after=${latestEventId.current}`, {
              headers: { Authorization: `Bearer ${tokenRef.current}`, 'Last-Event-ID': String(latestEventId.current) },
              credentials: 'include', cache: 'no-store', signal: controller.signal,
            });
          }
          if (!response.ok || !response.body) throw new Error(`SSE_HTTP_${response.status}`);
          setStreamState('live');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let streamComplete = false;
          while (!stopped) {
            const { done, value } = await reader.read();
            buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
            const frames = buffer.split(/\r?\n\r?\n/);
            buffer = frames.pop() || '';
            for (const frame of frames) {
              if (!frame.trim() || frame.trimStart().startsWith(':')) continue;
              let eventName = 'message';
              let eventId = '';
              const dataLines: string[] = [];
              for (const line of frame.split(/\r?\n/)) {
                if (line.startsWith('event:')) eventName = line.slice(6).trim();
                else if (line.startsWith('id:')) eventId = line.slice(3).trim();
                else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
              }
              if (eventId && Number.isFinite(Number(eventId))) latestEventId.current = Math.max(latestEventId.current, Number(eventId));
              if (eventName === 'stream_complete') { streamComplete = true; continue; }
              if (!dataLines.length) continue;
              const event = parseJson(dataLines.join('\n'), null);
              if (event) {
                setDetails((previous: any) => {
                  if (!previous) return previous;
                  const priorEvents = Array.isArray(previous.events) ? previous.events : [];
                  if (event.seq && priorEvents.some((item: any) => Number(item.seq) === Number(event.seq))) return previous;
                  return { ...previous, events: [...priorEvents, event].slice(-200) };
                });
                scheduleRefresh();
              }
            }
            if (done || streamComplete) break;
          }
          if (streamComplete) {
            setStreamState('complete');
            scheduleRefresh();
            return;
          }
        } catch (streamError: any) {
          if (stopped || streamError?.name === 'AbortError') return;
        }
        firstAttempt = false;
        await new Promise(resolve => window.setTimeout(resolve, 1250));
      }
    };

    void stream();
    return () => {
      stopped = true;
      controller.abort();
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    };
  }, [apiBase, tokenRef, selectedRunId, loadDetails, loadRuns]);

  const selectedRun = useMemo(
    () => details?.run || runs.find(run => String(run.id) === selectedRunId) || null,
    [details?.run, runs, selectedRunId],
  );

  const createWorkspace = async () => {
    const name = newWorkspaceName.trim();
    if (!name) return;
    setBusy('create-workspace'); setError('');
    try {
      const response = await forgeJson(apiBase, tokenRef, '/sandbox-workspaces', { method: 'POST', body: JSON.stringify({ name }) });
      const workspace = response?.data;
      await loadWorkspaces();
      if (workspace?.id) setForm(previous => ({ ...previous, workspaceId: workspace.id }));
      setNewWorkspaceName('');
      onToast?.('Persistent Forge Workspace created');
    } catch (nextError: any) { setError(nextError?.message || 'SANDBOX_WORKSPACE_CREATE_FAILED'); }
    finally { setBusy(''); }
  };

  const uploadWorkspaceFile = async () => {
    if (!uploadFile || !form.workspaceId) return;
    if (uploadFile.size > 10 * 1024 * 1024) { setError('Workspace uploads are limited to 10 MiB'); return; }
    setBusy('upload'); setError('');
    try {
      const contentBase64 = arrayBufferToBase64(await uploadFile.arrayBuffer());
      const path = uploadPath.trim() || `uploads/${sanitizeUploadName(uploadFile.name)}`;
      const response = await forgeJson(apiBase, tokenRef, `/sandbox-workspaces/${encodeURIComponent(form.workspaceId)}/files`, {
        method: 'POST',
        body: JSON.stringify({ path, contentBase64 }),
      });
      setUploadFile(null); setUploadPath('');
      const fileInput = document.getElementById('sac-workspace-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      onToast?.(`Workspace file verified: ${response?.data?.path || path}`);
    } catch (nextError: any) { setError(nextError?.message || 'SANDBOX_UPLOAD_FAILED'); }
    finally { setBusy(''); }
  };

  const startRun = async () => {
    if (!form.name.trim() || !form.prompt.trim() || !form.model.trim()) return;
    setBusy('start'); setError('');
    try {
      const response = await forgeJson(apiBase, tokenRef, '/agent-runs', {
        method: 'POST',
        headers: { 'Idempotency-Key': `forge-ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` },
        body: JSON.stringify({
          name: form.name.trim(), prompt: form.prompt.trim(), model: form.model.trim(),
          executionMode: 'sandbox', workspaceId: form.workspaceId || undefined,
          maxCostUsd: Number(form.maxCostUsd), maxToolCalls: Number(form.maxToolCalls),
        }),
      });
      onModelChange(form.model.trim());
      setForm(previous => ({ ...previous, name: '', prompt: '' }));
      await loadRuns();
      if (response?.id) setSelectedRunId(String(response.id));
      onToast?.('Sandbox Run accepted');
    } catch (nextError: any) { setError(nextError?.message || 'SANDBOX_RUN_START_FAILED'); }
    finally { setBusy(''); }
  };

  const runAction = async (action: string, path: string, options: RequestInit = { method: 'POST', body: '{}' }) => {
    if (!selectedRunId) return;
    setBusy(action); setError('');
    try {
      const response = await forgeJson(apiBase, tokenRef, path, options);
      await loadRuns();
      if (action === 'retry' && response?.id) setSelectedRunId(String(response.id));
      else await loadDetails(selectedRunId);
    } catch (nextError: any) { setError(nextError?.message || `SANDBOX_${action.toUpperCase()}_FAILED`); }
    finally { setBusy(''); }
  };

  const decideApproval = (decision: 'approve' | 'reject') => {
    if (!selectedRunId || !details?.approval?.id) return;
    void runAction(
      decision,
      `/agent-runs/${encodeURIComponent(selectedRunId)}/approvals/${encodeURIComponent(details.approval.id)}/${decision}`,
    );
  };

  const steerRun = async () => {
    const instruction = steering.trim();
    if (!instruction || !selectedRunId) return;
    await runAction('steer', `/agent-runs/${encodeURIComponent(selectedRunId)}/steer`, {
      method: 'POST', body: JSON.stringify({ instruction }),
    });
    setSteering('');
  };

  const downloadArtifact = async (artifact: any) => {
    if (!selectedRunId) return;
    setBusy(`download:${artifact.id}`); setError('');
    try {
      let response = await fetch(`${apiBase}/agent-runs/${encodeURIComponent(selectedRunId)}/artifacts/${encodeURIComponent(artifact.id)}/download`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` }, credentials: 'include', cache: 'no-store',
      });
      if (response.status === 401 && await refreshForgeToken(apiBase, tokenRef)) {
        response = await fetch(`${apiBase}/agent-runs/${encodeURIComponent(selectedRunId)}/artifacts/${encodeURIComponent(artifact.id)}/download`, {
          headers: { Authorization: `Bearer ${tokenRef.current}` }, credentials: 'include', cache: 'no-store',
        });
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP_${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const artifactFileName = String(artifact.path || '').split('/').pop() || '';
      const pathExtension = artifactFileName.includes('.') ? artifactFileName.slice(artifactFileName.lastIndexOf('.')) : '';
      const downloadBase = String(artifact.title || artifactFileName || 'forge-artifact').trim() || 'forge-artifact';
      link.download = !downloadBase.includes('.') && pathExtension ? `${downloadBase}${pathExtension}` : downloadBase;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (nextError: any) { setError(nextError?.message || 'SANDBOX_ARTIFACT_DOWNLOAD_FAILED'); }
    finally { setBusy(''); }
  };

  const run = details?.run || selectedRun;
  const isTerminal = TERMINAL_RUN_STATES.has(String(run?.status || ''));
  const canStop = ACTIVE_RUN_STATES.has(String(run?.status || '')) && !isTerminal;
  const canSteer = ['waiting_approval', 'paused'].includes(String(run?.status || ''));
  const pendingApprovalTool = (details?.tools || []).find(
    (tool: any) => String(tool?.id) === String(details?.approval?.tool_call_id || ''),
  ) || null;
  const pendingApprovalInput = pendingApprovalTool
    ? parseJson(pendingApprovalTool.input, pendingApprovalTool.input || {})
    : parseJson(details?.approval?.input, details?.approval?.input || {});
  const pendingApprovalToolName = pendingApprovalTool?.tool_name || details?.approval?.tool_name || 'unknown_tool';

  return (
    <div className="sac-shell">
      <style>{CONSOLE_STYLES}</style>
      <header className="sac-hero">
        <div>
          <div className="sac-kicker"><span>FORGE / EXECUTION PLANE</span><i />INVITATION-ONLY PRIVATE CANDIDATE</div>
          <h1>Sandbox Agent Console</h1>
          <p>Persistent workspaces. Disposable computers. Human approval before external mutation.</p>
        </div>
        <div className="sac-hero-architecture">
          <span>CONTROL</span><b>Forge</b><em>/</em><span>COMPUTE</span><b>per-Run sandbox</b><em>/</em><span>STORAGE</span><b>Workspace + Drive</b>
        </div>
      </header>

      <ErrorNotice message={error} onDismiss={() => setError('')} />

      <div className="sac-launch-grid">
        <section className="sac-panel sac-launch-panel">
          <div className="sac-panel-heading">
            <div><span className="sac-eyebrow">NEW EXECUTION</span><h3>Launch a controlled Run</h3></div>
            <span className="sac-default-mode">DEFAULT: SANDBOX</span>
          </div>
          <div className="sac-form-grid two">
            <label><span>Run name</span><input value={form.name} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Quarterly report assembly" /></label>
            <label><span>Explicit model</span>
              {availableModels.length > 0 ? (
                <select value={form.model} onChange={event => setForm(previous => ({ ...previous, model: event.target.value }))}>
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>{[model.name || model.id, model.provider, model.tier].filter(Boolean).join(' · ')}</option>
                  ))}
                  <option value="">Choose a model…</option>
                </select>
              ) : (
                <>
                  <input value={form.model} onChange={event => setForm(previous => ({ ...previous, model: event.target.value }))} placeholder={modelsLoaded ? 'claude-sonnet-4-5' : 'Loading models…'} />
                  {modelsLoaded && <small className="sac-footnote">Add an API key in Settings first</small>}
                </>
              )}
            </label>
          </div>
          <label className="sac-field"><span>Objective</span><textarea rows={6} value={form.prompt} onChange={event => setForm(previous => ({ ...previous, prompt: event.target.value }))} placeholder="Use the files in this Workspace, complete the task, and commit the final result as an Artifact…" /></label>
          <div className="sac-form-grid three">
            <label><span>Workspace</span><select value={form.workspaceId} onChange={event => setForm(previous => ({ ...previous, workspaceId: event.target.value }))}><option value="">Auto-create</option>{workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
            <label><span>Cost ceiling (USD)</span><input type="number" min="0.05" max="25" step="0.05" value={form.maxCostUsd} onChange={event => setForm(previous => ({ ...previous, maxCostUsd: event.target.value }))} /></label>
            <label><span>Tool-call ceiling</span><input type="number" min="1" max="60" value={form.maxToolCalls} onChange={event => setForm(previous => ({ ...previous, maxToolCalls: event.target.value }))} /></label>
          </div>
          <div className="sac-launch-footer">
            <div><b>Approval policy</b><span>Class A automatic · Class B asks · Class C blocked</span></div>
            <ActionButton tone="primary" onClick={startRun} disabled={busy === 'start' || !form.name.trim() || !form.prompt.trim() || !form.model.trim()}>{busy === 'start' ? 'Accepting…' : 'Start sandbox Run →'}</ActionButton>
          </div>
        </section>

        <section className="sac-panel sac-workspace-panel">
          <div className="sac-panel-heading"><div><span className="sac-eyebrow">PERSISTENT INPUT</span><h3>Workspace staging</h3></div><span>{workspaces.length} workspace{workspaces.length === 1 ? '' : 's'}</span></div>
          <div className="sac-workspace-create"><input value={newWorkspaceName} onChange={event => setNewWorkspaceName(event.target.value)} placeholder="New workspace name" /><ActionButton onClick={createWorkspace} disabled={!newWorkspaceName.trim() || Boolean(busy)}>{busy === 'create-workspace' ? 'Creating…' : 'Create'}</ActionButton></div>
          <div className="sac-rule" />
          <label className="sac-file-drop" htmlFor="sac-workspace-file">
            <input id="sac-workspace-file" type="file" onChange={event => { const file = event.target.files?.[0] || null; setUploadFile(file); setUploadPath(file ? `uploads/${sanitizeUploadName(file.name)}` : ''); }} />
            <span>{uploadFile ? uploadFile.name : 'Choose a local file'}</span><small>{uploadFile ? formatBytes(uploadFile.size) : 'Binary upload · verified SHA-256 · max 10 MiB'}</small>
          </label>
          <label className="sac-field"><span>Workspace-relative path</span><input value={uploadPath} onChange={event => setUploadPath(event.target.value)} placeholder="uploads/source.xlsx" /></label>
          <ActionButton tone="neutral" onClick={uploadWorkspaceFile} disabled={!uploadFile || !form.workspaceId || Boolean(busy)}>{busy === 'upload' ? 'Uploading + verifying…' : 'Upload to Workspace'}</ActionButton>
          <p className="sac-footnote">Files survive Run teardown. Shell and Browser containers do not.</p>
        </section>
      </div>

      <div className="sac-run-grid">
        <aside className="sac-panel sac-run-list">
          <div className="sac-panel-heading"><div><span className="sac-eyebrow">IMMUTABLE ATTEMPTS</span><h3>Recent Runs</h3></div><ActionButton onClick={() => void loadRuns()}>↻</ActionButton></div>
          {runs.length === 0 && <div className="sac-empty">No sandbox Runs yet.</div>}
          {runs.map(item => (
            <button type="button" className={`sac-run-row ${String(item.id) === selectedRunId ? 'selected' : ''}`} key={item.id} onClick={() => setSelectedRunId(String(item.id))}>
              <div className="sac-run-row-top"><strong>{item.name}</strong><span style={{ color: statusColor(item.status) }}>{item.status}</span></div>
              <p>{item.prompt}</p>
              <div><code>{item.run_key || `legacy-${item.id}`}</code><span>{formatDate(item.created_at)}</span></div>
            </button>
          ))}
        </aside>

        <main className="sac-panel sac-run-detail">
          {!run && <div className="sac-empty large">Select a Run or launch a new sandbox execution.</div>}
          {run && (
            <>
              <div className="sac-run-command">
                <div>
                  <span className="sac-eyebrow">RUN {run.run_key || run.id}</span>
                  <h2>{run.name}</h2>
                  <div className="sac-status-line"><i style={{ background: statusColor(run.status) }} /><b style={{ color: statusColor(run.status) }}>{run.status}</b><span>Sandbox: {run.sandbox_state || '—'}</span><span>Attempt: {run.attempt_id || '—'}</span></div>
                </div>
                <div className="sac-command-actions">
                  <ActionButton tone="danger" onClick={() => void runAction('stop', `/agent-runs/${selectedRunId}/cancel`, { method: 'PUT' })} disabled={!canStop || Boolean(busy)}>{busy === 'stop' ? 'Stopping…' : 'Stop'}</ActionButton>
                  <ActionButton onClick={() => void runAction('retry', `/agent-runs/${selectedRunId}/retry`)} disabled={!isTerminal || Boolean(busy)}>{busy === 'retry' ? 'Retrying…' : 'Retry as new Run'}</ActionButton>
                  <ActionButton onClick={() => void runAction('cleanup', `/agent-runs/${selectedRunId}/cleanup`)} disabled={!isTerminal || run.sandbox_state === 'destroyed' || Boolean(busy)}>{busy === 'cleanup' ? 'Cleaning…' : 'Retry cleanup'}</ActionButton>
                </div>
              </div>

              <div className="sac-metrics">
                <Metric label="Stream" value={streamState} accent={streamState === 'live' ? '#37d996' : undefined} />
                <Metric label="Cost" value={`$${Number(run.cost_usd || 0).toFixed(4)} / $${Number(run.max_cost_usd || 0).toFixed(2)}`} />
                <Metric label="Tokens" value={Number(run.total_tokens || 0).toLocaleString()} />
                <Metric label="Tools" value={`${run.tool_calls || 0} / ${run.max_tool_calls || 0}`} />
                <Metric label="Duration" value={`${Math.round(Number(run.duration_ms || 0) / 1000)}s`} />
                <Metric label="Artifacts" value={(details?.artifacts || []).length} accent={(details?.artifacts || []).length ? '#37d996' : '#ffba49'} />
              </div>

              {run.error && <ErrorNotice message={run.error} />}
              {isTerminal && run.sandbox_state !== 'destroyed' && <ErrorNotice message={`Cleanup incomplete — the sandbox is still "${run.sandbox_state || 'unknown'}". Use Retry cleanup.`} />}

              {details?.approval && (
                <div className="sac-approval-box">
                  <div className="sac-approval-title"><span>CLASS {details.approval.approval_class || 'B'} APPROVAL</span><b>External mutation paused</b></div>
                  <p>{details.approval.request_summary || details.approval.reason || 'Review the exact tool request before allowing it to run.'}</p>
                  <pre>{JSON.stringify({ tool_name: pendingApprovalToolName, input: pendingApprovalInput }, null, 2)}</pre>
                  <div className="sac-command-actions"><ActionButton tone="approval" onClick={() => decideApproval('approve')} disabled={Boolean(busy)}>{busy === 'approve' ? 'Approving…' : 'Approve exact action'}</ActionButton><ActionButton tone="danger" onClick={() => decideApproval('reject')} disabled={Boolean(busy)}>{busy === 'reject' ? 'Rejecting…' : 'Reject'}</ActionButton></div>
                </div>
              )}

              {canSteer && (
                <div className="sac-steer"><input value={steering} onChange={event => setSteering(event.target.value)} placeholder="Add a bounded steering instruction without mutating the original prompt" /><ActionButton onClick={() => void steerRun()} disabled={!steering.trim() || Boolean(busy)}>Send steering</ActionButton></div>
              )}

              <div className="sac-detail-grid">
                <section>
                  <div className="sac-subhead"><div><strong>Event timeline</strong><span>Authenticated SSE · resumes from event {latestEventId.current}</span></div></div>
                  <div className="sac-timeline">
                    {loadingDetails && !details && <div className="sac-empty compact">Loading audit trail…</div>}
                    {(details?.events || []).filter((event: any) => event?.type !== 'token').map((event: any) => (
                      <div className="sac-event" key={event.id || event.seq}>
                        <div><i style={{ background: statusColor(event.state) }} /><code>#{event.seq}</code><span>{event.type}</span><time>{formatDate(event.created_at)}</time></div>
                        <p>{event.message}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="sac-subhead"><div><strong>Tool ledger</strong><span>Inputs, approval class, terminal evidence</span></div></div>
                  <div className="sac-tool-list">
                    {(details?.tools || []).length === 0 && <div className="sac-empty compact">No tool calls recorded.</div>}
                    {(details?.tools || []).map((tool: any) => (
                      <details className="sac-tool" key={tool.id}>
                        <summary><span className={`sac-class sac-class-${String(tool.approval_class || 'A').toLowerCase()}`}>{tool.approval_class || 'A'}</span><strong>{tool.tool_name}</strong><b style={{ color: statusColor(tool.status) }}>{tool.status}</b></summary>
                        <pre>{JSON.stringify(parseJson(tool.input, tool.input), null, 2)}</pre>
                        {tool.error && <p>{tool.error}</p>}
                      </details>
                    ))}
                  </div>
                </section>
              </div>

              <section className="sac-artifacts">
                <div className="sac-subhead"><div><strong>Committed Artifacts</strong><span>Immutable result evidence verified before download</span></div></div>
                {(details?.artifacts || []).length === 0 && <div className="sac-empty compact">Completion is gated until at least one Artifact is committed.</div>}
                {(details?.artifacts || []).map((artifact: any) => (
                  <div className="sac-artifact-row" key={artifact.id}>
                    <span>◆</span><div><strong>{artifact.title || artifact.path}</strong><code>{artifact.mime_type} · {formatBytes(artifact.bytes)} · SHA-256 {shortHash(artifact.sha256)}</code></div><ActionButton onClick={() => void downloadArtifact(artifact)} disabled={Boolean(busy)}>{busy === `download:${artifact.id}` ? 'Verifying…' : 'Download'}</ActionButton>
                  </div>
                ))}
              </section>
            </>
          )}
        </main>
      </div>

      <GoogleDriveRunPanel apiBase={apiBase} tokenRef={tokenRef} workspaceId={form.workspaceId} selectedRun={run} details={details} onToast={onToast} />
    </div>
  );
}

export { GoogleDriveConnectionCard };

const DRIVE_CARD_STYLES = `
.gdc-card{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:14px;align-items:start;background:linear-gradient(135deg,rgba(66,133,244,.09),rgba(52,168,83,.035));border:1px solid rgba(66,133,244,.28);border-radius:14px;padding:18px;margin-bottom:14px}.gdc-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:10px;background:conic-gradient(from 210deg,#4285f4,#34a853,#fbbc04,#ea4335,#4285f4);color:white;font:800 20px var(--fg-font-display);box-shadow:inset 0 0 0 5px #111}.gdc-copy{min-width:0}.gdc-title-row{display:flex;align-items:center;gap:10px}.gdc-title-row strong{color:var(--fg-text);font-size:15px}.gdc-badge{font:700 9px var(--fg-font-mono);letter-spacing:.12em}.gdc-copy p{margin:6px 0 10px;color:var(--fg-text3);font-size:12px;line-height:1.55}.gdc-account{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gdc-account span{color:var(--fg-text2);font-size:12px;font-weight:700}.gdc-account code{color:#7aa7ff;font-size:11px}.gdc-warning{margin-top:8px;color:#ffba49;font-size:11px}.gdc-actions{align-self:center}@media(max-width:720px){.gdc-card{grid-template-columns:42px minmax(0,1fr)}.gdc-actions{grid-column:1/-1}}
.gdc-actions .sac-action{border:1px solid var(--fg-border2);border-radius:7px;background:#1a1a1f;color:var(--fg-text2);padding:7px 10px;font:700 10px var(--fg-font-ui);cursor:pointer}.gdc-actions .sac-action-primary{background:linear-gradient(135deg,#ff1f35,#be1022);border-color:#ff5364;color:#fff}.gdc-actions .sac-action-danger{color:#ff7a87;border-color:rgba(255,83,100,.3);background:rgba(255,31,53,.06)}.gdc-actions .sac-action:disabled{opacity:.38;cursor:not-allowed}.gdc-copy .sac-error{display:flex;gap:8px;margin-top:9px;padding:9px;border:1px solid rgba(255,83,100,.25);border-radius:7px;color:#ff8792;font-size:11px}.gdc-copy .sac-error>span{font-weight:900}.gdc-copy .sac-error>div{flex:1}.gdc-copy .sac-error button{border:0;background:transparent;color:#ff8792;cursor:pointer}
`;

const CONSOLE_STYLES = `
.sac-shell{padding:26px;min-height:100%;color:var(--fg-text);background:radial-gradient(1000px 520px at 78% -8%,rgba(255,31,53,.10),transparent 58%),linear-gradient(180deg,#09090b,#0b0b0d);font-family:var(--fg-font-ui)}
.sac-shell *{box-sizing:border-box}.sac-hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;padding:10px 2px 24px;border-bottom:1px solid var(--fg-border2);margin-bottom:18px}.sac-kicker{display:flex;gap:10px;align-items:center;color:var(--fg-text3);font:700 10px var(--fg-font-mono);letter-spacing:.13em}.sac-kicker span{color:#ff5364}.sac-kicker i{width:18px;height:1px;background:var(--fg-border2)}.sac-hero h1{font-size:32px;margin:8px 0 4px;letter-spacing:-.045em}.sac-hero p{margin:0;color:var(--fg-text2);font-size:13px}.sac-hero-architecture{display:grid;grid-template-columns:auto auto auto;gap:5px 10px;align-items:center;padding:12px 14px;border:1px solid var(--fg-border);border-radius:10px;background:rgba(255,255,255,.018);font:10px var(--fg-font-mono)}.sac-hero-architecture span{color:var(--fg-text3)}.sac-hero-architecture b{color:var(--fg-text2);font-weight:600}.sac-hero-architecture em{grid-column:3;color:#ff5364;font-style:normal}.sac-panel{background:linear-gradient(180deg,rgba(24,24,28,.93),rgba(15,15,18,.96));border:1px solid var(--fg-border2);border-radius:14px;box-shadow:0 18px 45px rgba(0,0,0,.22)}.sac-panel-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:15px}.sac-panel-heading h3{font-size:16px;margin:3px 0 0}.sac-panel-heading>span{color:var(--fg-text3);font:10px var(--fg-font-mono)}.sac-eyebrow{color:#ff5364;font:700 9px var(--fg-font-mono);letter-spacing:.15em}.sac-launch-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(300px,.8fr);gap:14px;margin-bottom:14px}.sac-launch-panel,.sac-workspace-panel{padding:20px}.sac-class-a{padding:4px 8px;background:rgba(55,217,150,.08);border:1px solid rgba(55,217,150,.2);border-radius:5px;color:#37d996!important}.sac-form-grid{display:grid;gap:10px;margin-bottom:10px}.sac-form-grid.two{grid-template-columns:1fr 1fr}.sac-form-grid.three{grid-template-columns:1.4fr .8fr .8fr}.sac-field,.sac-form-grid label{display:flex;flex-direction:column;gap:5px}.sac-field>span,.sac-form-grid label>span{color:var(--fg-text3);font:700 9px var(--fg-font-mono);letter-spacing:.08em;text-transform:uppercase}.sac-shell input,.sac-shell textarea,.sac-shell select{width:100%;background:#0c0c0f;border:1px solid var(--fg-border2);border-radius:8px;color:var(--fg-text);padding:9px 11px;font:12px var(--fg-font-ui);outline:none;transition:border-color .16s,box-shadow .16s}.sac-shell textarea{resize:vertical;line-height:1.5;margin-bottom:10px}.sac-shell input:focus,.sac-shell textarea:focus,.sac-shell select:focus{border-color:rgba(255,83,100,.6);box-shadow:0 0 0 3px rgba(255,31,53,.08)}.sac-launch-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid var(--fg-border)}.sac-launch-footer div{display:flex;flex-direction:column;gap:2px}.sac-launch-footer b{font-size:11px}.sac-launch-footer span{font-size:10px;color:var(--fg-text3)}.sac-action{border:1px solid var(--fg-border2);border-radius:7px;background:#1a1a1f;color:var(--fg-text2);padding:7px 10px;font:700 10px var(--fg-font-ui);cursor:pointer;white-space:nowrap;transition:all .16s}.sac-action:hover:not(:disabled){border-color:rgba(255,83,100,.45);color:var(--fg-text);transform:translateY(-1px)}.sac-action:disabled{opacity:.38;cursor:not-allowed}.sac-action-primary{background:linear-gradient(135deg,#ff1f35,#be1022);border-color:#ff5364;color:#fff;box-shadow:0 8px 20px rgba(255,31,53,.14)}.sac-action-danger{color:#ff7a87;border-color:rgba(255,83,100,.3);background:rgba(255,31,53,.06)}.sac-action-approval{color:#19120a;background:#ffba49;border-color:#ffd07b}.sac-workspace-create,.sac-steer{display:flex;gap:7px}.sac-rule{height:1px;background:var(--fg-border);margin:14px 0}.sac-file-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:86px;margin-bottom:10px;border:1px dashed rgba(122,167,255,.32);border-radius:10px;background:rgba(122,167,255,.025);cursor:pointer}.sac-file-drop input{display:none}.sac-file-drop span{font-size:12px;font-weight:700}.sac-file-drop small{font-size:10px;color:var(--fg-text3);margin-top:4px}.sac-footnote{font-size:10px;color:var(--fg-text3);margin:12px 0 0}.sac-run-grid{display:grid;grid-template-columns:310px minmax(0,1fr);gap:14px;margin-bottom:14px}.sac-run-list{padding:14px;max-height:900px;overflow:auto}.sac-run-list .sac-panel-heading{padding:4px 4px 9px}.sac-run-row{width:100%;display:block;text-align:left;padding:12px;margin:0 0 7px;border:1px solid transparent;border-radius:9px;background:#101014;color:inherit;cursor:pointer}.sac-run-row:hover{border-color:var(--fg-border2)}.sac-run-row.selected{background:linear-gradient(90deg,rgba(255,31,53,.11),rgba(255,31,53,.025));border-color:rgba(255,83,100,.35);box-shadow:inset 3px 0 #ff3549}.sac-run-row-top{display:flex;justify-content:space-between;gap:8px}.sac-run-row-top strong{font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sac-run-row-top span{font:700 9px var(--fg-font-mono);text-transform:uppercase}.sac-run-row p{font-size:10px;line-height:1.45;color:var(--fg-text3);height:29px;overflow:hidden;margin:6px 0}.sac-run-row>div:last-child{display:flex;justify-content:space-between;gap:8px;color:var(--fg-text3);font-size:8px}.sac-run-row code{font-size:8px;color:#7aa7ff;overflow:hidden;text-overflow:ellipsis}.sac-run-detail{padding:20px;min-width:0}.sac-run-command{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.sac-run-command h2{margin:4px 0 6px;font-size:22px}.sac-status-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font:10px var(--fg-font-mono);color:var(--fg-text3)}.sac-status-line i,.sac-inline-status i{width:7px;height:7px;border-radius:50%;box-shadow:0 0 10px currentColor}.sac-status-line b{text-transform:uppercase}.sac-command-actions,.sac-heading-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}.sac-metrics{display:grid;grid-template-columns:repeat(6,minmax(90px,1fr));gap:7px;margin:17px 0}.sac-metric{padding:10px;background:#0c0c0f;border:1px solid var(--fg-border);border-radius:8px;min-width:0}.sac-metric span{display:block;color:var(--fg-text3);font:700 8px var(--fg-font-mono);text-transform:uppercase;letter-spacing:.08em}.sac-metric strong{display:block;margin-top:5px;font:700 12px var(--fg-font-mono);overflow:hidden;text-overflow:ellipsis}.sac-error{display:flex;align-items:flex-start;gap:8px;margin:10px 0;padding:10px 12px;border:1px solid rgba(255,83,100,.25);border-radius:8px;background:rgba(255,31,53,.06);color:#ff8792;font-size:11px;line-height:1.45}.sac-error>span{display:grid;place-items:center;flex:0 0 18px;height:18px;border-radius:50%;background:#ff3549;color:#fff;font-weight:900}.sac-error>div{flex:1;word-break:break-word}.sac-error button{border:0;background:transparent;color:#ff8792;cursor:pointer}.sac-approval-box{margin:12px 0;padding:14px;border:1px solid rgba(255,186,73,.32);border-radius:10px;background:linear-gradient(135deg,rgba(255,186,73,.09),rgba(255,186,73,.025))}.sac-approval-title{display:flex;justify-content:space-between;gap:10px;color:#ffba49;font:700 10px var(--fg-font-mono)}.sac-approval-box p{margin:8px 0;color:var(--fg-text2);font-size:11px}.sac-approval-box pre,.sac-tool pre{max-height:180px;overflow:auto;padding:9px;background:#08080a;border:1px solid var(--fg-border);border-radius:6px;color:#aeb2c3;font:9px/1.45 var(--fg-font-mono);white-space:pre-wrap;word-break:break-word}.sac-steer{margin:12px 0}.sac-detail-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;margin-top:16px}.sac-subhead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.sac-subhead>div{display:flex;flex-direction:column;gap:2px}.sac-subhead strong{font-size:11px}.sac-subhead span{color:var(--fg-text3);font-size:9px}.sac-timeline,.sac-tool-list{max-height:350px;overflow:auto;border:1px solid var(--fg-border);border-radius:9px;background:#0b0b0e}.sac-event{padding:10px 11px;border-bottom:1px solid var(--fg-border)}.sac-event:last-child{border:0}.sac-event>div{display:flex;align-items:center;gap:7px}.sac-event i{width:6px;height:6px;border-radius:50%}.sac-event code{color:#7aa7ff;font-size:8px}.sac-event span{font:700 9px var(--fg-font-mono);text-transform:uppercase}.sac-event time{margin-left:auto;color:var(--fg-text3);font-size:8px}.sac-event p{margin:5px 0 0 13px;color:var(--fg-text2);font-size:10px;line-height:1.4}.sac-tool{border-bottom:1px solid var(--fg-border)}.sac-tool summary{display:grid;grid-template-columns:24px minmax(0,1fr) auto;align-items:center;gap:8px;padding:10px;cursor:pointer;list-style:none}.sac-tool summary::-webkit-details-marker{display:none}.sac-tool summary strong{font:600 10px var(--fg-font-mono);overflow:hidden;text-overflow:ellipsis}.sac-tool summary b{font:700 8px var(--fg-font-mono);text-transform:uppercase}.sac-tool pre{margin:0 10px 10px}.sac-tool>p{margin:0 10px 10px;color:#ff7a87;font-size:10px}.sac-class{display:grid;place-items:center;width:22px;height:22px;border-radius:5px;font:900 9px var(--fg-font-mono)}.sac-class-a{color:#37d996;background:rgba(55,217,150,.09)}.sac-class-b{color:#ffba49;background:rgba(255,186,73,.09)}.sac-class-c{color:#ff5364;background:rgba(255,83,100,.09)}.sac-artifacts{margin-top:16px}.sac-artifact-row,.sac-file-row,.sac-artifact-drive{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--fg-border);border-radius:8px;background:#0c0c0f;margin-bottom:6px}.sac-artifact-row>span{color:#ff5364}.sac-artifact-row>div,.sac-file-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}.sac-artifact-row strong,.sac-file-copy strong{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sac-artifact-row code,.sac-file-copy span,.sac-file-copy code{font:9px var(--fg-font-mono);color:var(--fg-text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sac-empty{padding:22px;border:1px dashed var(--fg-border2);border-radius:9px;color:var(--fg-text3);font-size:11px;text-align:center}.sac-empty.compact{padding:13px}.sac-empty.large{min-height:260px;display:grid;place-items:center}.sac-drive-panel{padding:20px}.sac-inline-status{display:inline-flex;align-items:center;gap:6px;color:var(--fg-text2);font:700 9px var(--fg-font-mono);max-width:240px;overflow:hidden;text-overflow:ellipsis}.sac-security-rail{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:14px;padding:9px 11px;background:#0a0a0d;border:1px solid var(--fg-border);border-radius:8px;font:9px var(--fg-font-mono);color:var(--fg-text3)}.sac-security-rail span{color:#ff5364;font-weight:800}.sac-security-rail b{color:var(--fg-text2);font-weight:600}.sac-security-rail em{color:#7aa7ff;font-style:normal}.sac-drive-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.sac-drive-column{min-width:0;padding:12px;border:1px solid var(--fg-border);border-radius:10px;background:#0b0b0e}.sac-file-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:7px;background:linear-gradient(135deg,#4285f4,#34a853);color:#fff;font-weight:900}.sac-folder-row{display:flex;align-items:center;gap:9px;padding:9px;border:1px solid rgba(66,133,244,.18);border-radius:8px;background:rgba(66,133,244,.035);margin-bottom:7px}.sac-folder-row>span{color:#7aa7ff}.sac-folder-row div{min-width:0;display:flex;flex-direction:column;gap:3px}.sac-folder-row strong{font-size:11px}.sac-folder-row code{font-size:8px;color:var(--fg-text3);overflow:hidden;text-overflow:ellipsis}.sac-writeback{margin-top:12px;padding:14px;border:1px solid rgba(255,186,73,.24);border-left:3px solid #ffba49;border-radius:9px;background:rgba(255,186,73,.035)}.sac-writeback-head{display:flex;justify-content:space-between;gap:10px;font:800 9px var(--fg-font-mono);letter-spacing:.08em}.sac-writeback p{margin:8px 0;color:var(--fg-text2);font-size:11px;line-height:1.5}.sac-writeback-evidence,.sac-created-evidence{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.sac-writeback-evidence code{padding:3px 6px;border-radius:4px;background:#0a0a0c;color:var(--fg-text3);font-size:8px}.sac-created-evidence{padding:8px;border-radius:6px;background:rgba(55,217,150,.06);color:#37d996;font-size:9px}.sac-created-evidence code{color:var(--fg-text2)}.sac-created-evidence a{color:#7aa7ff;text-decoration:none;margin-left:auto}
.sac-default-mode{padding:4px 8px;background:rgba(55,217,150,.08);border:1px solid rgba(55,217,150,.2);border-radius:5px;color:#37d996!important;font:700 10px var(--fg-font-mono)}
@media(max-width:1180px){.sac-launch-grid,.sac-drive-grid{grid-template-columns:1fr}.sac-metrics{grid-template-columns:repeat(3,1fr)}}@media(max-width:900px){.sac-shell{padding:16px}.sac-hero{align-items:flex-start;flex-direction:column}.sac-hero-architecture{width:100%}.sac-run-grid{grid-template-columns:1fr}.sac-run-list{max-height:300px}.sac-detail-grid{grid-template-columns:1fr}.sac-run-command{flex-direction:column}.sac-command-actions{justify-content:flex-start}}@media(max-width:620px){.sac-form-grid.two,.sac-form-grid.three{grid-template-columns:1fr}.sac-metrics{grid-template-columns:repeat(2,1fr)}.sac-launch-footer,.sac-panel-heading{align-items:flex-start;flex-direction:column}.sac-shell{padding:10px}.sac-hero h1{font-size:26px}}
`;
