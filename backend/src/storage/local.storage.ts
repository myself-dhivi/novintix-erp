import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile, unlink, access } from 'node:fs/promises';
import path from 'node:path';
import type { StorageProvider, StoredObject } from './storage.interface.js';
import { ApiError } from '../utils/api-error.js';

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;
  constructor(rootPath: string) {
    this.root = path.resolve(rootPath);
  }
  private resolveKey(key: string) {
    const target = path.resolve(this.root, key);
    if (!target.startsWith(`${this.root}${path.sep}`))
      throw new ApiError(400, 'Invalid storage key');
    return target;
  }
  async upload(key: string, data: Buffer): Promise<StoredObject> {
    const target = this.resolveKey(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data, { flag: 'wx' });
    return {
      key,
      size: data.byteLength,
      checksum: crypto.createHash('sha256').update(data).digest('hex'),
    };
  }
  async download(key: string) {
    return createReadStream(this.resolveKey(key));
  }
  async delete(key: string) {
    try {
      await unlink(this.resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  async exists(key: string) {
    try {
      await access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }
  async getSignedDownloadUrl() {
    return null;
  }
  async getSignedUploadUrl() {
    return null;
  }
}
