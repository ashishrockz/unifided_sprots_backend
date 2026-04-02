/**
 * @file    modules/admin/admin.routes.ts
 * @desc    Admin panel routes — config, user management, match management,
 *          subscription updates. Each route has granular permission checks.
 */
import { Router } from "express";
import { SystemConfig } from "./systemConfig.model";
import { User } from "../users/user.model";
import { Match } from "../matches/match.model";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, paginated, buildPage, parseQuery } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import { emitToMatch } from "../../socket";
import { SOCKET_EVENTS } from "../../constants";
import {
  updateConfigSchema,
  adminAbandonSchema,
  featureToggleSchema,
  updateSubscriptionSchema,
} from "./admin.validation";

export const adminRoutes = Router();
adminRoutes.use(authenticate, authorize("super_admin", "sport_admin", "content_manager", "support_agent"));

/* ═══════ CONFIG (feature flags + generic key-value settings) ═══════ */
adminRoutes.get("/config", permit("config:read"), asyncHandler(async (_, res) => ok(res, await SystemConfig.find().lean(), MSG.LIST("Configs"))));
adminRoutes.put("/config", permit("config:update"), validate(updateConfigSchema), asyncHandler(async (req, res) => {
  for (const c of req.body.configs ?? []) {
    await SystemConfig.findOneAndUpdate({ key: c.key }, c, { upsert: true, new: true });
  }
  ok(res, null, MSG.CONFIG_UPDATED);
}));
adminRoutes.get("/config/features", permit("config:features"), asyncHandler(async (_, res) => ok(res, await SystemConfig.find({ category: "features" }).lean(), MSG.LIST("Features"))));
adminRoutes.put("/config/features/:key", permit("config:features"), validate(featureToggleSchema), asyncHandler(async (req, res) => {
  const c = await SystemConfig.findOneAndUpdate({ key: req.params.key, category: "features" }, { value: req.body.value }, { upsert: true, new: true });
  ok(res, c, MSG.CONFIG_UPDATED);
}));

/* ═══════ USERS ═══════ */
adminRoutes.get("/users", permit("users:read"), asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = {};
  if (req.query.search) q.$or = [{ username: { $regex: req.query.search, $options: "i" } }, { email: { $regex: req.query.search, $options: "i" } }];
  const [d, t] = await Promise.all([User.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(q)]);
  paginated(res, d, buildPage(page, limit, t), MSG.LIST("Users"));
}));
adminRoutes.get("/users/:id", permit("users:read"), asyncHandler(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
  ok(res, u, MSG.FETCHED("User"));
}));
adminRoutes.put("/users/:id/ban", permit("users:ban"), asyncHandler(async (req, res) => ok(res, await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }), MSG.USER_BANNED)));
adminRoutes.put("/users/:id/unban", permit("users:ban"), asyncHandler(async (req, res) => ok(res, await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }), MSG.USER_UNBANNED)));
/* Aliases for admin panel compatibility */
adminRoutes.put("/users/:id/activate", permit("users:ban"), asyncHandler(async (req, res) => ok(res, await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }), MSG.USER_UNBANNED)));
adminRoutes.put("/users/:id/deactivate", permit("users:ban"), asyncHandler(async (req, res) => ok(res, await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }), MSG.USER_BANNED)));

/* ═══════ BULK ACTION ═══════ */
adminRoutes.put("/users/bulk-action", permit("users:ban"), asyncHandler(async (req, res) => {
  const { userIds, action } = req.body;
  if (!userIds?.length) throw new AppError(ERRORS.VALIDATION.MISSING_FIELD);
  const update = action === "ban" || action === "deactivate" ? { isActive: false } : action === "unban" || action === "activate" ? { isActive: true } : null;
  if (!update) throw new AppError(ERRORS.VALIDATION.INVALID_INPUT);
  await User.updateMany({ _id: { $in: userIds } }, update);
  ok(res, null, `Bulk ${action} completed for ${userIds.length} users`);
}));

/* ═══════ EXPORT ═══════ */
adminRoutes.get("/users/export", permit("users:read"), asyncHandler(async (req, res) => {
  const q: any = { role: "user" };
  if (req.query.status === "active") q.isActive = true;
  if (req.query.status === "inactive") q.isActive = false;
  const users = await User.find(q).select("username email mobile displayName isActive subscription createdAt lastLoginAt").lean();
  const format = req.query.format || "json";
  if (format === "csv") {
    const header = "username,email,mobile,displayName,isActive,plan,createdAt\n";
    const rows = users.map((u: any) => `${u.username},${u.email || ""},${u.mobile || ""},${u.displayName || ""},${u.isActive},${u.subscription?.plan || "free"},${u.createdAt}`).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    return res.send(header + rows);
  }
  ok(res, users, MSG.LIST("Users export"));
}));

/* ═══════ SUBSCRIPTIONS ═══════ */
adminRoutes.put("/users/:id/subscription", permit("users:subscription"), validate(updateSubscriptionSchema), asyncHandler(async (req, res) => {
  const { plan, expiresAt } = req.body;
  const u = await User.findByIdAndUpdate(
    req.params.id,
    { subscription: { plan, expiresAt: expiresAt ? new Date(expiresAt) : undefined } },
    { new: true },
  );
  if (!u) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
  ok(res, u, MSG.SUBSCRIPTION_UPDATED);
}));

/* ═══════ MATCHES ═══════ */
adminRoutes.get("/matches", permit("matches:read"), asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = {};
  if (req.query.status) q.status = req.query.status;
  const [d, t] = await Promise.all([
    Match.find(q).populate("creator", "username displayName").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Match.countDocuments(q),
  ]);
  paginated(res, d, buildPage(page, limit, t), MSG.LIST("Matches"));
}));
adminRoutes.get("/matches/:id", permit("matches:read"), asyncHandler(async (req, res) => {
  const m = await Match.findById(req.params.id)
    .populate("creator", "username displayName avatar")
    .populate("teams.players.user", "username displayName avatar");
  if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
  ok(res, m, MSG.FETCHED("Match"));
}));
adminRoutes.put("/matches/:id/abandon", permit("matches:abandon"), validate(adminAbandonSchema), asyncHandler(async (req, res) => {
  const m = await Match.findById(req.params.id);
  if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
  if (["completed", "abandoned"].includes(m.status)) throw new AppError(ERRORS.BUSINESS.MATCH_ALREADY_ENDED);
  m.status = "abandoned";
  m.abandonedBy = "admin";
  m.abandonReason = req.body.reason || "Admin action";
  m.completedAt = new Date();
  await m.save();
  emitToMatch(m._id.toString(), SOCKET_EVENTS.MATCH_ABANDONED, { matchId: m._id, reason: m.abandonReason });
  ok(res, m, MSG.MATCH_ABANDONED);
}));
