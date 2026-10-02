import { FORGE_API, normalizeForgeApiUrl } from './config';

export type ForgeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
};
export type ForgePassport = {
  id: string;
  user_id: string;
  twin_name?: string;
  public_slug?: string;
};
export type ForgeIdentity = { user: ForgeUser; passport: ForgePassport };
export type ForgeRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
export type SignOutResult = { serverRevoked: boolean; error?: string };

export class ForgeSessionError extends Error {
  constructor(public readonly code: string, public readonly status?: number) {
    super(code);
    this.name = 'ForgeSessionError';
  }
}

type Reply = { response: Response; payload: Record<string, any>; text: string; contentType: string };
type Tokens = { accessToken: string; refreshToken: string };

function tokens(payload: Reply['payload']): Tokens {
  const accessToken = payload.data?.accessToken || payload.accessToken;
  const refreshToken = payload.data?.refreshToken || payload.refreshToken;
  if (typeof accessToken !== 'string' || !accessToken || typeof refreshToken !== 'string' || !refreshToken) {
    throw new ForgeSessionError('AUTH_RESPONSE_INVALID');
  }
  return { accessToken, refreshToken };
}

function responseError(reply: Reply): ForgeSessionError {
  const code = reply.payload?.error;
  return new ForgeSessionError(typeof code === 'string' && /^[A-Z][A-Z0-9_]{0,99}$/.test(code)
    ? code : `HTTP_${reply.response.status}`, reply.response.status);
}

function waitForRequest<T>(job: Promise<T>, signal?: AbortSignal | null, errorCode = () => 'REQUEST_CANCELLED'): Promise<T> {
  if (!signal) return job;
  if (signal.aborted) { void job.catch(() => {}); return Promise.reject(new ForgeSessionError(errorCode())); }
  return new Promise((resolve, reject) => {
    const abort = () => reject(new ForgeSessionError(errorCode()));
    signal.addEventListener('abort', abort, { once: true });
    job.then(value => { signal.removeEventListener('abort', abort); resolve(value); }, error => {
      signal.removeEventListener('abort', abort); reject(error);
    });
  });
}

/** Access and rotating refresh credentials live only in this instance. */
export class ForgeSessionClient {
  private accessToken = '';
  private refreshToken = '';
  private generation = 0;
  private refreshJob: Promise<void> | null = null;
  private pendingSignIns = 0;

  constructor(private readonly apiUrl = FORGE_API) {}

  private clear(): void {
    this.generation += 1;
    this.accessToken = '';
    this.refreshToken = '';
    this.refreshJob = null;
  }

  private current(generation: number): void {
    if (generation !== this.generation) throw new ForgeSessionError('SESSION_CHANGED');
  }

  private async send(path: string, init: RequestInit = {}, accessToken?: string, mode: 'json' | 'text' = 'json'): Promise<Reply> {
    const apiUrl = normalizeForgeApiUrl(this.apiUrl);
    if (!path.startsWith('/api/') || path.includes('\\')) throw new ForgeSessionError('INVALID_API_PATH');
    if (init.signal?.aborted) throw new ForgeSessionError('REQUEST_CANCELLED');
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    headers.set('X-Forge-Client', 'phone');
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    else headers.delete('Authorization');
    const read = ['GET', 'HEAD'].includes((init.method || 'GET').toUpperCase());
    const controller = read ? new AbortController() : null;
    let timedOut = false;
    const cancel = () => controller?.abort();
    if (controller) init.signal?.addEventListener('abort', cancel, { once: true });
    const timeout = controller ? setTimeout(() => {
      if (!controller.signal.aborted) { timedOut = true; controller.abort(); }
    }, 20000) : undefined;
    const signal = controller?.signal || init.signal;
    const abortCode = () => timedOut ? 'REQUEST_READ_TIMEOUT' : 'REQUEST_CANCELLED';
    try {
      let response: Response;
      try {
        response = await waitForRequest(fetch(`${apiUrl}${path}`, { ...init, signal, credentials: 'omit', headers }), signal, abortCode);
      } catch {
        throw new ForgeSessionError(signal?.aborted ? abortCode() : 'NETWORK_UNAVAILABLE');
      }
      if (signal?.aborted) throw new ForgeSessionError(abortCode());
      const contentType = response.headers.get('Content-Type') || '';
      if (mode === 'json' && contentType.toLowerCase().includes('text/event-stream')) {
        await waitForRequest(response.body?.cancel().catch(() => {}) || Promise.resolve(), signal, abortCode);
        throw new ForgeSessionError('RESPONSE_FORMAT_UNSUPPORTED');
      }
      let text = '', payload: Record<string, any> = {};
      try {
        if (mode === 'text') {
          text = await waitForRequest(response.text(), signal, abortCode);
          if (!response.ok) { try { payload = JSON.parse(text); } catch {} }
        } else { payload = await waitForRequest(response.json().catch(() => ({})), signal, abortCode); }
      } catch {
        throw new ForgeSessionError(signal?.aborted ? abortCode() : 'NETWORK_UNAVAILABLE');
      }
      if (signal?.aborted) throw new ForgeSessionError(abortCode());
      return { response, payload: payload && typeof payload === 'object' ? payload : {}, text, contentType };
    } finally {
      clearTimeout(timeout);
      if (controller) init.signal?.removeEventListener('abort', cancel);
    }
  }

