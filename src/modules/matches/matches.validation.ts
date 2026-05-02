/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/matches/matches.validation.ts
 * @desc    Zod validation schemas for all match-related endpoints.
 *          Imported by routes and validated via the validate() middleware.
 * ─────────────────────────────────────────────────────────────────
 */

import { z } from "zod";
import {
  PLAYER_ROLES,
  TOSS_CALLS,
  TOSS_DECISIONS,
  WICKET_TYPES,
  EXTRA_TYPES,
} from "../../constants";

/** POST /sports/:slug/matches — Create a new match */
export const createMatchSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be at most 100 characters")
    .trim(),
  team1Name: z.string().max(30).trim().optional(),
  team2Name: z.string().max(30).trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  matchConfig: z.object({
    totalOvers: z.number().int().min(1).max(50).optional(),
    playersPerTeam: z.number().int().min(1).max(15).optional(),
    wideReBall: z.boolean().optional(),
    noBallReBall: z.boolean().optional(),
    noBallRuns: z.number().int().min(0).max(2).optional(),
    wideRuns: z.number().int().min(0).max(2).optional(),
    ballsPerOver: z.number().int().min(4).max(8).optional(),
    freeHitOnNoBall: z.boolean().optional(),
  }).passthrough(),
});

/** POST /matches/:matchId/players — Add players from friends list */
export const addPlayersSchema = z.object({
  teamIndex: z.number().int().min(0).max(1),
  playerIds: z
    .array(z.string().min(1))
    .min(1, "At least one player ID required")
    .max(15),
});

/** POST /matches/:matchId/players/guest — Add a guest player */
export const addGuestSchema = z.object({
  teamIndex: z.number().int().min(0).max(1),
  name: z
    .string()
    .min(1, "Guest name required")
    .max(50)
    .trim(),
});

/** PUT /matches/:matchId/teams/:teamIndex/captain */
export const setCaptainSchema = z.object({
  playerId: z.string().min(1, "Player ID required"),
});

/** PUT /matches/:matchId/teams/:teamIndex/wicketkeeper */
export const setKeeperSchema = z.object({
  playerId: z.string().min(1, "Player ID required"),
});

/** PUT /matches/:matchId/players/:playerId/role */
export const setRoleSchema = z.object({
  role: z.enum(PLAYER_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${PLAYER_ROLES.join(", ")}` }),
  }),
});

/** PUT /matches/:matchId/teams/:teamIndex/batting-order */
export const battingOrderSchema = z.object({
  order: z
    .array(z.string().min(1))
    .min(1, "At least one player in order"),
});

/** POST /matches/:matchId/toss */
export const performTossSchema = z.object({
  calledBy: z.string().min(1, "calledBy is required"),
  call: z.enum(TOSS_CALLS, {
    errorMap: () => ({ message: "Call must be 'heads' or 'tails'" }),
  }),
});

/** POST /matches/:matchId/toss/decision */
export const tossDecisionSchema = z.object({
  decision: z.enum(TOSS_DECISIONS, {
    errorMap: () => ({ message: "Decision must be 'bat' or 'bowl'" }),
  }),
});

/** POST /matches/:matchId/score — Record a ball */
export const recordBallSchema = z.object({
  batsmanId: z.string().min(1, "batsmanId required"),
  bowlerId: z.string().min(1, "bowlerId required"),
  runs: z.number().int().min(0).max(7),
  extras: z
    .object({
      type: z.enum(EXTRA_TYPES),
      runs: z.number().int().min(0).max(5),
    })
    .optional(),
  isWicket: z.boolean().optional().default(false),
  wicket: z
    .object({
      type: z.enum(WICKET_TYPES),
      dismissedBatsman: z.string().min(1),
      fielder: z.string().optional(),
      isKeeperCatch: z.boolean().optional(),
    })
    .optional(),
  shotType: z.string().max(30).optional(),
  nextBatsmanId: z.string().min(1).optional(),
});

/** POST /matches/:matchId/innings/setup — Select opening pair + bowler */
export const inningsSetupSchema = z.object({
  openerId1: z.string().min(1, "Striker is required"),
  openerId2: z.string().min(1, "Non-striker is required"),
  bowlerId: z.string().min(1).optional(),
});

/** POST /matches/:matchId/abandon */
export const abandonSchema = z.object({
  reason: z.string().max(200).optional(),
});

/** POST /matches/:matchId/rematch — Clone a finished match into a fresh one */
export const rematchSchema = z.object({
  mode: z.enum(["same_teams", "swap_sides", "shuffle_teams", "new_match"], {
    errorMap: () => ({ message: "Mode must be one of: same_teams, swap_sides, shuffle_teams, new_match" }),
  }),
  team1Name: z.string().min(1).max(30).trim().optional(),
  team2Name: z.string().min(1).max(30).trim().optional(),
});
