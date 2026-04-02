import { Router } from "express";
import { Match } from "../matches/match.model";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, paginated, buildPage, parseQuery } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";

export const adminRoomsRoutes = Router();
adminRoomsRoutes.use(authenticate, authorize("super_admin", "sport_admin", "support_agent"));

adminRoomsRoutes.get("/", permit("matches:read"), asyncHandler(async (req, res) => {
  const { page, limit, skip } = parseQuery(req.query);
  const q: any = { status: { $in: ["draft", "team_setup", "toss"] } };
  if (req.query.status) q.status = req.query.status;
  if (req.query.search) q.title = { $regex: req.query.search, $options: "i" };
  const [data, total] = await Promise.all([
    Match.find(q).populate("creator", "username displayName avatar").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Match.countDocuments(q),
  ]);
  paginated(res, data, buildPage(page, limit, total), MSG.LIST("Rooms"));
}));

adminRoomsRoutes.get("/:id", permit("matches:read"), asyncHandler(async (req, res) => {
  const m = await Match.findById(req.params.id)
    .populate("creator", "username displayName avatar")
    .populate("teams.players.user", "username displayName avatar");
  if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
  ok(res, m, MSG.FETCHED("Room"));
}));

adminRoomsRoutes.put("/:id/abandon", permit("matches:abandon"), asyncHandler(async (req, res) => {
  const m = await Match.findById(req.params.id);
  if (!m) throw new AppError(ERRORS.RESOURCE.MATCH_NOT_FOUND);
  if (["completed", "abandoned"].includes(m.status)) throw new AppError(ERRORS.BUSINESS.MATCH_ALREADY_ENDED);
  m.status = "abandoned";
  m.abandonedBy = "admin";
  m.abandonReason = req.body.reason || "Admin action";
  m.completedAt = new Date();
  await m.save();
  ok(res, m, MSG.MATCH_ABANDONED);
}));
