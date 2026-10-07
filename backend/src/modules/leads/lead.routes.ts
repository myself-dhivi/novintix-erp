import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { SOCKET_EVENTS } from '@novintix/shared';
import { prisma } from '../../config/prisma.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';
import { createAudit } from '../../utils/audit.js';
import { emitBusinessEvent } from '../../utils/business-event.js';

const router = Router();
router.use(authenticateUser);
const bodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  companyName: z.string().max(150).optional(),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().min(5).max(30),
  alternatePhone: z.string().max(30).optional(),
  source: z.string().max(80).optional(),
  status: z
    .enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD'])
    .default('NEW'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  industry: z.string().max(100).optional(),
  website: z.string().max(200).optional(),
  estimatedValue: z.coerce.number().nonnegative().optional(),
  assignedToId: z.uuid().optional().nullable(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

router.get(
  '/',
  requirePermission('lead.view'),
  asyncHandler(async (request, response) => {
    const query = z
      .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
      })
      .parse(request.query);
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: ['firstName', 'lastName', 'companyName', 'email', 'phone', 'leadCode'].map(
              (field) => ({ [field]: { contains: query.search, mode: 'insensitive' } }),
            ),
          }
        : {}),
    };
    const [data, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.lead.count({ where }),
    ]);
    response.json({
      success: true,
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  }),
);
router.get(
  '/:id',
  requirePermission('lead.view'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        followUps: { where: { deletedAt: null }, orderBy: { scheduledAt: 'desc' } },
      },
    });
    if (!lead) throw new ApiError(404, 'Lead not found');
    response.json({ success: true, data: lead });
  }),
);
router.post(
  '/',
  requirePermission('lead.create'),
  asyncHandler(async (request, response) => {
    const input = bodySchema.parse(request.body);
    const sequence = await prisma.lead.count();
    const lead = await prisma.lead.create({
      data: {
        ...input,
        email: input.email || null,
        estimatedValue: input.estimatedValue,
        leadCode: `LD-${String(sequence + 1).padStart(5, '0')}`,
        createdById: request.user!.id,
      },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'CRM',
      entityType: 'LEAD',
      entityId: lead.id,
      newValues: input,
    });
    emitBusinessEvent(SOCKET_EVENTS.LEAD_CREATED, request.user!.id, { leadId: lead.id });
    response.status(201).json({ success: true, message: 'Lead created successfully', data: lead });
  }),
);
router.patch(
  '/:id',
  requirePermission('lead.update'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const input = bodySchema.partial().parse(request.body);
    const existing = await prisma.lead.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new ApiError(404, 'Lead not found');
    const lead = await prisma.lead.update({
      where: { id },
      data: { ...input, email: input.email || undefined, updatedById: request.user!.id },
    });
    await createAudit(request, {
      action: existing.status !== lead.status ? 'STATUS_CHANGE' : 'UPDATE',
      module: 'CRM',
      entityType: 'LEAD',
      entityId: id,
      oldValues: existing,
      newValues: input,
    });
    emitBusinessEvent(
      existing.status !== lead.status
        ? SOCKET_EVENTS.LEAD_STATUS_CHANGED
        : SOCKET_EVENTS.LEAD_UPDATED,
      request.user!.id,
      { leadId: id, status: lead.status },
    );
    response.json({ success: true, message: 'Lead updated', data: lead });
  }),
);
router.delete(
  '/:id',
  requirePermission('lead.delete'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    await createAudit(request, {
      action: 'DELETE',
      module: 'CRM',
      entityType: 'LEAD',
      entityId: id,
    });
    response.json({ success: true, message: 'Lead archived', data: { id } });
  }),
);
export default router;
