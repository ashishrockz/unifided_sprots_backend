import { Router } from "express";
import { SystemConfig } from "./systemConfig.model";
import { SportType } from "../sports/sportType.model";
import { Advertisement } from "../ads/advertisement.model";
import { authenticate, authorize } from "../../middleware/auth";
import { permit } from "../../middleware/permission";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";

export const adminAppConfigRoutes = Router();
adminAppConfigRoutes.use(authenticate, authorize("super_admin", "content_manager"));

/** GET /app-config/admin — Full config for admin panel */
adminAppConfigRoutes.get("/admin", asyncHandler(async (_req, res) => {
  const [configs, sports, ads] = await Promise.all([
    SystemConfig.find().lean(),
    SportType.find().sort({ name: 1 }).lean(),
    Advertisement.find().sort({ priority: -1 }).lean(),
  ]);
  const grouped: Record<string, any[]> = {};
  configs.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });
  ok(res, { configs: grouped, sports, ads }, MSG.FETCHED("Admin config"));
}));

/** PUT /app-config — Update configs */
adminAppConfigRoutes.put("/", permit("config:update"), asyncHandler(async (req, res) => {
  for (const [key, value] of Object.entries(req.body)) {
    await SystemConfig.findOneAndUpdate({ key }, { key, value }, { upsert: true });
  }
  ok(res, null, MSG.CONFIG_UPDATED);
}));
