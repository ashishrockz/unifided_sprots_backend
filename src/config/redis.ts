/**
 * @file    config/redis.ts
 * @desc    Redis singleton for OTP storage, caching, sessions.
 */
import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";
let client: Redis | null = null;
export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, retryStrategy: (t) => Math.min(t * 200, 5000) });
    client.on("connect", () => logger.info("✅ Redis connected"));
    client.on("error", (e) => logger.error("Redis error:", e.message));
  }
  return client;
}
export async function disconnectRedis() { if (client) { await client.quit(); client = null; } }
