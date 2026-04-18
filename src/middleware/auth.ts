/**
 * @file    middleware/auth.ts
 * @desc    JWT authentication + role-based authorization.
 *          authenticate() → verifies token, attaches user
 *          authorize(...roles) → restricts by role
 *          optionalAuth() → attaches if present, continues if not
 */
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { ERRORS } from "../constants";
import { AuthService } from "../modules/auth/auth.service";
import type { AuthRequest, JwtPayload } from "../types";

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith("Bearer ")) throw new AppError(ERRORS.AUTH.MISSING_TOKEN);
    const payload = jwt.verify(hdr.split(" ")[1], env.JWT_ACCESS_SECRET) as JwtPayload;

    // Check if token is blacklisted (revoked on logout)
    if ((payload as any).jti) {
      AuthService.isBlacklisted((payload as any).jti).then((revoked) => {
        if (revoked) return next(new AppError(ERRORS.AUTH.INVALID_TOKEN));
        req.user = payload;
        next();
      }).catch(() => {
        // Redis down — allow through (fail open to avoid blocking all requests)
        req.user = payload;
        next();
      });
      return;
    }

    // Legacy tokens without jti — allow through
    req.user = payload;
    next();
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) return next(new AppError(ERRORS.AUTH.EXPIRED_TOKEN));
    if (e instanceof jwt.JsonWebTokenError) return next(new AppError(ERRORS.AUTH.INVALID_TOKEN));
    next(e);
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError(ERRORS.AUTH.MISSING_TOKEN));
    if (!roles.includes(req.user.role)) return next(new AppError(ERRORS.AUTH.FORBIDDEN));
    next();
  };
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try { const h = req.headers.authorization; if (h?.startsWith("Bearer ")) req.user = jwt.verify(h.split(" ")[1], env.JWT_ACCESS_SECRET) as JwtPayload; }
  catch { /* anonymous */ }
  next();
}
