/**
 * @file    middleware/permission.ts
 * @desc    Granular permission middleware. Defines per-role permission
 *          sets and a `permit()` factory that checks whether the
 *          authenticated user's role grants the required permission(s).
 */
import { Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ERRORS } from "../constants";
import type { AuthRequest } from "../types";

/** All permission strings used across the admin panel */
export type Permission =
  | "dashboard:read"
  | "users:read" | "users:ban" | "users:subscription"
  | "sports:read" | "sports:create" | "sports:update" | "sports:toggle" | "sports:delete"
  | "matches:read" | "matches:abandon"
  | "leaderboard:read"
  | "ads:read" | "ads:create" | "ads:update" | "ads:delete" | "ads:toggle"
  | "config:read" | "config:update" | "config:maintenance" | "config:features"
  | "admins:read" | "admins:create" | "admins:update" | "admins:deactivate"
  | "subscriptions:stats" | "subscriptions:read"
  | "plans:read" | "plans:create" | "plans:update" | "plans:delete"
  | "orders:read"
  | "analytics:read"
  | "notifications:read" | "notifications:delete" | "notifications:send"
  | "config:otp"
  | "audit:read"
  | "upload:create"
  | "*";

/** Permissions granted to each admin role */
export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  super_admin: ["*"],
  sport_admin: [
    "dashboard:read", "analytics:read",
    "sports:read", "sports:create", "sports:update", "sports:toggle", "sports:delete",
    "matches:read", "matches:abandon",
    "leaderboard:read",
    "plans:read", "subscriptions:read", "orders:read",
  ],
  content_manager: [
    "dashboard:read", "analytics:read",
    "ads:read", "ads:create", "ads:update", "ads:delete", "ads:toggle",
    "config:read", "config:update", "config:maintenance", "config:features",
    "notifications:read", "notifications:send",
    "upload:create",
  ],
  support_agent: [
    "dashboard:read",
    "users:read", "users:ban",
    "matches:read", "matches:abandon",
    "notifications:read", "notifications:delete",
  ],
};

/**
 * Check whether a role has at least one of the required permissions.
 * Supports exact match, wildcard "*", and resource-level wildcards (e.g. "sports:*").
 */
export function roleHasPermission(role: string, perms: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  if (rolePerms.includes("*")) return true;
  return perms.some(
    (p) => rolePerms.includes(p) || rolePerms.includes(`${p.split(":")[0]}:*` as Permission),
  );
}

/**
 * Middleware factory — restricts access to users whose role grants
 * at least one of the listed permissions. Must be used AFTER `authenticate`.
 */
export function permit(...perms: Permission[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError(ERRORS.AUTH.MISSING_TOKEN));
    if (!roleHasPermission(req.user.role, perms)) return next(new AppError(ERRORS.AUTH.FORBIDDEN));
    next();
  };
}
