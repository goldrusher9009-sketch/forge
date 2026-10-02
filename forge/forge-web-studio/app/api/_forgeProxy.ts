import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

type ProxyContext = {
  params?: {
    path?: string[];
  };
};

type ControlPlaneConfig = {
  apiUrl: URL;
  gatewaySecret: string;
};

function unavailable(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: 'FORGE_CONTROL_PLANE_UNAVAILABLE',
      message,
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': '30',
      },
    },
  );
}

function controlPlaneConfig(request: NextRequest): ControlPlaneConfig | null {
  const configured = process.env.FORGE_CONTROL_PLANE_API_URL?.trim();
  const gatewaySecret = process.env.FORGE_CONTROL_PLANE_GATEWAY_SECRET?.trim();
  if (!configured || !gatewaySecret) return null;

  let apiUrl: URL;
  try {
    apiUrl = new URL(configured.endsWith('/') ? configured : `${configured}/`);
  } catch {
    return null;
  }

  if (!['https:', 'http:'].includes(apiUrl.protocol)) return null;
  if (process.env.NODE_ENV === 'production' && apiUrl.protocol !== 'https:') return null;
  if (apiUrl.origin === request.nextUrl.origin) return null;
  return { apiUrl, gatewaySecret };
}

function forwardedRequestHeaders(request: NextRequest, gatewaySecret: string): Headers {
  const headers = new Headers(request.headers);
  for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
  headers.delete('host');
  headers.delete('content-length');
  // Ask the gateway for identity encoding so bodies pass through byte-for-byte.
  headers.set('accept-encoding', 'identity');
  headers.delete('x-forge-gateway-secret');
  // Vercel resolves the real client address; forward only that so auth throttling keys on the visitor.
  const clientIp = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-real-ip') || '';
  headers.delete('x-forwarded-for');
  if (clientIp) headers.set('x-forwarded-for', clientIp.split(',')[0].trim());
  headers.set('x-forwarded-host', request.nextUrl.host);
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));
  headers.set('x-forge-proxy', 'vercel');
  headers.set('x-forge-gateway-secret', gatewaySecret);
  return headers;
}

function forwardedResponseHeaders(
  upstream: Response,
  targetUrl: URL,
  publicOrigin: string,
): Headers {
  const headers = new Headers(upstream.headers);
  for (const name of HOP_BY_HOP_HEADERS) headers.delete(name);
  headers.delete('content-length');
  // fetch() has already decoded any upstream Content-Encoding; forwarding the
  // original header would make the browser try to decompress plain bytes.
  headers.delete('content-encoding');
  headers.set('Cache-Control', 'no-store');

  const location = headers.get('location');
  if (location) {
    try {
      const redirectUrl = new URL(location, targetUrl);
      if (redirectUrl.origin === targetUrl.origin) {
        const publicUrl = new URL(publicOrigin);
        redirectUrl.protocol = publicUrl.protocol;
        redirectUrl.host = publicUrl.host;
        headers.set('location', redirectUrl.toString());
      }
    } catch {
      // Preserve an upstream relative redirect when URL parsing is not possible.
    }
  }

  return headers;
}

export async function proxyForgeApi(
  request: NextRequest,
  path: string | string[] | ProxyContext = [],
): Promise<Response> {
  const config = controlPlaneConfig(request);
  if (!config) {
    return unavailable(
      'The Vercel web gateway is ready, but its external HTTPS control-plane URL and gateway secret have not both been configured.',
    );
  }
  const { apiUrl, gatewaySecret } = config;

  const pathParts = Array.isArray(path)
    ? path
    : typeof path === 'string'
      ? path.split('/').filter(Boolean)
      : path.params?.path || [];
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  const targetUrl = new URL(encodedPath, apiUrl);
  targetUrl.search = request.nextUrl.search;

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers: forwardedRequestHeaders(request, gatewaySecret),
    redirect: 'manual',
    cache: 'no-store',
  };
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      if (request.body && /^(?:application\/json|application\/x-www-form-urlencoded)(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
        // A streaming upload has no replayable source. Node fetch can turn an
        // upstream 401 into a network error for such bodies. Buffer bounded JSON
        // and forms so invalid credentials/signatures keep their real status.
        const limit = pathParts[0] === 'pi-events' ? 8192
          : pathParts[0] === 'incoming-call' && pathParts[1] === 'webhooks' ? 32 * 1024
          : 16 * 1024 * 1024;
        const reader = request.body.getReader(), chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > limit) {
            await reader.cancel();
            return NextResponse.json({ success: false, error: pathParts[0] === 'pi-events' ? 'EVENT_DATA_TOO_LARGE' : 'REQUEST_BODY_TOO_LARGE' }, { status: 413, headers: { 'Cache-Control': 'no-store' } });
          }
          chunks.push(value);
        }
        init.body = new Uint8Array(Buffer.concat(chunks)).buffer;
      } else {
        init.body = request.body;
        init.duplex = 'half';
      }
    }
    const upstream = await fetch(targetUrl, init);
    const headers = forwardedResponseHeaders(upstream, targetUrl, request.nextUrl.origin);
    const contentType = upstream.headers.get('content-type') || '';
    // Only SSE is passed through as a live stream. Ordinary JSON/text responses are
    // buffered: re-emitting the upstream ReadableStream with a stripped Content-Length
    // intermittently produced empty bodies for chunked responses on the Vercel runtime.
    if (/^text\/event-stream/i.test(contentType) || upstream.status === 204 || upstream.status === 304) {
      return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
    }
    const buffered = Buffer.from(await upstream.arrayBuffer());
    headers.set('content-length', String(buffered.byteLength));
    return new Response(buffered, { status: upstream.status, statusText: upstream.statusText, headers });
  } catch {
    return unavailable('The Forge control plane could not be reached from Vercel.');
  }
}
