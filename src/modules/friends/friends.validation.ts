/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/friends/friends.validation.ts
 * @desc    Zod schemas for friend request operations.
 * ─────────────────────────────────────────────────────────────────
 */

import { z } from "zod";

/** POST /friends/request — Send a friend request */
export const sendRequestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
});
