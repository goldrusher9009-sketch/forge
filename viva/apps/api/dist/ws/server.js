"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToUser = exports.setupWebSocket = void 0;
const ws_1 = require("ws");
const jwt_1 = require("../lib/jwt");
const clients = new Map();
function setupWebSocket(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
    wss.on('connection', (ws, req) => {
        // Auth via token query param
        const url = new URL(req.url, `http://localhost`);
        const token = url.searchParams.get('token');
        if (!token) {
            ws.close(1008, 'Missing token');
            return;
        }
        let userId;
        let handle;
        try {
            const payload = (0, jwt_1.verifyAccess)(token);
            userId = payload.userId;
            handle = payload.handle;
        }
        catch {
            ws.close(1008, 'Invalid token');
            return;
        }
        const client = { ws, userId, handle, rooms: new Set() };
        clients.set(userId, client);
        ws.send(JSON.stringify({ type: 'connected', userId, handle }));
        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw.toString());
                handleMessage(client, msg);
            }
            catch { /* ignore */ }
        });
        ws.on('close', () => {
            clients.delete(userId);
        });
        ws.on('error', () => {
            clients.delete(userId);
        });
    });
    console.log('WebSocket server ready at /ws');
}
exports.setupWebSocket = setupWebSocket;
function handleMessage(client, msg) {
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
            }, client.userId);
            break;
        case 'room:join':
            client.rooms.add(msg.roomId);
            broadcastToRoom(msg.roomId, {
                type: 'room:user_joined',
                roomId: msg.roomId,
                userId: client.userId,
                handle: client.handle,
            }, client.userId);
            break;
        case 'room:leave':
            client.rooms.delete(msg.roomId);
            broadcastToRoom(msg.roomId, {
                type: 'room:user_left',
                roomId: msg.roomId,
                userId: client.userId,
            }, client.userId);
            break;
        case 'room:mute':
            broadcastToRoom(msg.roomId, {
                type: 'room:mute_change',
                roomId: msg.roomId,
                userId: client.userId,
                muted: msg.muted,
            }, null);
            break;
        case 'ping':
            client.ws.send(JSON.stringify({ type: 'pong' }));
            break;
    }
}
function broadcastToThread(threadId, payload, excludeUserId) {
    // In prod, query DB for thread members. Here broadcast to all for demo.
    const json = JSON.stringify(payload);
    for (const [uid, c] of clients) {
        if (uid === excludeUserId)
            continue;
        if (c.ws.readyState === ws_1.WebSocket.OPEN) {
            c.ws.send(json);
        }
    }
}
function broadcastToRoom(roomId, payload, excludeUserId) {
    const json = JSON.stringify(payload);
    for (const [uid, c] of clients) {
        if (uid === excludeUserId)
            continue;
        if (c.rooms.has(roomId) && c.ws.readyState === ws_1.WebSocket.OPEN) {
            c.ws.send(json);
        }
    }
}
function sendToUser(userId, payload) {
    const client = clients.get(userId);
    if (client?.ws.readyState === ws_1.WebSocket.OPEN) {
        client.ws.send(JSON.stringify(payload));
    }
}
exports.sendToUser = sendToUser;
//# sourceMappingURL=server.js.map