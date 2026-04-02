import { Router } from "express";
import { Plan } from "./plan.model";
import { MatchPack } from "./matchPack.model";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created, noContent } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import type { AuthRequest } from "../../types";

export const adminPlansRoutes = Router();
adminPlansRoutes.use(authenticate, authorize("super_admin", "sport_admin", "content_manager"));

/* ── Plans ─────────────────────────────────────────────── */
adminPlansRoutes.get("/plans", asyncHandler(async (_req, res) => {
  ok(res, await Plan.find().sort({ sortOrder: 1 }).lean(), MSG.LIST("Plans"));
}));

adminPlansRoutes.put("/plans/:id", asyncHandler(async (req: AuthRequest, res) => {
  const p = await Plan.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user!.userId }, { new: true, runValidators: true });
  if (!p) throw new AppError(ERRORS.RESOURCE.CONFIG_NOT_FOUND);
  ok(res, p, MSG.UPDATED("Plan"));
}));

/* ── Match Packs ───────────────────────────────────────── */
adminPlansRoutes.get("/match-packs", asyncHandler(async (_req, res) => {
  ok(res, await MatchPack.find().sort({ sortOrder: 1 }).lean(), MSG.LIST("Match packs"));
}));

adminPlansRoutes.put("/match-packs/:id", asyncHandler(async (req: AuthRequest, res) => {
  const p = await MatchPack.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user!.userId }, { new: true, runValidators: true });
  if (!p) throw new AppError(ERRORS.RESOURCE.CONFIG_NOT_FOUND);
  ok(res, p, MSG.UPDATED("Match pack"));
}));

/* ── Super admin only ──────────────────────────────────── */
export const superAdminPlansRoutes = Router();
superAdminPlansRoutes.use(authenticate, authorize("super_admin"));

superAdminPlansRoutes.post("/plans", asyncHandler(async (req: AuthRequest, res) => {
  created(res, await Plan.create({ ...req.body, createdBy: req.user!.userId }), MSG.CREATED("Plan"));
}));

superAdminPlansRoutes.delete("/plans/:id", asyncHandler(async (req, res) => {
  await Plan.findByIdAndUpdate(req.params.id, { isActive: false });
  noContent(res);
}));

superAdminPlansRoutes.post("/match-packs", asyncHandler(async (req: AuthRequest, res) => {
  created(res, await MatchPack.create({ ...req.body, createdBy: req.user!.userId }), MSG.CREATED("Match pack"));
}));

superAdminPlansRoutes.delete("/match-packs/:id", asyncHandler(async (req, res) => {
  await MatchPack.findByIdAndUpdate(req.params.id, { isActive: false });
  noContent(res);
}));
