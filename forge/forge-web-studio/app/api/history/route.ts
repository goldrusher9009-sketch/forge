import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../_forgeProxy';

export async function GET(req: NextRequest) {
  return proxyForgeApi(req, 'history');
}
