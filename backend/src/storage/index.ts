import { env } from '../config/env.js';
import { LocalStorageProvider } from './local.storage.js';
import type { StorageProvider } from './storage.interface.js';

function createStorage(): StorageProvider {
  if (env.STORAGE_PROVIDER === 'LOCAL') return new LocalStorageProvider(env.LOCAL_UPLOAD_PATH);
  throw new Error(`${env.STORAGE_PROVIDER} requires a production storage adapter`);
}
export const storage = createStorage();
