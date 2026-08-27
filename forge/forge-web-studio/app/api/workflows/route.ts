import { NextRequest } from 'next/server';
import { proxyForgeApi } from '../_forgeProxy';

export async function GET(req: NextRequest) {
  return proxyForgeApi(req, 'workflows');
}

export async function POST(req: NextRequest) {
  return proxyForgeApi(req, 'workflows');
}
