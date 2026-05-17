import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://forge-production-2692.up.railway.app/api';

export async function GET(req: NextRequest) {
  const res = await fetch(`${API}/queue`, { headers: { authorization: req.headers.get('authorization') || '' } });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API}/queue`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: req.headers.get('authorization') || '' }, body: JSON.stringify(body) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
