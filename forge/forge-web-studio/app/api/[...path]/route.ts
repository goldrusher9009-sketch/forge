import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../_forgeProxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

type RouteContext = {
  params: {
    path: string[];
  };
};

const handler = (request: NextRequest, context: RouteContext) =>
  proxyForgeApi(request, context.params.path);

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
