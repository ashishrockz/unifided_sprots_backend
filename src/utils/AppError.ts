/**
 * ─────────────────────────────────────────────────────────────────
 * @file    utils/AppError.ts
 * @desc    Single error class for the entire backend.
 *          Always constructed with an ErrorDef from constants/errors.ts
 *          so every error is centralized and consistent.
 *
 * @example throw new AppError(ERRORS.AUTH.INVALID_TOKEN);
 * @example throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND, { matchId });
 * ─────────────────────────────────────────────────────────────────
 */
import type { ErrorDef } from "../constants/errors";

export class AppError extends Error {
  /** HTTP status code (e.g. 401, 404, 422) */
  public readonly statusCode: number;
  /** Machine-readable error code (e.g. "AUTH_001") */
  public readonly code: string;
  /** Indicates this is an expected operational error */
  public readonly isOperational = true;
  /** Optional extra context for logging/debugging */
  public readonly details?: Record<string, unknown>;

  constructor(errorDef: ErrorDef, details?: Record<string, unknown>) {
    super(errorDef.message);
    this.statusCode = errorDef.status;
    this.code = errorDef.code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
