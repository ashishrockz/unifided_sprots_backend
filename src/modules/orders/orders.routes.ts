import { Router } from "express";
import { Order } from "./order.model";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, paginated, buildPage, parseQuery } from "../../utils/response";
import { MSG } from "../../constants";

export const adminOrdersRoutes = Router();
adminOrdersRoutes.use(authenticate, authorize("super_admin", "sport_admin"));

adminOrdersRoutes.get("/", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = {};
  if (req.query.type) q.type = req.query.type;
  if (req.query.status) q.status = req.query.status;
  const [data, total] = await Promise.all([
    Order.find(q)
      .populate("user", "username displayName avatar")
      .populate("plan", "name slug price")
      .populate("matchPack", "name matchCount price")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(q),
  ]);
  paginated(res, data, buildPage(page, limit, total), MSG.LIST("Orders"));
}));

export const adminRevenueRoutes = Router();
adminRevenueRoutes.use(authenticate, authorize("super_admin"));

adminRevenueRoutes.get("/stats", asyncHandler(async (_req, res) => {
  const [total, monthly, planBreakdown] = await Promise.all([
    Order.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } }, { $limit: 12 },
    ]),
    Order.aggregate([
      { $match: { status: "paid", type: "subscription" } },
      { $lookup: { from: "plans", localField: "plan", foreignField: "_id", as: "planDoc" } },
      { $unwind: { path: "$planDoc", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$planDoc.slug", planName: { $first: "$planDoc.name" }, count: { $sum: 1 } } },
    ]),
  ]);
  ok(res, {
    totalRevenue: total[0]?.total ?? 0,
    totalOrders: total[0]?.count ?? 0,
    monthlyRevenue: monthly,
    activePlanBreakdown: planBreakdown.map((p: any) => ({ planName: p.planName ?? "unknown", planSlug: p._id ?? "unknown", count: p.count })),
  }, MSG.FETCHED("Revenue stats"));
}));
