import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details
  logger.error('Error Handler', {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });

  const errorResponse = {
    success: false,
    error: "Internal server error",
    requestId: req.requestId,
    message: process.env.NODE_ENV === "development" ? error.message : undefined
  };

  res.status(500).json(errorResponse);
};