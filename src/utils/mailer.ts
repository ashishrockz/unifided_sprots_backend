/**
 * @file    utils/mailer.ts
 * @desc    Email sender using nodemailer. SMTP config is read from
 *          SystemConfig (DB) so super admins can update it from the panel.
 */
import nodemailer from "nodemailer";
import { SystemConfig } from "../modules/admin/systemConfig.model";
import { logger } from "./logger";

interface SmtpConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  email_from: string;
}

/** Read SMTP settings from SystemConfig collection */
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "email_from"];
  const docs = await SystemConfig.find({ key: { $in: keys } }).lean();
  if (docs.length === 0) return null;

  const map: Record<string, any> = {};
  for (const d of docs) map[d.key] = d.value;

  if (!map.smtp_host || !map.smtp_user || !map.smtp_pass) return null;

  return {
    smtp_host: map.smtp_host,
    smtp_port: Number(map.smtp_port) || 587,
    smtp_secure: map.smtp_secure === true || map.smtp_secure === "true",
    smtp_user: map.smtp_user,
    smtp_pass: map.smtp_pass,
    email_from: map.email_from || map.smtp_user,
  };
}

/** Send an email. Returns true on success, false if SMTP not configured. */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const cfg = await getSmtpConfig();
  if (!cfg) {
    logger.warn("SMTP not configured — email not sent to " + to);
    return false;
  }

  const transport = nodemailer.createTransport({
    host: cfg.smtp_host,
    port: cfg.smtp_port,
    secure: cfg.smtp_port === 465,  // only true SSL for port 465; port 587 uses STARTTLS
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
    tls: { rejectUnauthorized: false },
  });

  await transport.sendMail({
    from: cfg.email_from,
    to,
    subject,
    html,
  });
  logger.info(`Email sent to ${to}: ${subject}`);
  return true;
}

/** Send OTP email with a clean template */
export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #2a8dff; margin-bottom: 8px;">Unified Sports</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;
                  background: #f0f4ff; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
    </div>
  `;
  return sendEmail(email, "Your Verification Code — Unified Sports", html);
}
