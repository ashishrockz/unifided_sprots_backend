import { Router } from "express";
import { User } from "../users/user.model";
import { Match } from "../matches/match.model";
import { SportType } from "../sports/sportType.model";
import { SystemConfig } from "./systemConfig.model";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";

export const superAdminRoutes = Router();
superAdminRoutes.use(authenticate, authorize("super_admin"));

/** GET /superadmin/dashboard — Extended dashboard for super admins */
superAdminRoutes.get("/dashboard", asyncHandler(async (_req, res) => {
  const [
    totalUsers, totalAdmins, totalMatches, liveMatches,
    completedMatches, abandonedMatches, activeSports,
    recentUsers, recentMatches,
    adminsByRole, configCount,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "admin" }),
    Match.countDocuments(),
    Match.countDocuments({ status: "live" }),
    Match.countDocuments({ status: "completed" }),
    Match.countDocuments({ status: "abandoned" }),
    SportType.countDocuments({ isActive: true }),
    User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5).select("username displayName email avatar createdAt isActive").lean(),
    Match.find().populate("creator", "username displayName").sort({ createdAt: -1 }).limit(5).select("title sportSlug status creator createdAt completedAt result").lean(),
    User.aggregate([{ $match: { role: "admin" } }, { $group: { _id: "$adminRole", count: { $sum: 1 } } }]),
    SystemConfig.countDocuments(),
  ]);
  ok(res, {
    counts: { totalUsers, totalAdmins, totalMatches, liveMatches, completedMatches, abandonedMatches, activeSports, configCount },
    recentUsers, recentMatches, adminsByRole,
  }, MSG.FETCHED("SuperAdmin dashboard"));
}));
