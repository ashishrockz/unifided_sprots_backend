/**
 * @file    utils/matchLock.ts
 * @desc    Redis-backed per-match mutex + idempotency helpers.
 *          Serializes concurrent scoring writes against the same match
 *          so read-modify-write sequences in scoring.routes.ts cannot
 *          stomp on each other (e.g. two scorers tapping at once).
 */
import { randomUUID } from "crypto";
import { getRedis } from "../config/redis";
import { AppError } from "./AppError";

const LOCK_PREFIX = "match:lock:";
const IDEMP_PREFIX = "idemp:";
const DEFAULT_TTL_MS = 5_000;
const DEFAULT_WAIT_MS = 2_500;
const DEFAULT_POLL_MS = 40;

/**
 * Acquire a per-match lock, run `fn`, release. Blocks up to `waitMs`
 * waiting for the lock; throws BUSY if it can't be acquired in time.
 */
export async function withMatchLock<T>(
  matchId: string,
  fn: () => Promise<T>,
  opts: { ttlMs?: number; waitMs?: number } = {},
): Promise<T> {
  const redis = getRedis();
  const key = LOCK_PREFIX + matchId;
  const token = randomUUID();
  const ttl = opts.ttlMs ?? DEFAULT_TTL_MS;
  const deadline = Date.now() + (opts.waitMs ?? DEFAULT_WAIT_MS);

  while (true) {
    const ok = await redis.set(key, token, "PX", ttl, "NX");
    if (ok === "OK") break;
    if (Date.now() >= deadline) {
      throw new AppError({
        message: "Match is busy — another update is in progress",
        status: 409,
        code: "MATCH_BUSY",
      });
    }
    await new Promise((r) => setTimeout(r, DEFAULT_POLL_MS));
  }

  try {
    return await fn();
  } finally {
    // Only release if we still own the lock (CAS via Lua).
    const lua =
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    try {
      await redis.eval(lua, 1, key, token);
    } catch {
      /* swallow — lock will expire via TTL */
    }
  }
}

/**
 * Idempotency cache. Given a key, checks if a previous successful
 * response was cached; if so, returns it. Otherwise runs `fn`, caches
 * the result under the key for `ttlSeconds`, and returns it.
 *
 * Clients send the key via `Idempotency-Key` header (or request body).
 * A network retry replays the exact same response instead of re-applying
 * the ball twice.
 */
export async function withIdempotency<T>(
  scope: string,
  key: string | undefined,
  fn: () => Promise<T>,
  ttlSeconds = 600,
): Promise<T> {
  if (!key) return fn();
  const redis = getRedis();
  const cacheKey = `${IDEMP_PREFIX}${scope}:${key}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      /* fall through and re-run */
    }
  }
  const result = await fn();
  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", ttlSeconds);
  } catch {
    /* cache write failure is non-fatal */
  }
  return result;
}

