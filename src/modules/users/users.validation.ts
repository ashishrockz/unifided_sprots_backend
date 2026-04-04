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
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore").optional(),
  email: z.string().email().optional(),
  mobile: z.string().min(7).max(20).optional(),
  bio: z.string().max(250).trim().optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  country: z.string().max(5).optional(),
  profileVisibility: z.enum(VISIBILITY).optional(),
});
