import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error.js';

export const notFound: RequestHandler = (_request, _response, next) =>
  next(new ApiError(404, 'Route not found'));

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response
      .status(422)
      .json({ success: false, message: 'Validation failed', errors: error.flatten().fieldErrors });
    return;
  }
  if (error instanceof MulterError) {
    response.status(413).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : error.message,
    });
    return;
  }
  const status = error instanceof ApiError ? error.statusCode : 500;
  const message = error instanceof ApiError ? error.message : 'Internal server error';
  if (status === 500) _request.log.error({ err: error }, 'Unhandled request error');
  response.status(status).json({
    success: false,
    message,
    ...(error instanceof ApiError && error.errors ? { errors: error.errors } : {}),
  });
};
