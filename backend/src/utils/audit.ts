import type { Request } from 'express';
import { prisma } from '../config/prisma.js';

export async function createAudit(
  request: Request,
  data: {
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    oldValues?: object;
    newValues?: object;
  },
) {
  await prisma.auditLog.create({
    data: {
      userId: request.user?.id,
      action: data.action,
      module: data.module,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress: request.ip,
      userAgent: request.get('user-agent')?.slice(0, 500),
    },
  });
}
