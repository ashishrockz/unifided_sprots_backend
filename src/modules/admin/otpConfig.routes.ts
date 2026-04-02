/**
 * @file    modules/admin/otpConfig.routes.ts
 * @desc    Super-admin routes to manage SMTP (email) and SMS gateway
 *          configuration. Values are stored in SystemConfig so the
 *          admin panel can control OTP delivery without code changes.
 */
import { Router } from "express";
import { SystemConfig } from "./systemConfig.model";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { sendEmail } from "../../utils/mailer";
import { sendSms } from "../../utils/sms";
import { MSG } from "../../constants";

export const otpConfigRoutes = Router();
otpConfigRoutes.use(authenticate, authorize("super_admin"));

/* ══════════ SMTP (Email) Configuration ══════════ */

/** GET /email — Get current SMTP settings (password masked) */
otpConfigRoutes.get("/email", asyncHandler(async (_req, res) => {
  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "email_from"];
  const docs = await SystemConfig.find({ key: { $in: keys } }).lean();
  const cfg: Record<string, any> = {};
  for (const d of docs) {
    cfg[d.key] = d.key === "smtp_pass" ? "••••••••" : d.value;
  }
  ok(res, cfg, MSG.FETCHED("Email config"));
}));

/** PUT /email — Update SMTP settings */
otpConfigRoutes.put("/email", asyncHandler(async (req: any, res) => {
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, email_from } = req.body;
  const updates: Array<{ key: string; value: any }> = [];

  if (smtp_host !== undefined) updates.push({ key: "smtp_host", value: smtp_host });
  if (smtp_port !== undefined) updates.push({ key: "smtp_port", value: Number(smtp_port) });
  if (smtp_secure !== undefined) updates.push({ key: "smtp_secure", value: Boolean(smtp_secure) });
  if (smtp_user !== undefined) updates.push({ key: "smtp_user", value: smtp_user });
  if (smtp_pass !== undefined) updates.push({ key: "smtp_pass", value: smtp_pass });
  if (email_from !== undefined) updates.push({ key: "email_from", value: email_from });

  for (const { key, value } of updates) {
    await SystemConfig.findOneAndUpdate(
      { key },
      { key, value, category: "general", description: `Email SMTP — ${key}` },
      { upsert: true },
    );
  }

  ok(res, null, MSG.CONFIG_UPDATED);
}));

/** POST /email/test — Send a test email */
otpConfigRoutes.post("/email/test", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return ok(res, null, "Email address required");
  const sent = await sendEmail(
    email,
    "Test Email — Unified Sports",
    "<p>This is a test email from Unified Sports admin panel. Your SMTP configuration is working correctly.</p>",
  );
  ok(res, { sent }, sent ? "Test email sent successfully" : "SMTP not configured or send failed");
}));

/* ══════════ SMS Configuration ══════════ */

/** GET /sms — Get current SMS settings (API key masked) */
otpConfigRoutes.get("/sms", asyncHandler(async (_req, res) => {
  const keys = ["sms_enabled", "sms_provider", "sms_api_url", "sms_api_key", "sms_sender_id"];
  const docs = await SystemConfig.find({ key: { $in: keys } }).lean();
  const cfg: Record<string, any> = {};
  for (const d of docs) {
    cfg[d.key] = d.key === "sms_api_key" ? "••••••••" : d.value;
  }
  ok(res, cfg, MSG.FETCHED("SMS config"));
}));

/** PUT /sms — Update SMS settings */
otpConfigRoutes.put("/sms", asyncHandler(async (req: any, res) => {
  const { sms_enabled, sms_provider, sms_api_url, sms_api_key, sms_sender_id } = req.body;
  const updates: Array<{ key: string; value: any }> = [];

  if (sms_enabled !== undefined) updates.push({ key: "sms_enabled", value: Boolean(sms_enabled) });
  if (sms_provider !== undefined) updates.push({ key: "sms_provider", value: sms_provider });
  if (sms_api_url !== undefined) updates.push({ key: "sms_api_url", value: sms_api_url });
  if (sms_api_key !== undefined) updates.push({ key: "sms_api_key", value: sms_api_key });
  if (sms_sender_id !== undefined) updates.push({ key: "sms_sender_id", value: sms_sender_id });

  for (const { key, value } of updates) {
    await SystemConfig.findOneAndUpdate(
      { key },
      { key, value, category: "general", description: `SMS gateway — ${key}` },
      { upsert: true },
    );
  }

  ok(res, null, MSG.CONFIG_UPDATED);
}));

/** PUT /sms/toggle — Quick toggle SMS login on/off */
otpConfigRoutes.put("/sms/toggle", asyncHandler(async (req, res) => {
  const enabled = Boolean(req.body.enabled);
  await SystemConfig.findOneAndUpdate(
    { key: "sms_enabled" },
    { key: "sms_enabled", value: enabled, category: "general", description: "SMS login enabled/disabled" },
    { upsert: true },
  );
  ok(res, { sms_enabled: enabled }, MSG.TOGGLED("SMS login", enabled));
}));

/** POST /sms/test — Send a test SMS */
otpConfigRoutes.post("/sms/test", asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return ok(res, null, "Mobile number required");
  const sent = await sendSms(mobile, "Test SMS from Unified Sports admin panel. Your SMS configuration is working.");
  ok(res, { sent }, sent ? "Test SMS sent successfully" : "SMS not configured/enabled or send failed");
}));

