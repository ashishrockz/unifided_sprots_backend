/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/admin/dashboard.routes.ts
 * @desc    Single optimized endpoint returning all dashboard stats
 *          in one request instead of 4 separate API calls.
 *          Uses Promise.all for parallel DB queries — fast response.
 * ─────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import { User } from "../users/user.model";
import { Match } from "../matches/match.model";
import { SportType } from "../sports/sportType.model";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";

export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate, authorize("super_admin", "sport_admin", "content_manager", "support_agent"));

/**
 * GET /admin/dashboard/stats
 * @desc    Returns counts for: total users, total matches, live matches,
 *          active sports, completed matches, abandoned matches, recent
 *          matches (last 5), and recent users (last 5). All queries
 *          run in parallel via Promise.all for max performance.
 * @access  Admin (any role)
 */
dashboardRoutes.get(
  "/dashboard/stats",
  permit("dashboard:read"),
  asyncHandler(async (_req, res) => {
    const [
      totalUsers,
      totalMatches,
      liveMatches,
      completedMatches,
      abandonedMatches,
      activeSports,
      recentMatches,
      recentUsers,
      subscriptionDistribution,
      expiringSoon,
      totalAdmins,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Match.countDocuments(),
      Match.countDocuments({ status: "live" }),
      Match.countDocuments({ status: "completed" }),
      Match.countDocuments({ status: "abandoned" }),
      SportType.countDocuments({ isActive: true }),
      Match.find()
        .populate("creator", "username displayName")
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title sportSlug status creator createdAt startedAt completedAt result")
        .lean(),
      User.find({ role: "user" })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("username displayName email avatar createdAt isActive subscription")
        .lean(),
      User.aggregate([
        { $match: { role: "user" } },
        { $group: { _id: "$subscription.plan", count: { $sum: 1 } } },
      ]),
      User.countDocuments({
        role: "user",
        "subscription.expiresAt": {
          $lte: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          $gte: new Date(),
        },
      }),
      User.countDocuments({ role: "admin" }),
    ]);

    ok(
      res,
      {
        counts: {
          totalUsers,
          totalMatches,
          liveMatches,
          completedMatches,
          abandonedMatches,
          activeSports,
          totalAdmins,
        },
        recentMatches,
        recentUsers,
        subscriptionStats: {
          distribution: subscriptionDistribution,
          expiringSoon,
        },
      },
      MSG.FETCHED("Dashboard stats"),
    );
  }),
);
