import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from '../api/token';

let socket: Socket | null = null;
export function getSocket() {
  socket ??= io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000', {
    autoConnect: false,
    transports: ['websocket'],
    auth: (callback) => callback({ token: getAccessToken() }),
  });
  return socket;
}
export function connectSocket() {
  const instance = getSocket();
  if (!instance.connected) instance.connect();
  return instance;
}
export function disconnectSocket() {
  socket?.disconnect();
}
