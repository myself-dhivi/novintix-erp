import { Router } from 'express';
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
const jobSchema = z.object({
  title: z.string().min(2).max(150),
  department: z.string().min(2).max(100),
  location: z.string().max(100).optional(),
  employmentType: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  openings: z.coerce.number().int().positive().default(1),
  status: z.enum(['DRAFT', 'OPEN', 'PAUSED', 'CLOSED']).default('OPEN'),
});
const candidateSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  email: z.email(),
  phone: z.string().max(30).optional(),
  currentCompany: z.string().max(150).optional(),
  currentTitle: z.string().max(150).optional(),
  experienceYears: z.coerce.number().nonnegative().optional(),
  expectedSalary: z.coerce.number().nonnegative().optional(),
  skills: z.array(z.string().max(50)).default([]),
  stage: z
    .enum([
      'APPLIED',
      'SCREENING',
      'SHORTLISTED',
      'TECHNICAL_INTERVIEW',
      'MANAGERIAL_INTERVIEW',
      'HR_INTERVIEW',
      'OFFER',
      'HIRED',
      'REJECTED',
      'WITHDRAWN',
    ])
    .default('APPLIED'),
  jobId: z.uuid().optional().nullable(),
  resumeFileId: z.uuid().optional().nullable(),
});
router.get(
  '/jobs',
  requirePermission('recruitment.view'),
  asyncHandler(async (_request, response) => {
    const data = await prisma.jobOpening.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    });
    response.json({ success: true, data });
  }),
);
router.post(
  '/jobs',
  requirePermission('candidate.create'),
  asyncHandler(async (request, response) => {
    const input = jobSchema.parse(request.body);
    const count = await prisma.jobOpening.count();
    const job = await prisma.jobOpening.create({
      data: {
        ...input,
        code: `JOB-${String(count + 1).padStart(4, '0')}`,
        createdById: request.user!.id,
      },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'RECRUITMENT',
      entityType: 'JOB',
      entityId: job.id,
      newValues: input,
    });
    response.status(201).json({ success: true, message: 'Job opening created', data: job });
  }),
);
router.patch(
  '/jobs/:id',
  requirePermission('candidate.update'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const input = jobSchema.partial().parse(request.body);
    const job = await prisma.jobOpening.update({ where: { id }, data: input });
    response.json({ success: true, message: 'Job updated', data: job });
  }),
);
router.get(
  '/candidates',
  requirePermission('recruitment.view'),
  asyncHandler(async (request, response) => {
    const stage = typeof request.query.stage === 'string' ? request.query.stage : undefined;
    const data = await prisma.candidate.findMany({
      where: { deletedAt: null, ...(stage ? { stage: stage as never } : {}) },
      include: { job: { select: { id: true, title: true, code: true } } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    response.json({ success: true, data });
  }),
);
router.get(
  '/candidates/:id',
  requirePermission('recruitment.view'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const candidate = await prisma.candidate.findFirst({
      where: { id, deletedAt: null },
      include: { job: true },
    });
    if (!candidate) throw new ApiError(404, 'Candidate not found');
    response.json({ success: true, data: candidate });
  }),
);
router.post(
  '/candidates',
  requirePermission('candidate.create'),
  asyncHandler(async (request, response) => {
    const input = candidateSchema.parse(request.body);
    const count = await prisma.candidate.count();
    const candidate = await prisma.candidate.create({
      data: {
        ...input,
        candidateCode: `CAN-${String(count + 1).padStart(5, '0')}`,
        createdById: request.user!.id,
      },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'RECRUITMENT',
      entityType: 'CANDIDATE',
      entityId: candidate.id,
      newValues: input,
    });
    emitBusinessEvent(SOCKET_EVENTS.CANDIDATE_CREATED, request.user!.id, {
      candidateId: candidate.id,
    });
    response.status(201).json({ success: true, message: 'Candidate created', data: candidate });
  }),
);
router.patch(
  '/candidates/:id',
  requirePermission('candidate.update'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const input = candidateSchema.partial().omit({ stage: true }).parse(request.body);
    const candidate = await prisma.candidate.update({ where: { id }, data: input });
    response.json({ success: true, message: 'Candidate updated', data: candidate });
  }),
);
router.patch(
  '/candidates/:id/stage',
  requirePermission('candidate.move_stage'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const { stage } = z
      .object({
        stage: z.enum([
          'APPLIED',
          'SCREENING',
          'SHORTLISTED',
          'TECHNICAL_INTERVIEW',
          'MANAGERIAL_INTERVIEW',
          'HR_INTERVIEW',
          'OFFER',
          'HIRED',
          'REJECTED',
          'WITHDRAWN',
        ]),
      })
      .parse(request.body);
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Candidate not found');
    const candidate = await prisma.candidate.update({ where: { id }, data: { stage } });
    await createAudit(request, {
      action: 'STATUS_CHANGE',
      module: 'RECRUITMENT',
      entityType: 'CANDIDATE',
      entityId: id,
      oldValues: { stage: existing.stage },
      newValues: { stage },
    });
    emitBusinessEvent(SOCKET_EVENTS.CANDIDATE_STAGE_CHANGED, request.user!.id, {
      candidateId: id,
      stage,
    });
    response.json({ success: true, message: 'Candidate stage updated', data: candidate });
  }),
);
router.delete(
  '/candidates/:id',
  requirePermission('candidate.delete'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    await prisma.candidate.update({ where: { id }, data: { deletedAt: new Date() } });
    response.json({ success: true, message: 'Candidate archived', data: { id } });
  }),
);
export default router;
