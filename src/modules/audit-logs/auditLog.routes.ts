import { Router } from "express";
import { AuditLog } from "./auditLog.model";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { asyncHandler } from "../../utils/asyncHandler";
import { paginated, buildPage, parseQuery } from "../../utils/response";
import { MSG } from "../../constants";

export const auditLogRoutes = Router();
auditLogRoutes.use(authenticate, authorize("super_admin"));

auditLogRoutes.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = {};
  if (req.query.action) q.action = req.query.action;
  if (req.query.actorId) q.actor = req.query.actorId;
  if (req.query.targetModel) q.targetModel = req.query.targetModel;
  const [data, total] = await Promise.all([
    AuditLog.find(q).populate("actor", "username displayName email adminRole").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(q),
  ]);
  paginated(res, data, buildPage(page, limit, total), MSG.LIST("Audit logs"));
}));
