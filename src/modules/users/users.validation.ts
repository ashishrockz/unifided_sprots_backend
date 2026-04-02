/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/users/users.validation.ts
 * @desc    Zod schemas for user profile operations.
 * ─────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import { VISIBILITY } from "../../constants";

/** PUT /profile/me — Update own profile */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional(),
  bio: z.string().max(250).trim().optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  country: z.string().max(2).optional(),
  profileVisibility: z.enum(VISIBILITY).optional(),
});
