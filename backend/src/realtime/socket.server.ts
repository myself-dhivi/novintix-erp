import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@novintix/shared';
import { env } from '../config/env.js';
import { eventBus } from '../events/event-bus.js';
import { prisma } from '../config/prisma.js';
import { socketAuthenticate } from './socket.auth.js';
import { joinDefaultRooms } from './socket.rooms.js';

type RoutedEvent = { userId: string; payload: unknown };
export function createSocketServer(server: HttpServer) {
  const io = new Server(server, { cors: { origin: env.FRONTEND_URL, credentials: true } });
  io.use(socketAuthenticate);
  io.on('connection', (socket) => {
    joinDefaultRooms(socket);
    socket.on('room:join:file', async (fileId: string) => {
      const permissions = socket.data.permissions as string[];
      if (!permissions.includes('file.view') || !/^[0-9a-f-]{36}$/i.test(fileId)) return;
      const exists = await prisma.file.count({ where: { id: fileId, deletedAt: null } });
      if (exists) await socket.join(`file:${fileId}`);
    });
  });
  Object.values(SOCKET_EVENTS).forEach((event) =>
    eventBus.on(event, ({ userId, payload }: RoutedEvent) =>
      io.to(`user:${userId}`).emit(event, payload),
    ),
  );
  return io;
}
