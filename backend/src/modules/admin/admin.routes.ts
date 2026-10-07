import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../config/prisma.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';
import { createAudit } from '../../utils/audit.js';

const router = Router();
router.use(authenticateUser);
const safeUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  roleId: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;
router.get(
  '/users',
  requirePermission('user.view'),
  asyncHandler(async (_request, response) => {
    response.json({
      success: true,
      data: await prisma.user.findMany({
        where: { deletedAt: null },
        select: safeUser,
        orderBy: { createdAt: 'desc' },
      }),
    });
  }),
);
router.post(
  '/users',
  requirePermission('user.create'),
  asyncHandler(async (request, response) => {
    const input = z
      .object({
        email: z.email(),
        password: z.string().min(10),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        roleId: z.uuid(),
        isActive: z.boolean().default(true),
      })
      .parse(request.body);
    const { password, ...profile } = input;
    const user = await prisma.user.create({
      data: {
        ...profile,
        email: profile.email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: safeUser,
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'ADMIN',
      entityType: 'USER',
      entityId: user.id,
      newValues: { email: user.email, roleId: user.roleId },
    });
    response.status(201).json({ success: true, message: 'User created', data: user });
  }),
);
router.patch(
  '/users/:id',
  requirePermission('user.update'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const input = z
      .object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        roleId: z.uuid().optional(),
        isActive: z.boolean().optional(),
      })
      .parse(request.body);
    if (id === request.user!.id && input.isActive === false)
      throw new ApiError(422, 'You cannot deactivate your own account');
    const user = await prisma.user.update({ where: { id }, data: input, select: safeUser });
    await createAudit(request, {
      action: 'UPDATE',
      module: 'ADMIN',
      entityType: 'USER',
      entityId: id,
      newValues: input,
    });
    response.json({ success: true, message: 'User updated', data: user });
  }),
);
router.delete(
  '/users/:id',
  requirePermission('user.delete'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    if (id === request.user!.id) throw new ApiError(422, 'You cannot delete your own account');
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } }),
      prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await createAudit(request, {
      action: 'DELETE',
      module: 'ADMIN',
      entityType: 'USER',
      entityId: id,
    });
    response.json({ success: true, message: 'User deactivated', data: { id } });
  }),
);
router.get(
  '/roles',
  requirePermission('role.view'),
  asyncHandler(async (_request, response) => {
    const data = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    response.json({
      success: true,
      data: data.map((role) => ({
        ...role,
        permissions: role.permissions.map((entry) => entry.permission.name),
      })),
    });
  }),
);
router.get(
  '/permissions',
  requirePermission('role.view'),
  asyncHandler(async (_request, response) => {
    response.json({
      success: true,
      data: await prisma.permission.findMany({ orderBy: { name: 'asc' } }),
    });
  }),
);
router.post(
  '/roles',
  requirePermission('role.manage'),
  asyncHandler(async (request, response) => {
    const input = z
      .object({
        name: z
          .string()
          .regex(/^[A-Z][A-Z0-9_]+$/)
          .max(50),
        description: z.string().max(250).optional(),
        permissionIds: z.array(z.uuid()).default([]),
      })
      .parse(request.body);
    const role = await prisma.role.create({
      data: {
        name: input.name,
        description: input.description,
        permissions: { create: input.permissionIds.map((permissionId) => ({ permissionId })) },
      },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'ADMIN',
      entityType: 'ROLE',
      entityId: role.id,
    });
    response.status(201).json({ success: true, message: 'Role created', data: role });
  }),
);
router.put(
  '/roles/:id/permissions',
  requirePermission('role.manage'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const { permissionIds } = z.object({ permissionIds: z.array(z.uuid()) }).parse(request.body);
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new ApiError(404, 'Role not found');
    if (role.name === 'SUPER_ADMIN')
      throw new ApiError(422, 'SUPER_ADMIN permissions are managed by the seed policy');
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      }),
    ]);
    await createAudit(request, {
      action: 'UPDATE',
      module: 'ADMIN',
      entityType: 'ROLE',
      entityId: id,
      newValues: { permissionIds },
    });
    response.json({ success: true, message: 'Role permissions updated', data: { id } });
  }),
);
export default router;
