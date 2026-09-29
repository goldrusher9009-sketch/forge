/** SSE subscription that keeps the access token in a header. */
export class AuthenticatedEventSource extends EventTarget {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private controller: AbortController | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private lastEventId = '';
  private retryMs = 3000;

  constructor(private readonly url: string, private readonly token: string) {
    super();
    void this.connect();
  }

  close() {
    this.closed = true;
    this.controller?.abort();
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private emit(type: string, data: string) {
    const event = new MessageEvent(type, { data, lastEventId: this.lastEventId });
    this.dispatchEvent(event);
    if (type === 'message') this.onmessage?.(event);
    if (type === 'error') this.onerror?.(event);
  }

  private async connect() {
    const controller = new AbortController();
    this.controller = controller;
    let retry = true;
    try {
      const headers: Record<string, string> = { Accept: 'text/event-stream', Authorization: `Bearer ${this.token}` };
      if (this.lastEventId) headers['Last-Event-ID'] = this.lastEventId;
      const response = await fetch(this.url, { headers, credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (response.status === 401 || response.status === 403) retry = false;
      if (!response.ok || !response.body) throw new Error(`SSE_HTTP_${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let data: string[] = [];
      let type = 'message';
      const processLine = (line: string) => {
        if (!line) {
          if (data.length) this.emit(type, data.join('\n'));
          data = [];
          type = 'message';
          return;
        }
        if (line.startsWith(':')) return;
        const colon = line.indexOf(':');
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
        if (field === 'data') data.push(value);
        else if (field === 'event') type = value || 'message';
        else if (field === 'id' && !value.includes('\0')) this.lastEventId = value;
        else if (field === 'retry' && /^\d+$/.test(value)) this.retryMs = Math.min(Number(value), 30000);
      };
      while (!this.closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newline: number;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          processLine(buffer.slice(0, newline).replace(/\r$/, ''));
          buffer = buffer.slice(newline + 1);
        }
      }
    } catch {
      if (this.closed || controller.signal.aborted) return;
    }
    if (this.closed) return;
    const error = new Event('error');
    this.dispatchEvent(error);
    this.onerror?.(error);
    if (retry) this.retryTimer = setTimeout(() => void this.connect(), this.retryMs);
  }
}
