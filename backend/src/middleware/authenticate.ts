import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '@novintix/shared';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';

type AccessClaims = { sub: string; type: 'access' };

export const authenticateUser: RequestHandler = async (request, _response, next) => {
  try {
    const header = request.get('authorization');
    if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');
    const claims = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as AccessClaims;
    if (claims.type !== 'access') throw new ApiError(401, 'Invalid access token');
    const user = await prisma.user.findFirst({
      where: { id: claims.sub, isActive: true, deletedAt: null },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    if (!user) throw new ApiError(401, 'Account is unavailable');
    request.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role.name,
      permissions: user.role.permissions.map((entry) => entry.permission.name),
    } satisfies AuthUser;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid or expired access token'));
  }
};
