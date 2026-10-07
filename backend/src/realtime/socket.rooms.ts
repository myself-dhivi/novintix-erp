import type { Socket } from 'socket.io';

export function joinDefaultRooms(socket: Socket) {
  const userId = socket.data.userId as string;
  void socket.join(`user:${userId}`);
}
