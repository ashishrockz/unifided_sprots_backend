/**
 * @file    modules/orders/userOrders.routes.ts
 * @desc    User-facing order endpoints: create subscription/match-pack orders
 *          and verify payments. Ready for Razorpay integration.
 */
import { Router } from "express";
import crypto from "crypto";
import { Order } from "./order.model";
import { Plan } from "../plans/plan.model";
import { MatchPack } from "../plans/matchPack.model";
import { Subscription } from "../subscriptions/subscription.model";
import { User } from "../users/user.model";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import type { AuthRequest } from "../../types";

export const userOrdersRoutes = Router();
userOrdersRoutes.use(authenticate);

/* ── POST /orders/subscription — Create order for a plan ──────── */
userOrdersRoutes.post(
  "/subscription",
  asyncHandler(async (req: AuthRequest, res) => {
    const { planId } = req.body;
    if (!planId) throw new AppError(ERRORS.VALIDATION.MISSING_FIELD);

    const plan = await Plan.findById(planId).lean();
    if (!plan || !plan.isActive) throw new AppError(ERRORS.RESOURCE.PLAN_NOT_FOUND);

    // Generate a local order ID (replace with Razorpay order creation later)
    const razorpayOrderId = `order_${crypto.randomBytes(12).toString("hex")}`;

    const order = await Order.create({
      user: req.user!.userId,
      type: "subscription",
      plan: plan._id,
      amount: plan.price,
      currency: plan.currency,
      razorpayOrderId,
      status: "created",
    });

    ok(res, {
      _id: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    }, MSG.CREATED("Order"));
  }),
);

/* ── POST /orders/match-pack — Create order for a match pack ──── */
userOrdersRoutes.post(
  "/match-pack",
  asyncHandler(async (req: AuthRequest, res) => {
    const { matchPackId } = req.body;
    if (!matchPackId) throw new AppError(ERRORS.VALIDATION.MISSING_FIELD);

    const pack = await MatchPack.findById(matchPackId).lean();
    if (!pack || !pack.isActive) throw new AppError(ERRORS.RESOURCE.MATCH_PACK_NOT_FOUND);

    const razorpayOrderId = `order_${crypto.randomBytes(12).toString("hex")}`;

    const order = await Order.create({
      user: req.user!.userId,
      type: "match_pack",
      matchPack: pack._id,
      amount: pack.price,
      currency: pack.currency,
      razorpayOrderId,
      status: "created",
    });

    ok(res, {
      _id: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    }, MSG.CREATED("Order"));
  }),
);

/* ── POST /orders/verify — Verify payment & activate subscription ─ */
userOrdersRoutes.post(
  "/verify",
  asyncHandler(async (req: AuthRequest, res) => {
    const { razorpayOrderId, razorpayPaymentId } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId)
      throw new AppError(ERRORS.VALIDATION.MISSING_FIELD);

    const order = await Order.findOne({
      razorpayOrderId,
      user: req.user!.userId,
    });
    if (!order) throw new AppError(ERRORS.RESOURCE.ORDER_NOT_FOUND);
    if (order.status === "paid") throw new AppError(ERRORS.CONFLICT.ALREADY_PAID);

    // TODO: Verify razorpaySignature with Razorpay secret when integrated
    // const expected = crypto.createHmac("sha256", RAZORPAY_SECRET)
    //   .update(razorpayOrderId + "|" + razorpayPaymentId).digest("hex");
    // if (expected !== razorpaySignature) throw ...

    // Mark order as paid
    order.razorpayPaymentId = razorpayPaymentId;
    order.status = "paid";
    await order.save();

    // Activate subscription or add match pack credits
    if (order.type === "subscription" && order.plan) {
      const plan = await Plan.findById(order.plan).lean();
      if (plan) {
        // Expire any existing active subscription
        await Subscription.updateMany(
          { user: req.user!.userId, status: "active" },
          { status: "expired" },
        );

        const startDate = new Date();
        const endDate = new Date();
        if (plan.interval === "monthly") endDate.setMonth(endDate.getMonth() + 1);
        else if (plan.interval === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 100); // lifetime

        await Subscription.create({
          user: req.user!.userId,
          plan: plan._id,
          status: "active",
          startDate,
          endDate,
          extraMatches: 0,
        });

        // Update user's embedded subscription field
        await User.findByIdAndUpdate(req.user!.userId, {
          "subscription.plan": plan.slug,
          "subscription.expiresAt": endDate,
        });
      }
    } else if (order.type === "match_pack" && order.matchPack) {
      const pack = await MatchPack.findById(order.matchPack).lean();
      if (pack) {
        await Subscription.findOneAndUpdate(
          { user: req.user!.userId, status: "active" },
          { $inc: { extraMatches: pack.matchCount } },
        );
      }
    }

    ok(res, {
      _id: order._id,
      status: order.status,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
    }, "Payment verified");
  }),
);
