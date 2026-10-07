import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { createSocketServer } from './realtime/socket.server.js';

const server = createServer(app);
const io = createSocketServer(server);
server.listen(env.PORT, () =>
  console.log(`Novintix API listening on http://localhost:${env.PORT}`),
);

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down`);
  io.close();
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
