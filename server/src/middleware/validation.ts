import { Request, Response, NextFunction } from "express";

export const validateSignature = (req: Request, res: Response, next: NextFunction): void => {
  const { message, signature } = req.body;

  // Check required fields
  if (!message || !signature) {
    res.status(400).json({
      success: false,
      error: "Message and signature are required fields"
    });
    return;
  }

  // Validate message format (basic check)
  if (typeof message !== "string" || message.length === 0) {
    res.status(400).json({
      success: false,
      error: "Message must be a non-empty string"
    });
    return;
  }

  // Validate signature format (basic check for hex string)
  if (typeof signature !== "string" || !/^0x[a-fA-F0-9]{130}$/.test(signature)) {
    res.status(400).json({
      success: false,
      error: "Signature must be a valid hex string"
    });
    return;
  }

  next();
};