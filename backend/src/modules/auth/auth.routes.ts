import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { prisma } from '../../config/prisma.js';
import { login, revokeRefreshToken, rotateRefreshToken } from './auth.service.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';
import { createAudit } from '../../utils/audit.js';

const router = Router();
const credentials = z.object({ email: z.email(), password: z.string().min(8) });
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 86_400_000,
};

router.post(
  '/login',
  asyncHandler(async (request, response) => {
    const input = credentials.parse(request.body);
    const tokens = await login(input.email, input.password);
    response.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    response.json({
      success: true,
      message: 'Signed in successfully',
      data: { accessToken: tokens.accessToken },
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (request, response) => {
    const raw = request.cookies.refreshToken;
    if (!raw) throw new ApiError(401, 'Refresh token missing');
    const tokens = await rotateRefreshToken(raw);
    response.cookie('refreshToken', tokens.refreshToken, cookieOptions);
    response.json({ success: true, data: { accessToken: tokens.accessToken } });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (request, response) => {
    await revokeRefreshToken(request.cookies.refreshToken);
    response.clearCookie('refreshToken', { path: '/api/auth' });
    response.json({ success: true, message: 'Signed out', data: null });
  }),
);

router.get('/me', authenticateUser, (request, response) =>
  response.json({ success: true, data: request.user }),
);

router.post(
  '/change-password',
  authenticateUser,
  asyncHandler(async (request, response) => {
    const input = z
      .object({ currentPassword: z.string(), newPassword: z.string().min(10) })
      .parse(request.body);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id } });
    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash)))
      throw new ApiError(400, 'Current password is incorrect');
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(input.newPassword, 12) },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await createAudit(request, {
      action: 'UPDATE',
      module: 'AUTH',
      entityType: 'USER',
      entityId: user.id,
    });
    response.clearCookie('refreshToken', { path: '/api/auth' });
    response.json({ success: true, message: 'Password changed; sign in again', data: null });
  }),
);

router.post('/forgot-password', (_request, response) =>
  response.json({
    success: true,
    message: 'If the account exists, reset instructions will be sent',
    data: null,
  }),
);
router.post('/reset-password', (_request, _response, next) =>
  next(new ApiError(501, 'Password reset delivery is not configured')),
);

export default router;
