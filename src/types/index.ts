/**
 * ─────────────────────────────────────────────────────────────────
 * @file    types/index.ts
 * @desc    Global TypeScript interfaces used across the backend.
 * ─────────────────────────────────────────────────────────────────
 */
import { Request } from "express";

/** Decoded JWT payload attached to authenticated requests */
export interface JwtPayload {
  readonly userId: string;
  readonly role: string;
}

/** Express Request extended with authenticated user */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Pagination metadata for list responses */
export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

/** JWT token pair issued on login/refresh */
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}
