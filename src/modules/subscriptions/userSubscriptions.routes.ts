/**
 * @file    modules/subscriptions/userSubscriptions.routes.ts
 * @desc    User-facing subscription endpoints.
 */
import { Router } from "express";
import { Subscription } from "./subscription.model";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";
import type { AuthRequest } from "../../types";

export const userSubscriptionsRoutes = Router();
userSubscriptionsRoutes.use(authenticate);

/* ── GET /subscriptions/me — Current user's active subscription ── */
userSubscriptionsRoutes.get(
  "/me",
  asyncHandler(async (req: AuthRequest, res) => {
    const sub = await Subscription.findOne({
      user: req.user!.userId,
      status: "active",
    })
      .populate("plan", "name slug price currency interval features limits")
      .lean();

    ok(res, sub, MSG.FETCHED("Subscription"));
  }),
);
