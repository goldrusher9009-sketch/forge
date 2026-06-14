import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/')
  const url = `${API_URL}/api/${path}`
  const authHeader = req.headers.get('authorization')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authHeader) headers['Authorization'] = authHeader

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined
    const res = await fetch(url, { method: req.method, headers, body })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
