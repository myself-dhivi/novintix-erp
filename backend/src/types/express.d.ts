import type { AuthUser } from '@novintix/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
export {};
