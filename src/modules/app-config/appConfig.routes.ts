import { Router } from "express";
import { SportType } from "../sports/sportType.model";
import { Advertisement } from "../ads/advertisement.model";
import { SystemConfig } from "../admin/systemConfig.model";
import { optionalAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { MSG } from "../../constants";
import { getRedis } from "../../config/redis";

export const appConfigRoutes = Router();
appConfigRoutes.get(
  "/config",
  optionalAuth,
  asyncHandler(async (req: any, res) => {
    const slug = req.query.slug as string;
    const [rawSports, ads, features, defaults] = await Promise.all([
      SportType.find({ isActive: true })
        .select("name slug icon logo splashImage splashVideo uiConfig")
        .lean(),
      Advertisement.find({ isActive: true }).sort({ priority: -1 }).lean(),
      SystemConfig.find({ category: "features" }).lean(),
      SystemConfig.find({ category: "general" }).lean(),
    ]);
    // Strip theme from uiConfig for all sports — app uses its own default theme
    const sports = rawSports.map((s: any) => {
      if (s.uiConfig?.theme) {
        const { theme: _removed, ...rest } = s.uiConfig;
        return { ...s, uiConfig: rest };
      }
      return s;
    });
    let currentSport: any = null;
    if (slug) {
      currentSport = await SportType.findOne({ slug, isActive: true }).lean();
      // Strip theme from uiConfig — app uses its own default theme
      if (currentSport?.uiConfig?.theme) {
        const { theme: _removed, ...rest } = currentSport.uiConfig;
        currentSport = { ...currentSport, uiConfig: rest };
      }
    }
    const fm: Record<string, any> = {};
    features.forEach((f) => { fm[f.key] = f.value; });

    // Only populate ads if ads_enabled feature flag is true
    const adsBySlot: Record<string, any[]> = {};
    if (fm["ads_enabled"] === true) {
      for (const a of ads) {
        if (!adsBySlot[a.slot]) adsBySlot[a.slot] = [];
        adsBySlot[a.slot].push(a);
      }
    }
    const dm: Record<string, any> = {};
    defaults.forEach((d) => { dm[d.key] = d.value; });

    /* Check if SMS login is enabled */
    const smsDoc = await SystemConfig.findOne({ key: "sms_enabled" }).lean();
    const smsLoginEnabled = smsDoc?.value === true || smsDoc?.value === "true";

    /* Check maintenance mode from Redis */
    const redis = getRedis();
    const maintenanceMode = (await redis.get("config:maintenance_mode")) === "true";
    const maintenanceMessage = maintenanceMode ? await redis.get("config:maintenance_message") : null;

    ok(
      res,
      {
        sports,
        currentSport,
        ads: adsBySlot,
        features: fm,
        defaults: dm,
        smsLoginEnabled,
        maintenanceMode,
        maintenanceMessage,
      },
      MSG.FETCHED("Config"),
    );
  }),
);
appConfigRoutes.get("/health", (_, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() }),
);
