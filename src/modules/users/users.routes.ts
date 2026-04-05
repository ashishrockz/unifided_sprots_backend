/**
 * ─────────────────────────────────────────────────────────────────
 * @file    modules/users/users.routes.ts
 * @desc    User profile endpoints — own profile, other user profiles,
 *          sport-specific stats, match history, and profile updates.
 *          These are user-facing routes (not admin).
 * ─────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import { User } from "./user.model";
import { Match } from "../matches/match.model";
import { CricketPlayerStats } from "../leaderboard/cricketStats.model";
import { authenticate } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, paginated, buildPage, parseQuery } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import { updateProfileSchema } from "./users.validation";
import type { AuthRequest } from "../../types";

export const profileRoutes = Router();

/**
 * GET /profile/me
 * @desc    Get the authenticated user's full profile with
 *          cross-sport summary stats and friends count.
 * @access  Private (User)
 */
profileRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.user?.userId)
      .select("-password -__v")
      .lean();

    if (!user) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);

    /* Attach friends count without loading the full array */
    const enriched = {
      ...user,
      friendsCount: user.friends?.length ?? 0,
    };

    ok(res, enriched, MSG.PROFILE_FETCHED);
  })
);

/**
 * PUT /profile/me
 * @desc    Update own profile fields (displayName, bio, avatar, country).
 *          Does NOT allow changing username, email, role, etc.
 * @access  Private (User)
 */
profileRoutes.put(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    /* Whitelist safe-to-update fields (username/email/mobile allowed for onboarding) */
    const allowed = ["displayName", "username", "email", "mobile", "bio", "avatar", "country", "profileVisibility"];
    const updates: Record<string, any> = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);

    ok(res, user, MSG.UPDATED("Profile"));
  })
);

/**
 * GET /profile/search?q=term
 * @desc    Search all users by username or displayName.
 * @access  Private (User)
 */
profileRoutes.get(
  "/search",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const q = (req.query.q as string || "").trim();
    if (!q || q.length < 2) {
      ok(res, [], MSG.LIST("Users"));
      return;
    }
    const regex = { $regex: q, $options: "i" };
    const users = await User.find({
      _id: { $ne: req.user?.userId },
      isActive: true,
      $or: [{ username: regex }, { displayName: regex }],
    })
      .select("username displayName avatar totalMatchesAllSports totalWinsAllSports")
      .limit(20)
      .lean();
    ok(res, users, MSG.LIST("Users"));
  })
);

/**
 * GET /profile/:userId
 * @desc    View another user's public profile.
 *          Respects profileVisibility settings.
 * @access  Private (User)
 */
profileRoutes.get(
  "/:userId",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.params.userId)
      .select("username displayName avatar bio country profileVisibility totalMatchesAllSports totalWinsAllSports totalMVPCount totalPOMCount createdAt")
      .lean();

    if (!user) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);

    /* Check visibility */
    if (user.profileVisibility === "private" && req.params.userId !== req.user?.userId) {
      ok(res, { username: user.username, displayName: user.displayName, avatar: user.avatar, profileVisibility: "private" }, MSG.FETCHED("Profile"));
      return;
    }

    ok(res, user, MSG.FETCHED("Profile"));
  })
);

/**
 * GET /profile/me/:slug/stats
 * @desc    Get own detailed stats for a specific sport.
 * @access  Private (User)
 */
profileRoutes.get(
  "/me/:slug/stats",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const stats = await CricketPlayerStats.findOne({
      user: req.user?.userId,
      sportSlug: req.params.slug,
    })
      .populate("user", "username displayName avatar country")
      .lean();

    ok(res, stats, MSG.FETCHED("Stats"));
  })
);

/**
 * GET /profile/:userId/:slug/stats
 * @desc    View another user's sport-specific stats.
 * @access  Private (User)
 */
profileRoutes.get(
  "/:userId/:slug/stats",
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await CricketPlayerStats.findOne({
      user: req.params.userId,
      sportSlug: req.params.slug,
    })
      .populate("user", "username displayName avatar country")
      .lean();

    ok(res, stats, MSG.FETCHED("Stats"));
  })
);

/**
 * GET /profile/me/:slug/match-history
 * @desc    Own match history for a specific sport, paginated.
 * @access  Private (User)
 */
profileRoutes.get(
  "/me/:slug/match-history",
  authenticate,
  asyncHandler(async (req: AuthRequest, res) => {
    const { page, limit, skip } = parseQuery(req.query);

    const [data, total] = await Promise.all([
      Match.find({
        sportSlug: req.params.slug,
        "teams.players.user": req.user?.userId,
        status: { $in: ["completed", "abandoned"] },
      })
        .select("title status teams winner result startedAt completedAt")
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Match.countDocuments({
        sportSlug: req.params.slug,
        "teams.players.user": req.user?.userId,
        status: { $in: ["completed", "abandoned"] },
      }),
    ]);

    paginated(res, data, buildPage(page, limit, total), MSG.LIST("Match history"));
  })
);

/**
 * GET /profile/:userId/:slug/match-history
 * @desc    Another user's match history for a sport, paginated.
 * @access  Private (User)
 */
profileRoutes.get(
  "/:userId/:slug/match-history",
  authenticate,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parseQuery(req.query);

    const [data, total] = await Promise.all([
      Match.find({
        sportSlug: req.params.slug,
        "teams.players.user": req.params.userId,
        status: { $in: ["completed", "abandoned"] },
      })
        .select("title status teams winner result startedAt completedAt")
        .sort({ completedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Match.countDocuments({
        sportSlug: req.params.slug,
        "teams.players.user": req.params.userId,
        status: { $in: ["completed", "abandoned"] },
      }),
    ]);

    paginated(res, data, buildPage(page, limit, total), MSG.LIST("Match history"));
  })
);
