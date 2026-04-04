import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./env";
import { apiLimiter } from "../middleware/rateLimiter";
import { errorHandler } from "../middleware/errorHandler";
import { swaggerSpec } from "../swagger/config";

/* ── Auth ─────────────────────────────────────────────── */
import { authRoutes, adminAuthRoutes } from "../modules/auth/auth.routes";

/* ── User-facing ──────────────────────────────────────── */
import { friendsRoutes } from "../modules/friends/friends.routes";
import { sportsRoutes, adminSportsRoutes } from "../modules/sports/sports.routes";
import { sportMatchRoutes, matchRoutes } from "../modules/matches/matches.routes";
import { scoringRoutes } from "../modules/scoring/scoring.routes";
import { tossRoutes } from "../modules/toss/toss.routes";
import { notificationRoutes } from "../modules/notifications/notifications.routes";
import { leaderboardRoutes } from "../modules/leaderboard/leaderboard.routes";
import { userAdsRoutes } from "../modules/ads/ads.routes";
import { adminAdsRoutes } from "../modules/ads/ads.routes";
import { profileRoutes } from "../modules/users/users.routes";
import { appConfigRoutes } from "../modules/app-config/appConfig.routes";

/* ── Admin core ───────────────────────────────────────── */
import { adminRoutes } from "../modules/admin/admin.routes";
import { dashboardRoutes } from "../modules/admin/dashboard.routes";
import { adminManagementRoutes } from "../modules/admin/adminManagement.routes";

/* ── Admin extended ───────────────────────────────────── */
import { adminRoomsRoutes } from "../modules/admin/rooms.routes";
import { analyticsRoutes } from "../modules/admin/analytics.routes";
import { adminNotificationRoutes } from "../modules/admin/notifications.routes";
import { adminProfileRoutes } from "../modules/admin/profile.routes";
import { adminAppConfigRoutes } from "../modules/admin/appConfig.routes";
import { superAdminRoutes } from "../modules/admin/superadmin.routes";
import { otpConfigRoutes } from "../modules/admin/otpConfig.routes";

/* ── New modules ──────────────────────────────────────── */
import { auditLogRoutes } from "../modules/audit-logs/auditLog.routes";
import { adminPlansRoutes, superAdminPlansRoutes } from "../modules/plans/plans.routes";
import { publicPlansRoutes } from "../modules/plans/publicPlans.routes";
import { adminSubscriptionsRoutes } from "../modules/subscriptions/subscriptions.routes";
import { adminOrdersRoutes, adminRevenueRoutes } from "../modules/orders/orders.routes";
import { uploadRoutes } from "../modules/upload/upload.routes";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS.split(","), credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  /* ── Swagger UI ──────────────────────────────────────── */
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Unified Sports API Docs",
  }));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

  /* ── Health check (Render uses GET / by default) ────── */
  app.get("/", (_req, res) => res.json({ success: true, message: "Unified Sports API is running" }));
  app.get("/health", (_req, res) => res.json({ success: true, uptime: process.uptime() }));

  app.use("/api/", apiLimiter);

  const v = "/api/v1";

  /* ── Auth ─────────────────────────────────────────────── */
  app.use(v + "/auth", authRoutes);
  app.use(v + "/admin/auth", adminAuthRoutes);
  /* Alias: admin panel calls POST /admin/login directly */
  app.post(v + "/admin/login", (req, res, next) => {
    req.url = "/login";
    adminAuthRoutes(req, res, next);
  });

  /* ── User-facing ──────────────────────────────────────── */
  app.use(v + "/friends", friendsRoutes);
  app.use(v + "/sports", sportsRoutes);
  app.use(v + "/admin/sports", adminSportsRoutes);
  /* Alias: admin panel calls /sport-types */
  app.use(v + "/sport-types", adminSportsRoutes);
  app.use(v + "/sports", sportMatchRoutes);
  app.use(v + "/sports", leaderboardRoutes);
  app.use(v + "/matches", matchRoutes);
  app.use(v + "/matches", scoringRoutes);
  app.use(v + "/matches", tossRoutes);
  app.use(v + "/notifications", notificationRoutes);
  app.use(v + "/profile", profileRoutes);
  app.use(v + "/ads", userAdsRoutes);
  app.use(v + "/app", appConfigRoutes);
  app.use(v, publicPlansRoutes);

  /* ── Admin core ───────────────────────────────────────── */
  app.use(v + "/admin/ads", adminAdsRoutes);
  app.use(v + "/admin", adminRoutes);
  app.use(v + "/admin", dashboardRoutes);
  app.use(v + "/admin/admins", adminManagementRoutes);

  /* ── Admin extended ───────────────────────────────────── */
  app.use(v + "/admin/rooms", adminRoomsRoutes);
  app.use(v + "/admin/notifications", adminNotificationRoutes);
  app.use(v + "/admin", adminProfileRoutes);
  app.use(v + "/admin", adminPlansRoutes);
  app.use(v + "/admin/subscriptions", adminSubscriptionsRoutes);
  app.use(v + "/admin/orders", adminOrdersRoutes);
  app.use(v + "/admin/revenue", adminRevenueRoutes);

  /* ── Analytics (accessible at /analytics/*) ───────────── */
  app.use(v + "/analytics", analyticsRoutes);

  /* ── App config admin ─────────────────────────────────── */
  app.use(v + "/app-config", adminAppConfigRoutes);

  /* ── OTP config (super admin — SMTP / SMS) ────────────── */
  app.use(v + "/admin/otp-config", otpConfigRoutes);

  /* ── Audit logs ───────────────────────────────────────── */
  app.use(v + "/audit-logs", auditLogRoutes);

  /* ── SuperAdmin ───────────────────────────────────────── */
  app.use(v + "/superadmin", superAdminRoutes);
  /* SuperAdmin admin management alias */
  app.use(v + "/superadmin/admins", adminManagementRoutes);
  app.use(v + "/superadmin", superAdminPlansRoutes);

  /* ── Upload ───────────────────────────────────────────── */
  app.use(v + "/upload", uploadRoutes);

  /* ── 404 + error handler ──────────────────────────────── */
  app.use((_, res) => res.status(404).json({ success: false, message: "Endpoint not found" }));
  app.use(errorHandler);

  return app;
}
