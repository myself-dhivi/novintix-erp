import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let connection: Redis | undefined;
export function getJobQueue() {
  connection ??= new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
  return new Queue('novintix-jobs', { connection });
}
