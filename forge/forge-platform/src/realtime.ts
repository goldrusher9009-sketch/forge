import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface User {
  sub: string;
}

export const setupRealtime = (httpServer: HTTPServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' }
  });

  // Track online users
  const onlineUsers = new Map<string, string[]>();

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth.userId || socket.id;

    socket.on('user:online', (data: { userId: string }) => {
      if (!onlineUsers.has(data.userId)) {
        onlineUsers.set(data.userId, []);
      }
      onlineUsers.get(data.userId)!.push(socket.id);
      socket.broadcast.emit('user:status', { userId: data.userId, status: 'online' });
    });

    // Typing indicators
    socket.on('typing:start', (data: { threadId: string; userId: string }) => {
      socket.broadcast.emit('typing:indicator', { 
        threadId: data.threadId, 
        userId: data.userId, 
        typing: true 
      });
    });

    socket.on('typing:stop', (data: { threadId: string; userId: string }) => {
      socket.broadcast.emit('typing:indicator', { 
        threadId: data.threadId, 
        userId: data.userId, 
        typing: false 
      });
    });

    // Live tab sync
    socket.on('tab:update', (data: { tabName: string; state: any }) => {
      socket.broadcast.emit('tab:sync', { tabName: data.tabName, state: data.state });
    });

    // Chat streaming (replaces SSE)
    socket.on('chat:message', (data: { threadId: string; content: string }) => {
      socket.emit('chat:response', { 
        threadId: data.threadId, 
        content: 'Streaming response...',
        timestamp: new Date().toISOString()
      });
    });

    // Presence
    socket.on('presence:update', (data: { userId: string; lastSeen: string }) => {
      socket.broadcast.emit('presence:changed', data);
    });

    socket.on('disconnect', () => {
      for (const [userId, sockets] of onlineUsers.entries()) {
        const idx = sockets.indexOf(socket.id);
        if (idx !== -1) {
          sockets.splice(idx, 1);
          if (sockets.length === 0) {
            onlineUsers.delete(userId);
            socket.broadcast.emit('user:status', { userId, status: 'offline' });
          }
        }
      }
    });
  });

  return io;
};
