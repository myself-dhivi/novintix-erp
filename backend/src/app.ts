import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRouter from './modules/auth/auth.routes.js';
import fileRouter from './modules/files/file.routes.js';
import healthRouter from './routes/health.js';
import leadRouter from './modules/leads/lead.routes.js';
import followupRouter from './modules/followups/followup.routes.js';
import recruitmentRouter from './modules/recruitment/recruitment.routes.js';
import financeRouter from './modules/finance/finance.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { httpLogger } from './config/logger.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(httpLogger);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  '/api',
  rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
);
app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 50 }), authRouter);
app.use('/api/files', rateLimit({ windowMs: 60_000, limit: 30 }), fileRouter);
app.use('/api/leads', leadRouter);
app.use('/api/followups', followupRouter);
app.use('/api/recruitment', recruitmentRouter);
app.use('/api/finance', financeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/health', healthRouter);
app.get('/api', (_request, response) =>
  response.json({ success: true, data: { name: 'Novintix ERP API', version: '1.0.0' } }),
);
app.use(notFound);
app.use(errorHandler);
export default app;
