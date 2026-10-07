import { pinoHttp } from 'pino-http';
import type { IncomingMessage } from 'node:http';
import { env } from './env.js';

const isDevelopment = env.NODE_ENV === 'development';
const requestPath = (request: IncomingMessage) =>
  (request as IncomingMessage & { originalUrl?: string }).originalUrl ?? request.url ?? 'unknown';

export const httpLogger = pinoHttp({
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname,req,res,responseTime',
            singleLine: true,
          },
        },
      }
    : {}),
  quietReqLogger: true,
  autoLogging: {
    ignore: (request) => request.url === '/api/health',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers.set-cookie',
      'headers.authorization',
      'headers.cookie',
      'body.password',
      'body.currentPassword',
      'body.newPassword',
      'accessToken',
      'refreshToken',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req(request) {
      return {
        id: request.id,
        method: request.method,
        path: requestPath(request.raw),
        ip: request.remoteAddress,
      };
    },
    res(response) {
      return { statusCode: response.statusCode };
    },
  },
  customLogLevel(_request, response, error) {
    if (error || response.statusCode >= 500) return 'error';
    if (response.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage(request, response, responseTime) {
    return `${request.method} ${requestPath(request)} ${response.statusCode} ${Math.round(responseTime)}ms`;
  },
  customErrorMessage(request, response, error) {
    return `${request.method} ${requestPath(request)} ${response.statusCode} — ${error.message}`;
  },
});
