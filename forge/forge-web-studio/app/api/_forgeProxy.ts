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
  headers.delete('accept-encoding');
  headers.delete('x-forge-gateway-secret');
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
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
    init.duplex = 'half';
  }

  try {
    const upstream = await fetch(targetUrl, init);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: forwardedResponseHeaders(upstream, targetUrl, request.nextUrl.origin),
    });
  } catch {
    return unavailable('The Forge control plane could not be reached from Vercel.');
  }
}
