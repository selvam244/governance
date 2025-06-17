import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error with request context
  logger.error('Unhandled Error', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
    },
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
  });

  // Continue to the next error handler
  next(error);
};