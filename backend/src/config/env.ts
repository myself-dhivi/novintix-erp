import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().int().positive().default(7),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  STORAGE_PROVIDER: z.enum(['LOCAL', 'S3', 'CLOUDFLARE_R2', 'AZURE_BLOB', 'GCS']).default('LOCAL'),
  LOCAL_UPLOAD_PATH: z.string().default('./uploads'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(10),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}
export const env = parsed.data;
