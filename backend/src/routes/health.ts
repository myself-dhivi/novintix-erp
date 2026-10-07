import { Router } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();
router.get('/', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({
      success: true,
      data: { status: 'healthy', database: 'connected', timestamp: new Date().toISOString() },
    });
  } catch {
    response.status(503).json({ success: false, message: 'Database unavailable' });
  }
});
export default router;
