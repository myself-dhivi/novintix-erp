import crypto from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';
import { storage } from '../../storage/index.js';
import { createAudit } from '../../utils/audit.js';
import { getReadyFile, softDeleteFile, uploadFile } from './file.service.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 1 },
});
const fields = z.object({
  operationId: z.uuid(),
  entityType: z.string().max(50).optional(),
  entityId: z.string().max(100).optional(),
  category: z.string().max(50).optional(),
});
router.use(authenticateUser);

router.get(
  '/',
  requirePermission('file.view'),
  asyncHandler(async (request, response) => {
    const files = await prisma.file.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    response.json({
      success: true,
      data: files.map((file) => ({ ...file, size: Number(file.size), storageKey: undefined })),
    });
  }),
);
router.post(
  '/upload',
  requirePermission('file.upload'),
  upload.single('file'),
  asyncHandler(async (request, response) => {
    if (!request.file) throw new ApiError(422, 'A file is required');
    const input = fields.parse(request.body);
    const file = await uploadFile(request.file, request.user!.id, input);
    await createAudit(request, {
      action: 'FILE_UPLOAD',
      module: 'FILES',
      entityType: 'FILE',
      entityId: file.id,
    });
    response.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { ...file, size: Number(file.size), storageKey: undefined },
    });
  }),
);
router.post(
  '/presigned-upload',
  requirePermission('file.upload'),
  asyncHandler(async (_request, _response) => {
    throw new ApiError(
      409,
      'Direct uploads require an object-storage provider; LOCAL uses multipart upload',
    );
  }),
);
router.post(
  '/:id/complete',
  requirePermission('file.upload'),
  asyncHandler(async (_request, _response) => {
    throw new ApiError(409, 'Completion is only used by object-storage providers');
  }),
);
router.get(
  '/:id',
  requirePermission('file.view'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const file = await prisma.file.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        extension: true,
        size: true,
        status: true,
        entityType: true,
        entityId: true,
        category: true,
        createdAt: true,
      },
    });
    if (!file) throw new ApiError(404, 'File not found');
    response.json({ success: true, data: { ...file, size: Number(file.size) } });
  }),
);
router.get(
  '/:id/download',
  requirePermission('file.download'),
  asyncHandler(async (request, response) => {
    const file = await getReadyFile(z.uuid().parse(request.params.id));
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    await createAudit(request, {
      action: 'FILE_DOWNLOAD',
      module: 'FILES',
      entityType: 'FILE',
      entityId: file.id,
    });
    const stream = await storage.download(file.storageKey);
    stream.on('error', (error) => response.destroy(error));
    stream.pipe(response);
  }),
);
router.delete(
  '/:id',
  requirePermission('file.delete'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    await softDeleteFile(id);
    await createAudit(request, {
      action: 'FILE_DELETE',
      module: 'FILES',
      entityType: 'FILE',
      entityId: id,
    });
    response.json({
      success: true,
      message: 'File moved to retention',
      data: { id, operationId: crypto.randomUUID() },
    });
  }),
);
export default router;
