import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export async function socketAuthenticate(socket: Socket, next: (error?: Error) => void) {
  try {
    const raw = socket.handshake.auth.token;
    if (typeof raw !== 'string') throw new Error('Authentication required');
    const claims = jwt.verify(raw, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
    if (claims.type !== 'access' || !claims.sub) throw new Error('Invalid token');
    const user = await prisma.user.findFirst({
      where: { id: claims.sub, isActive: true, deletedAt: null },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!user) throw new Error('Account unavailable');
    socket.data.userId = user.id;
    socket.data.permissions = user.role.permissions.map((entry) => entry.permission.name);
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}
