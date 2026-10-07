import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/api-error.js';

const tokenHash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const refreshExpiry = () => new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 86_400_000);

function signAccessToken(userId: string) {
  return jwt.sign({ type: 'access' }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
function signRefreshToken(userId: string, tokenId: string, familyId: string) {
  return jwt.sign({ type: 'refresh', jti: tokenId, familyId }, env.JWT_REFRESH_SECRET, {
    subject: userId,
    expiresIn: `${env.JWT_REFRESH_EXPIRES_DAYS}d`,
  });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (
    !user ||
    !user.isActive ||
    user.deletedAt ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw new ApiError(401, 'Invalid email or password');
  }
  const id = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, id, familyId);
  await prisma.refreshToken.create({
    data: {
      id,
      userId: user.id,
      familyId,
      tokenHash: tokenHash(refreshToken),
      expiresAt: refreshExpiry(),
    },
  });
  return { accessToken: signAccessToken(user.id), refreshToken };
}

export async function rotateRefreshToken(rawToken: string) {
  let claims: jwt.JwtPayload;
  try {
    claims = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  if (
    claims.type !== 'refresh' ||
    !claims.sub ||
    !claims.jti ||
    typeof claims.familyId !== 'string'
  )
    throw new ApiError(401, 'Invalid refresh token');
  const existing = await prisma.refreshToken.findUnique({
    where: { id: claims.jti },
  });
  if (!existing || existing.tokenHash !== tokenHash(rawToken) || existing.expiresAt < new Date())
    throw new ApiError(401, 'Invalid refresh token');
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: existing.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new ApiError(401, 'Refresh token reuse detected');
  }
  const id = crypto.randomUUID();
  const nextToken = signRefreshToken(claims.sub, id, existing.familyId);
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedBy: id },
    }),
    prisma.refreshToken.create({
      data: {
        id,
        userId: claims.sub,
        familyId: existing.familyId,
        tokenHash: tokenHash(nextToken),
        expiresAt: refreshExpiry(),
      },
    }),
  ]);
  return { accessToken: signAccessToken(claims.sub), refreshToken: nextToken };
}

export async function revokeRefreshToken(rawToken?: string) {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: tokenHash(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
