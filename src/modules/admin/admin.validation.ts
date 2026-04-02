/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/admin/admin.validation.ts
 * @desc    Zod schemas for admin operations — config updates,
 *          maintenance mode, user management actions.
 * ─────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import { CONFIG_CATS, ADMIN_ROLES, SUB_PLANS } from "../../constants";

/** PUT /admin/config — Bulk update system configs */
export const updateConfigSchema = z.object({
  configs: z
    .array(
      z.object({
        key: z.string().min(1, "Config key is required"),
        value: z.any(),
        category: z.enum(CONFIG_CATS).optional(),
        description: z.string().max(200).optional(),
      })
    )
    .min(1, "At least one config entry required"),
});

/** POST /admin/config/maintenance — Toggle maintenance mode */
export const maintenanceSchema = z.object({
  active: z.boolean(),
  message: z.string().max(500).optional(),
});

/** PUT /admin/users/:id/ban or /unban — No body needed but validate params */
export const userIdParamSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

/** PUT /admin/matches/:id/abandon */
export const adminAbandonSchema = z.object({
  reason: z
    .string()
    .max(200, "Reason must be under 200 characters")
    .optional()
    .default("Admin action"),
});

/** PUT /admin/config/features/:key */
export const featureToggleSchema = z.object({
  value: z.boolean(),
});

/** POST /admin/admins — Create admin account */
export const createAdminSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  displayName: z.string().max(50).optional(),
  adminRole: z.enum(ADMIN_ROLES),
});

/** PUT /admin/admins/:id — Update admin role */
export const updateAdminSchema = z.object({
  adminRole: z.enum(ADMIN_ROLES),
});

/** PUT /admin/users/:id/subscription — Update user subscription */
export const updateSubscriptionSchema = z.object({
  plan: z.enum(SUB_PLANS),
  expiresAt: z.string().datetime().optional().nullable(),
});
