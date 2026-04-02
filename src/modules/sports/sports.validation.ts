/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/sports/sports.validation.ts
 * @desc    Zod schemas for sport type CRUD operations.
 * ─────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import { SCORING_TYPES } from "../../constants";

const optionalUrl = z.string().url().optional().or(z.literal(""));

/** Base shape — shared between create and update */
const baseSportFields = {
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only")
    .trim(),
  scoringType: z.enum(SCORING_TYPES, {
    errorMap: () => ({ message: `Scoring type must be: ${SCORING_TYPES.join(", ")}` }),
  }),
  minPlayersPerTeam: z.number().int().min(1).max(15),
  maxPlayersPerTeam: z.number().int().min(1).max(15),
  rules: z.record(z.any()).optional().default({}),
  uiConfig: z.record(z.any()).optional(),
  icon: optionalUrl,
  logo: optionalUrl,
  splashImage: optionalUrl,
  splashVideo: optionalUrl,
};

/** POST /admin/sports — Create sport type */
export const createSportSchema = z.object(baseSportFields).superRefine((data, ctx) => {
  if (data.maxPlayersPerTeam < data.minPlayersPerTeam) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "maxPlayersPerTeam must be ≥ minPlayersPerTeam",
      path: ["maxPlayersPerTeam"],
    });
  }
});

/** PUT /admin/sports/:id — Update sport type (partial, passthrough unknown fields) */
export const updateSportSchema = z.object(baseSportFields).partial().passthrough();
