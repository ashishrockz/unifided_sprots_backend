import { Router } from "express";
import { Plan } from "./plan.model";
import { MatchPack } from "./matchPack.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";

export const publicPlansRoutes = Router();

/** GET /plans — list active plans (public) */
publicPlansRoutes.get("/plans", asyncHandler(async (_req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  ok(res, plans, MSG.LIST("Plans"));
}));

/** GET /match-packs — list active match packs (public) */
publicPlansRoutes.get("/match-packs", asyncHandler(async (_req, res) => {
  const packs = await MatchPack.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  ok(res, packs, MSG.LIST("Match packs"));
}));
