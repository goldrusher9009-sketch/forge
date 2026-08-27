import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../../_forgeProxy';

type RouteContext = {
  params: {
    id: string;
  };
};

const handler = (request: NextRequest, context: RouteContext) =>
  proxyForgeApi(request, ['agents', context.params.id]);

export { handler as DELETE, handler as GET, handler as PATCH, handler as PUT };
