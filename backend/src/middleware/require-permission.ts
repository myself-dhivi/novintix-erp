import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';

export const requirePermission =
  (permission: string): RequestHandler =>
  (request, _response, next) => {
    if (!request.user?.permissions.includes(permission))
      return next(new ApiError(403, 'Permission denied'));
    next();
  };
