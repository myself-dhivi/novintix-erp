import { Router } from 'express';
import { z } from 'zod';
import { SOCKET_EVENTS } from '@novintix/shared';
import { prisma } from '../../config/prisma.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { createAudit } from '../../utils/audit.js';
import { emitBusinessEvent } from '../../utils/business-event.js';

const router = Router();
router.use(authenticateUser);
const schema = z.object({
  leadId: z.uuid(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'DEMO', 'VISIT', 'TASK', 'OTHER']),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'MISSED']).default('PENDING'),
  subject: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  scheduledAt: z.coerce.date(),
  assignedToId: z.uuid().optional().nullable(),
});
router.get(
  '/',
  requirePermission('followup.view'),
  asyncHandler(async (request, response) => {
    const status = typeof request.query.status === 'string' ? request.query.status : undefined;
    const data = await prisma.followUp.findMany({
      where: { deletedAt: null, ...(status ? { status: status as never } : {}) },
      include: {
        lead: {
          select: { id: true, leadCode: true, firstName: true, lastName: true, companyName: true },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 200,
    });
    response.json({ success: true, data });
  }),
);
router.post(
  '/',
  requirePermission('followup.create'),
  asyncHandler(async (request, response) => {
    const input = schema.parse(request.body);
    const item = await prisma.followUp.create({
      data: {
        ...input,
        completedAt: input.status === 'COMPLETED' ? new Date() : null,
        createdById: request.user!.id,
      },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'CRM',
      entityType: 'FOLLOWUP',
      entityId: item.id,
      newValues: input,
    });
    emitBusinessEvent(SOCKET_EVENTS.FOLLOWUP_CREATED, request.user!.id, {
      followupId: item.id,
      leadId: item.leadId,
    });
    response.status(201).json({ success: true, message: 'Follow-up scheduled', data: item });
  }),
);
router.patch(
  '/:id',
  requirePermission('followup.update'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const input = schema.partial().parse(request.body);
    const item = await prisma.followUp.update({
      where: { id },
      data: {
        ...input,
        completedAt: input.status === 'COMPLETED' ? new Date() : input.status ? null : undefined,
      },
    });
    await createAudit(request, {
      action: input.status === 'COMPLETED' ? 'STATUS_CHANGE' : 'UPDATE',
      module: 'CRM',
      entityType: 'FOLLOWUP',
      entityId: id,
      newValues: input,
    });
    emitBusinessEvent(
      input.status === 'COMPLETED'
        ? SOCKET_EVENTS.FOLLOWUP_COMPLETED
        : SOCKET_EVENTS.FOLLOWUP_UPDATED,
      request.user!.id,
      { followupId: id, leadId: item.leadId },
    );
    response.json({ success: true, message: 'Follow-up updated', data: item });
  }),
);
router.delete(
  '/:id',
  requirePermission('followup.delete'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    await prisma.followUp.update({ where: { id }, data: { deletedAt: new Date() } });
    response.json({ success: true, message: 'Follow-up deleted', data: { id } });
  }),
);
export default router;
