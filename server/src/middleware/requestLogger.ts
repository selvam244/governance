import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Log incoming request
  const requestLog = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
    },
    body: sanitizeRequestBody(req.body),
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
  };

  logger.info('Incoming Request', requestLog);

  // Capture original res.json to log responses
  const originalJson = res.json;
  res.json = function(body: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    const responseLog = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseBody: sanitizeResponseBody(body),
      timestamp: new Date().toISOString(),
    };

    logger.info('Outgoing Response', responseLog);
    
    return originalJson.call(this, body);
  };

  // Log response on finish
  res.on('finish', () => {
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    logger.info('Request Completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

// Sanitize request body to avoid logging sensitive data
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'signature', 'privateKey', 'secret'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      if (field === 'signature') {
        // Show first and last 10 characters of signature for debugging
        const sig = sanitized[field];
        sanitized[field] = `${sig.substring(0, 10)}...${sig.substring(sig.length - 10)}`;
      } else {
        sanitized[field] = '[REDACTED]';
      }
    }
  }

  return sanitized;
}

// Sanitize response body to avoid logging sensitive data
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = JSON.parse(JSON.stringify(body));
  
  // Remove or mask sensitive fields in nested objects
  function maskSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(maskSensitiveData);
    }

    const sensitiveFields = ['password', 'token', 'privateKey', 'secret'];
    
    for (const key in obj) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        obj[key] = maskSensitiveData(obj[key]);
      }
    }

    return obj;
  }

  return maskSensitiveData(sanitized);
}