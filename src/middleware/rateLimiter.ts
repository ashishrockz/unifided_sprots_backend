/**
 * @file    middleware/rateLimiter.ts
 * @desc    Three rate-limit tiers: API (100/15min), Auth (10/10min), OTP (3/10min).
 */
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
const msg = (m: string) => ({ success: false, message: m });
export const apiLimiter  = rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, message: msg("Too many requests") });
export const authLimiter = rateLimit({ windowMs: 600_000, max: 100, message: msg("Too many auth attempts") });
export const otpLimiter  = rateLimit({ windowMs: 600_000, max: 100, message: msg("OTP rate limit exceeded") });
