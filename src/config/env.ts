/**
 * @file    config/env.ts
 * @desc    Zod-validated environment variables. Fails fast on startup
 *          if any required variable is missing or invalid.
 */
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const schema = z.object({
  PORT:               z.coerce.number().default(5000),
  NODE_ENV:           z.enum(["development", "staging", "production"]).default("development"),
  MONGO_URI:          z.string().min(1, "MONGO_URI required"),
  REDIS_URL:          z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET:  z.string().min(16, "JWT_ACCESS_SECRET must be ≥16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be ≥16 chars"),
  JWT_ACCESS_EXPIRY:  z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),
  OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
  CORS_ORIGINS:       z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX:     z.coerce.number().default(100),
  AWS_ACCESS_KEY_ID:     z.string().default(""),
  AWS_SECRET_ACCESS_KEY: z.string().default(""),
  AWS_REGION:            z.string().default("ap-south-1"),
  AWS_S3_BUCKET:         z.string().default("unified-sports-uploads"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) { console.error("❌ Invalid env:", parsed.error.flatten().fieldErrors); process.exit(1); }
export const env = parsed.data;
