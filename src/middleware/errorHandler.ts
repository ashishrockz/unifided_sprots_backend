/**
 * @file    middleware/errorHandler.ts
 * @desc    Global error handler. Catches AppError, ZodError, Mongoose
 *          validation/cast/duplicate errors and returns clean JSON.
 */
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";
import { ERRORS } from "../constants";
import { logger } from "../utils/logger";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): Response {
  if (err instanceof AppError)
    return res.status(err.statusCode).json({ success: false, message: err.message, code: err.code, ...(err.details && { details: err.details }) });

  if (err instanceof ZodError)
    return res.status(400).json({ success: false, message: ERRORS.VALIDATION.INVALID_INPUT.message, code: ERRORS.VALIDATION.INVALID_INPUT.code, errors: err.errors.map(e => ({ field: e.path.join("."), message: e.message })) });

  if ((err as any).code === 11000) {
    const keys = Object.keys((err as any).keyValue || {}).join(", ");
    return res.status(409).json({ success: false, message: "Duplicate: " + keys });
  }

  if (err instanceof mongoose.Error.ValidationError)
    return res.status(400).json({ success: false, message: "Validation failed", errors: Object.values(err.errors).map(e => ({ field: e.path, message: e.message })) });

  if (err instanceof mongoose.Error.CastError)
    return res.status(400).json({ success: false, message: ERRORS.VALIDATION.INVALID_OBJECT_ID.message });

  logger.error("Unhandled:", err);
  return res.status(500).json({ success: false, message: process.env.NODE_ENV === "production" ? "Internal error" : err.message });
}
