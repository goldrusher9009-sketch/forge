import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../_forgeProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const handler = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params;
  return proxyForgeApi(request, path);
};

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
