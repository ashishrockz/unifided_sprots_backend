import { Router } from "express";
import { SportType } from "../sports/sportType.model";
import { Advertisement } from "../ads/advertisement.model";
import { SystemConfig } from "../admin/systemConfig.model";
import { optionalAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";

export const appConfigRoutes = Router();
appConfigRoutes.get(
  "/config",
  optionalAuth,
  asyncHandler(async (req: any, res) => {
    const slug = req.query.slug as string;
    const [sports, ads, features, defaults] = await Promise.all([
      SportType.find({ isActive: true })
        .select("name slug icon logo splashImage splashVideo uiConfig")
        .lean(),
      Advertisement.find({ isActive: true }).sort({ priority: -1 }).lean(),
      SystemConfig.find({ category: "features" }).lean(),
      SystemConfig.find({ category: "general" }).lean(),
    ]);
    let currentSport = null;
    if (slug)
      currentSport = await SportType.findOne({ slug, isActive: true }).lean();
    const adsBySlot: Record<string, any[]> = {};
    for (const a of ads) {
      if (!adsBySlot[a.slot]) adsBySlot[a.slot] = [];
      adsBySlot[a.slot].push(a);
    }
    const fm: Record<string, any> = {};
    features.forEach((f) => { fm[f.key] = f.value; });
    const dm: Record<string, any> = {};
    defaults.forEach((d) => { dm[d.key] = d.value; });

    /* Check if SMS login is enabled */
    const smsDoc = await SystemConfig.findOne({ key: "sms_enabled" }).lean();
    const smsLoginEnabled = smsDoc?.value === true || smsDoc?.value === "true";

    ok(
      res,
      {
        sports,
        currentSport,
        ads: adsBySlot,
        features: fm,
        defaults: dm,
        smsLoginEnabled,
      },
      MSG.FETCHED("Config"),
    );
  }),
);
appConfigRoutes.get("/health", (_, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);
