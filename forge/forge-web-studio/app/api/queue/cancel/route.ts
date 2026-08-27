import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../../_forgeProxy';

export async function POST(request: NextRequest) {
  return proxyForgeApi(request, ['queue', 'cancel']);
}
