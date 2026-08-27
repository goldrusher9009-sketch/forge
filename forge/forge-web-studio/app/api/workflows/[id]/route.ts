import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../../_forgeProxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const handler = async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  return proxyForgeApi(request, ['workflows', id]);
};

export { handler as DELETE, handler as GET, handler as PATCH, handler as PUT };
