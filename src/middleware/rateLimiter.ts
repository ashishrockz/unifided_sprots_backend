/**
 * @file    middleware/rateLimiter.ts
 * @desc    Three rate-limit tiers: API (configurable/15min default),
 *          Auth (10/10min), OTP (3/10min).
 *          Keyed by IP+route — intentionally strict on OTP to deter
 *          SMS/email abuse.
 */
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const msg = (m: string) => ({ success: false, message: m });

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many requests"),
});

export const authLimiter = rateLimit({
  windowMs: 600_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many auth attempts — try again later"),
});

export const otpLimiter = rateLimit({
  windowMs: 600_000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("OTP rate limit exceeded — try again later"),
});
