/**
 * @file    middleware/subscription.ts
 * @desc    Subscription-gating middleware. Checks the authenticated
 *          user's plan against a list of allowed plans, and verifies
 *          the subscription has not expired.
 */
import { Response, NextFunction } from "express";
import { User } from "../modules/users/user.model";
import { AppError } from "../utils/AppError";
import { ERRORS } from "../constants";
import type { AuthRequest } from "../types";

/**
 * Middleware factory — restricts access to users whose subscription
 * plan is one of the allowed plans AND is not expired.
 *
 * @example router.post("/premium-feature", authenticate, requirePlan("pro", "max"), handler);
 */
export function requirePlan(...plans: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) return next(new AppError(ERRORS.AUTH.MISSING_TOKEN));

    const user = await User.findById(req.user.userId).select("subscription").lean();
    if (!user) return next(new AppError(ERRORS.RESOURCE.USER_NOT_FOUND));

    const { plan, expiresAt } = user.subscription ?? { plan: "free" };

    if (!plans.includes(plan)) return next(new AppError(ERRORS.BUSINESS.PLAN_REQUIRED));
    if (expiresAt && new Date(expiresAt) < new Date()) return next(new AppError(ERRORS.BUSINESS.PLAN_EXPIRED));

    next();
  };
}