  private async auth(path: string, body: Record<string, string>, accessToken?: string): Promise<Reply> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      return await this.send(path, { method: 'POST', body: JSON.stringify(body), signal: controller.signal }, accessToken);
    } finally { clearTimeout(timeout); }
  }

  private async revoke(accessToken: string, refreshToken: string): Promise<SignOutResult> {
    try {
      let reply = await this.auth('/api/auth/logout', {}, accessToken);
      if (reply.response.status === 401 && refreshToken) {
        const renewed = await this.auth('/api/auth/refresh', { refreshToken });
        if (!renewed.response.ok) throw responseError(renewed);
        reply = await this.auth('/api/auth/logout', {}, tokens(renewed.payload).accessToken);
      }
      if (!reply.response.ok) throw responseError(reply);
      return { serverRevoked: true };
    } catch (error) {
      return { serverRevoked: false, error: error instanceof ForgeSessionError ? error.code : 'SIGN_OUT_UNCONFIRMED' };
    }
  }

  async signIn(email: string, password: string): Promise<ForgeIdentity> {
    this.clear();
    const generation = this.generation;
    this.pendingSignIns += 1;
    try {
      const login = this.auth('/api/auth/login', { email: email.trim(), password });
      password = '';
      const reply = await login;
      if (!reply.response.ok) throw responseError(reply);
      const issued = tokens(reply.payload);
      if (generation !== this.generation) {
        await this.revoke(issued.accessToken, issued.refreshToken);
        throw new ForgeSessionError('SESSION_CHANGED');
      }
      this.accessToken = issued.accessToken;
      this.refreshToken = issued.refreshToken;
      const [profile, passport] = await Promise.all([
        this.request<{ data: ForgeUser }>('/api/profile'),
        this.request<{ data: ForgePassport }>('/api/passport'),
      ]);
      this.current(generation);
      if (!profile.data?.id || !profile.data.email || !passport.data?.id || passport.data.user_id !== profile.data.id) {
        throw new ForgeSessionError('AUTH_IDENTITY_INVALID');
      }
      return { user: profile.data, passport: passport.data };
    } catch (error) {
      if (generation === this.generation) {
        const accessToken = this.accessToken, refreshToken = this.refreshToken;
        this.clear();
        if (accessToken) await this.revoke(accessToken, refreshToken);
      }
      throw error;
    } finally { password = ''; this.pendingSignIns -= 1; }
  }

  private refresh(generation: number): Promise<void> {
    if (this.refreshJob) return this.refreshJob;
    const job = (async () => {
      const reply = await this.auth('/api/auth/refresh', { refreshToken: this.refreshToken });
      if (!reply.response.ok) {
        this.current(generation);
        if (reply.response.status === 401) { this.clear(); throw new ForgeSessionError('SESSION_EXPIRED', 401); }
        throw responseError(reply);
      }
      const issued = tokens(reply.payload);
      if (generation !== this.generation) {
        await this.revoke(issued.accessToken, issued.refreshToken);
        throw new ForgeSessionError('SESSION_CHANGED');
      }
      this.accessToken = issued.accessToken;
      this.refreshToken = issued.refreshToken;
    })().finally(() => { if (this.refreshJob === job) this.refreshJob = null; });
    this.refreshJob = job;
    return job;
  }

  private async authenticated(path: string, init: RequestInit, mode: 'json' | 'text'): Promise<Reply> {
    const generation = this.generation, accessToken = this.accessToken;
    if (!accessToken) throw new ForgeSessionError('AUTH_REQUIRED', 401);
    let reply = await this.send(path, init, accessToken, mode);
    this.current(generation);
    if (reply.response.status === 401) {
      if (init.signal?.aborted) throw new ForgeSessionError('REQUEST_CANCELLED');
      if (this.accessToken === accessToken) await waitForRequest(this.refresh(generation), init.signal);
      this.current(generation);
      if (init.signal?.aborted) throw new ForgeSessionError('REQUEST_CANCELLED');
      reply = await this.send(path, init, this.accessToken, mode);
      this.current(generation);
      if (reply.response.status === 401) { this.clear(); throw new ForgeSessionError('SESSION_EXPIRED', 401); }
    }
    if (!reply.response.ok) throw responseError(reply);
    return reply;
  }

  request: ForgeRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    return (await this.authenticated(path, init, 'json')).payload as T;
  };

  requestText = async (path: string, init: RequestInit = {}): Promise<{ text: string; contentType: string }> => {
    const reply = await this.authenticated(path, init, 'text');
    return { text: reply.text, contentType: reply.contentType };
  };

  async signOut(): Promise<SignOutResult> {
    const accessToken = this.accessToken, refreshToken = this.refreshToken, pendingSignIn = this.pendingSignIns > 0;
    this.clear();
    if (!accessToken) return pendingSignIn ? { serverRevoked: false, error: 'SIGN_OUT_UNCONFIRMED' } : { serverRevoked: true };
    return this.revoke(accessToken, refreshToken);
  }
}
