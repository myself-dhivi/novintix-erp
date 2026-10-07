import type { Readable } from 'node:stream';

export type StoredObject = { key: string; size: number; checksum: string };
export interface StorageProvider {
  upload(key: string, data: Buffer): Promise<StoredObject>;
  download(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedDownloadUrl(key: string, expiresInSeconds: number): Promise<string | null>;
  getSignedUploadUrl(key: string, expiresInSeconds: number): Promise<string | null>;
}
