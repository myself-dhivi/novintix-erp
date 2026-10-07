import crypto from 'node:crypto';
import { FileStatus, StorageProviderType } from '@prisma/client';
import { SOCKET_EVENTS, type FileEventPayload } from '@novintix/shared';
import { prisma } from '../../config/prisma.js';
import { storage } from '../../storage/index.js';
import { eventBus } from '../../events/event-bus.js';
import { ApiError } from '../../utils/api-error.js';
import { validateFile } from './file.policy.js';

const emit = (
  event: string,
  userId: string,
  payload: Omit<FileEventPayload, 'eventId' | 'timestamp'>,
) =>
  eventBus.emitEvent(event, {
    userId,
    payload: { ...payload, eventId: crypto.randomUUID(), timestamp: new Date().toISOString() },
  });

export async function uploadFile(
  file: Express.Multer.File,
  userId: string,
  input: { operationId: string; entityType?: string; entityId?: string; category?: string },
) {
  const extension = validateFile(file);
  const id = crypto.randomUUID();
  const storedName = `${id}${extension}`;
  const storageKey = `${new Date().getUTCFullYear()}/${String(new Date().getUTCMonth() + 1).padStart(2, '0')}/${storedName}`;
  emit(SOCKET_EVENTS.FILE_UPLOAD_STARTED, userId, {
    fileId: id,
    operationId: input.operationId,
    status: 'UPLOADING',
    progress: 0,
    totalBytes: file.size,
  });
  await prisma.file.create({
    data: {
      id,
      originalName: file.originalname.slice(0, 255),
      storedName,
      mimeType: file.mimetype,
      extension,
      size: file.size,
      storageProvider: StorageProviderType.LOCAL,
      storageKey,
      status: FileStatus.PROCESSING,
      uploadedById: userId,
      entityType: input.entityType,
      entityId: input.entityId,
      category: input.category,
    },
  });
  try {
    const stored = await storage.upload(storageKey, file.buffer);
    emit(SOCKET_EVENTS.FILE_UPLOAD_PROCESSING, userId, {
      fileId: id,
      operationId: input.operationId,
      status: 'PROCESSING',
      progress: 80,
      processedBytes: file.size,
      totalBytes: file.size,
    });
    const ready = await prisma.$transaction(async (transaction) => {
      const result = await transaction.file.update({
        where: { id },
        data: { checksum: stored.checksum, status: FileStatus.READY },
      });
      if (input.entityType && input.entityId && input.category)
        await transaction.entityAttachment.create({
          data: {
            fileId: id,
            entityType: input.entityType,
            entityId: input.entityId,
            category: input.category,
            createdById: userId,
          },
        });
      return result;
    });
    emit(SOCKET_EVENTS.FILE_UPLOAD_COMPLETED, userId, {
      fileId: id,
      operationId: input.operationId,
      status: 'READY',
      progress: 100,
      processedBytes: file.size,
      totalBytes: file.size,
    });
    return ready;
  } catch (error) {
    await prisma.file.update({ where: { id }, data: { status: FileStatus.FAILED } });
    emit(SOCKET_EVENTS.FILE_UPLOAD_FAILED, userId, {
      fileId: id,
      operationId: input.operationId,
      status: 'FAILED',
      progress: 0,
      message: 'Processing failed',
    });
    throw error;
  }
}

export async function getReadyFile(id: string) {
  const file = await prisma.file.findFirst({ where: { id, deletedAt: null } });
  if (!file) throw new ApiError(404, 'File not found');
  if (file.status !== FileStatus.READY)
    throw new ApiError(409, `File is ${file.status.toLowerCase()}`);
  if (!(await storage.exists(file.storageKey)))
    throw new ApiError(410, 'Stored file is unavailable');
  return file;
}

export async function softDeleteFile(id: string) {
  const file = await prisma.file.findFirst({ where: { id, deletedAt: null } });
  if (!file) throw new ApiError(404, 'File not found');
  return prisma.file.update({
    where: { id },
    data: { status: FileStatus.DELETED, deletedAt: new Date() },
  });
}
