import { Router } from "express";
import { User } from "../users/user.model";
import { Match } from "../matches/match.model";
import { Order } from "../orders/order.model";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";

export const analyticsRoutes = Router();
analyticsRoutes.use(authenticate, authorize("super_admin", "sport_admin", "content_manager", "support_agent"));

function daysAgo(d: number) { return new Date(Date.now() - d * 86400000); }

analyticsRoutes.get("/trends", permit("dashboard:read"), asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const since = daysAgo(days);
  const [usersByDay, matchesByDay] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: since }, role: "user" } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Match.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  ok(res, { usersByDay, matchesByDay }, MSG.FETCHED("Trends"));
}));

analyticsRoutes.get("/engagement", permit("dashboard:read"), asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const since = daysAgo(days);
  const [activeUsers, matchesPlayed, avgMatchesPerUser] = await Promise.all([
    User.countDocuments({ lastLoginAt: { $gte: since }, role: "user" }),
    Match.countDocuments({ createdAt: { $gte: since }, status: "completed" }),
    Match.aggregate([
      { $match: { createdAt: { $gte: since }, status: "completed" } },
      { $unwind: "$teams" }, { $unwind: "$teams.players" },
      { $group: { _id: "$teams.players.user", count: { $sum: 1 } } },
      { $group: { _id: null, avg: { $avg: "$count" } } },
    ]),
  ]);
  ok(res, { activeUsers, matchesPlayed, avgMatchesPerUser: avgMatchesPerUser[0]?.avg ?? 0 }, MSG.FETCHED("Engagement"));
}));

analyticsRoutes.get("/platform-summary", permit("dashboard:read"), asyncHandler(async (_req, res) => {
  const [totalUsers, totalMatches, completedMatches, liveMatches, avgMatchDuration] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Match.countDocuments(),
    Match.countDocuments({ status: "completed" }),
    Match.countDocuments({ status: "live" }),
    Match.aggregate([
      { $match: { status: "completed", startedAt: { $exists: true }, completedAt: { $exists: true } } },
      { $project: { duration: { $subtract: ["$completedAt", "$startedAt"] } } },
      { $group: { _id: null, avg: { $avg: "$duration" } } },
    ]),
  ]);
  ok(res, {
    totalUsers, totalMatches, completedMatches, liveMatches,
    completionRate: totalMatches > 0 ? +((completedMatches / totalMatches) * 100).toFixed(1) : 0,
    avgMatchDurationMs: avgMatchDuration[0]?.avg ?? 0,
  }, MSG.FETCHED("Platform summary"));
}));

analyticsRoutes.get("/growth", permit("dashboard:read"), asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const since = daysAgo(days);
  const prev = daysAgo(days * 2);
  const [current, previous] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: since }, role: "user" }),
    User.countDocuments({ createdAt: { $gte: prev, $lt: since }, role: "user" }),
  ]);
  const growthRate = previous > 0 ? +(((current - previous) / previous) * 100).toFixed(1) : current > 0 ? 100 : 0;
  ok(res, { current, previous, growthRate }, MSG.FETCHED("Growth"));
}));

analyticsRoutes.get("/revenue", permit("dashboard:read"), asyncHandler(async (_req, res) => {
  try {
    const [total, monthly] = await Promise.all([
      Order.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { "_id.year": -1, "_id.month": -1 } }, { $limit: 12 },
      ]),
    ]);
    ok(res, { totalRevenue: total[0]?.total ?? 0, totalOrders: total[0]?.count ?? 0, monthlyRevenue: monthly }, MSG.FETCHED("Revenue"));
  } catch {
    ok(res, { totalRevenue: 0, totalOrders: 0, monthlyRevenue: [] }, MSG.FETCHED("Revenue"));
  }
}));

analyticsRoutes.get("/match-analytics", permit("dashboard:read"), asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  const since = daysAgo(days);
  const [bySport, byStatus] = await Promise.all([
    Match.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$sportSlug", count: { $sum: 1 } } },
    ]),
    Match.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  ok(res, { bySport, byStatus }, MSG.FETCHED("Match analytics"));
}));
