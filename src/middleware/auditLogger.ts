/**
 * @file    middleware/auditLogger.ts
 * @desc    Express middleware that logs admin write operations to the
 *          AuditLog collection automatically. Mount after `authenticate`
 *          + `authorize`/`permit` on any admin router — it fires on every
 *          POST/PUT/PATCH/DELETE and captures who did what to which
 *          resource, from which IP.
 *
 *          Read requests (GET/HEAD/OPTIONS) are not logged.
 */
import type { Request, Response, NextFunction } from "express";
import { AuditLog } from "../modules/audit-logs/auditLog.model";
import { logger } from "../utils/logger";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function deriveAction(method: string, path: string): string {
  const verb =
    method === "POST"   ? "create" :
    method === "PUT"    ? "update" :
    method === "PATCH"  ? "update" :
    method === "DELETE" ? "delete" : method.toLowerCase();

  // Extract the resource segment — e.g. "/admin/users/123/ban" → "users.ban"
  const parts = path
    .replace(/^\/api\/v1\/?/, "")
    .replace(/^admin\/?/, "")
    .split("/")
    .filter(Boolean);

  const segments: string[] = [];
  for (const p of parts) {
    if (/^[0-9a-f]{24}$/i.test(p)) continue; // skip ObjectId params
    segments.push(p);
  }
  const resource = segments.join(".") || "unknown";
  return `${verb}:${resource}`;
}

function deriveTarget(path: string): { model: string; id?: string } {
  const parts = path.split("/").filter(Boolean);
  let model = "unknown";
  let id: string | undefined;
  for (let i = 0; i < parts.length; i++) {
    if (/^[0-9a-f]{24}$/i.test(parts[i])) {
      model = parts[i - 1] || model;
      id = parts[i];
    }
  }
  if (id === undefined) {
    model = parts[parts.length - 1] || model;
  }
  return { model, id };
}

export function auditLogger(req: Request, _res: Response, next: NextFunction) {
  if (!WRITE_METHODS.has(req.method)) return next();

  const user = (req as any).user;
  if (!user?.userId) return next();

  // Fire-and-forget — never block the response on a log write.
  const { model, id } = deriveTarget(req.originalUrl);
  AuditLog.create({
    actor: user.userId,
    actorRole: user.role ?? user.adminRole ?? "admin",
    action: deriveAction(req.method, req.originalUrl),
    targetModel: model,
    targetId: id,
    details: {
      method: req.method,
      path: req.originalUrl,
      body: sanitizeBody(req.body),
    },
    ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  }).catch((err) => logger.error("[audit] write failed:", err));

  next();
}

function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") return body;
  const safe = { ...body };
  // Scrub password/secrets from the log.
  for (const key of ["password", "newPassword", "secret", "token", "refreshToken"]) {
    if (key in safe) safe[key] = "[REDACTED]";
  }
  return safe;
}
