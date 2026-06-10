import { Server as HTTPServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { verifyAccess } from '../lib/jwt'

interface WSClient {
  ws: WebSocket
  userId: string
  handle: string
  rooms: Set<string>
}

const clients = new Map<string, WSClient>()

export function setupWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    // Auth via token query param
    const url = new URL(req.url!, `http://localhost`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(1008, 'Missing token')
      return
    }

    let userId: string
    let handle: string
    try {
      const payload = verifyAccess(token)
      userId = payload.userId
      handle = payload.handle
    } catch {
      ws.close(1008, 'Invalid token')
      return
    }

    const client: WSClient = { ws, userId, handle, rooms: new Set() }
    clients.set(userId, client)

    ws.send(JSON.stringify({ type: 'connected', userId, handle }))

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString())
        handleMessage(client, msg)
      } catch { /* ignore */ }
    })

    ws.on('close', () => {
      clients.delete(userId)
    })

    ws.on('error', () => {
      clients.delete(userId)
    })
  })

  console.log('WebSocket server ready at /ws')
}

function handleMessage(client: WSClient, msg: any) {
  switch (msg.type) {
    case 'message:send':
      broadcastToThread(msg.threadId, {
        type: 'message:new',
        threadId: msg.threadId,
        message: {
          id: Date.now().toString(),
          senderId: client.userId,
          senderHandle: client.handle,
          content: msg.content,
          createdAt: new Date().toISOString(),
        },
      }, client.userId)
      break

    case 'room:join':
      client.rooms.add(msg.roomId)
      broadcastToRoom(msg.roomId, {
        type: 'room:user_joined',
        roomId: msg.roomId,
        userId: client.userId,
        handle: client.handle,
      }, client.userId)
      break

    case 'room:leave':
      client.rooms.delete(msg.roomId)
      broadcastToRoom(msg.roomId, {
        type: 'room:user_left',
        roomId: msg.roomId,
        userId: client.userId,
      }, client.userId)
      break

    case 'room:mute':
      broadcastToRoom(msg.roomId, {
        type: 'room:mute_change',
        roomId: msg.roomId,
        userId: client.userId,
        muted: msg.muted,
      }, null)
      break

    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong' }))
      break
  }
}

function broadcastToThread(threadId: string, payload: object, excludeUserId: string | null) {
  // In prod, query DB for thread members. Here broadcast to all for demo.
  const json = JSON.stringify(payload)
  for (const [uid, c] of clients) {
    if (uid === excludeUserId) continue
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(json)
    }
  }
}

function broadcastToRoom(roomId: string, payload: object, excludeUserId: string | null) {
  const json = JSON.stringify(payload)
  for (const [uid, c] of clients) {
    if (uid === excludeUserId) continue
    if (c.rooms.has(roomId) && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(json)
    }
  }
}

export function sendToUser(userId: string, payload: object) {
  const client = clients.get(userId)
  if (client?.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload))
  }
}
