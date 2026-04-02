import { Router } from "express";
import { Subscription } from "./subscription.model";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { paginated, buildPage, parseQuery } from "../../utils/response";
import { MSG } from "../../constants";

export const adminSubscriptionsRoutes = Router();
adminSubscriptionsRoutes.use(authenticate, authorize("super_admin", "sport_admin"));

adminSubscriptionsRoutes.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = {};
  if (req.query.planId) q.plan = req.query.planId;
  if (req.query.status) q.status = req.query.status;
  const [data, total] = await Promise.all([
    Subscription.find(q)
      .populate("user", "username displayName avatar email mobile")
      .populate("plan", "name slug price")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Subscription.countDocuments(q),
  ]);
  paginated(res, data, buildPage(page, limit, total), MSG.LIST("Subscriptions"));
}));
