/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/ads/ads.validation.ts
 * @desc    Zod schemas for advertisement CRUD operations.
 * ─────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import { AD_SLOTS, MEDIA_TYPES, SUB_PLANS } from "../../constants";

/** POST /admin/ads — Create advertisement */
export const createAdSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100)
    .trim(),
  slot: z.enum(AD_SLOTS, {
    errorMap: () => ({ message: `Slot must be one of: ${AD_SLOTS.join(", ")}` }),
  }),
  mediaType: z.enum(MEDIA_TYPES),
  media: z.object({
    primary: z.string().min(1, "Primary media URL is required"),
    headsImage: z.string().optional(),
    tailsImage: z.string().optional(),
    sponsorLogo: z.string().optional(),
  }),
  clickUrl: z.string().url().optional().or(z.literal("")),
  duration: z.number().int().min(0).max(120).optional(),
  targetPlans: z
    .array(z.enum(SUB_PLANS))
    .min(1, "At least one target plan required"),
  sportSlugs: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().min(0).max(1000).optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/** PUT /admin/ads/:id — Update advertisement (partial) */
export const updateAdSchema = createAdSchema.partial();
