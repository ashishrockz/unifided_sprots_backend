import { Router } from "express";
import { Notification } from "../notifications/notification.model";
import { NotificationService } from "../notifications/notification.service";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, paginated, noContent, buildPage, parseQuery } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import type { AuthRequest } from "../../types";

export const adminNotificationRoutes = Router();
adminNotificationRoutes.use(authenticate, authorize("super_admin", "support_agent", "content_manager"));

/** GET / — List only admin-sent notifications */
adminNotificationRoutes.get("/", permit("notifications:read"), asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = { source: "admin" };
  if (req.query.type) q.type = req.query.type;
  if (req.query.read === "true") q.isRead = true;
  if (req.query.read === "false") q.isRead = false;
  if (req.query.userId) q.user = req.query.userId;
  const [data, total] = await Promise.all([
    Notification.find(q)
      .populate("user", "username displayName avatar")
      .populate("sentBy", "username displayName")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(q),
  ]);
  paginated(res, data, buildPage(page, limit, total), MSG.LIST("Notifications"));
}));

/** GET /stats — Stats for admin-sent notifications only */
adminNotificationRoutes.get("/stats", permit("notifications:read"), asyncHandler(async (_req, res) => {
  const q = { source: "admin" as const };
  const [total, unread, byType] = await Promise.all([
    Notification.countDocuments(q),
    Notification.countDocuments({ ...q, isRead: false }),
    Notification.aggregate([
      { $match: q },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
  ]);
  ok(res, { total, unread, byType }, MSG.FETCHED("Notification stats"));
}));

/**
 * POST /send — Send notification from admin panel
 * Body: { title, body, type, data?, target: "all" | "users", userIds?: string[] }
 */
adminNotificationRoutes.post("/send", permit("notifications:send"), asyncHandler(async (req: AuthRequest, res) => {
  const { title, body, type, data, target, userIds } = req.body;

  if (!title || !body || !type) {
    throw new AppError(ERRORS.VALIDATION.MISSING_FIELD, { fields: ["title", "body", "type"] });
  }
  if (!target || !["all", "users"].includes(target)) {
    throw new AppError(ERRORS.VALIDATION.INVALID_INPUT, { message: "target must be 'all' or 'users'" });
  }

  const adminFields = { sentBy: req.user!.userId, source: "admin" as const };

  let notifs: any;
  if (target === "all") {
    notifs = await NotificationService.sendToAll({ title, body, type, data, ...adminFields });
  } else {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError(ERRORS.VALIDATION.MISSING_FIELD, { fields: ["userIds"] });
    }
    notifs = await NotificationService.sendToMany(userIds, { title, body, type, data, ...adminFields });
  }

  created(res, { count: notifs.length }, MSG.CREATED("Notification"));
}));

/** DELETE /:id — Delete a notification */
adminNotificationRoutes.delete("/:id", permit("notifications:delete"), asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  noContent(res);
}));
