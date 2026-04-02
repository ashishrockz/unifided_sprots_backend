/**
 * @file    utils/sms.ts
 * @desc    SMS sender. Provider config (API key, sender ID, base URL)
 *          is read from SystemConfig (DB) so super admins can manage
 *          it from the admin panel. SMS login can be toggled on/off.
 *
 *          Supports a generic HTTP-based SMS gateway pattern.
 *          The admin sets a `sms_api_url` with placeholders:
 *            e.g. https://api.provider.com/send?apikey={{API_KEY}}&to={{TO}}&msg={{MSG}}
 *          Or uses a JSON POST body template.
 */
import axios from "axios";
import { SystemConfig } from "../modules/admin/systemConfig.model";
import { logger } from "./logger";

interface SmsConfig {
  sms_enabled: boolean;
  sms_provider: string;       // "http_get" | "http_post" | "twilio"
  sms_api_url: string;
  sms_api_key: string;
  sms_sender_id: string;
}

/** Read SMS settings from SystemConfig collection */
async function getSmsConfig(): Promise<SmsConfig | null> {
  const keys = ["sms_enabled", "sms_provider", "sms_api_url", "sms_api_key", "sms_sender_id"];
  const docs = await SystemConfig.find({ key: { $in: keys } }).lean();
  if (docs.length === 0) return null;

  const map: Record<string, any> = {};
  for (const d of docs) map[d.key] = d.value;

  return {
    sms_enabled: map.sms_enabled === true || map.sms_enabled === "true",
    sms_provider: map.sms_provider || "http_get",
    sms_api_url: map.sms_api_url || "",
    sms_api_key: map.sms_api_key || "",
    sms_sender_id: map.sms_sender_id || "",
  };
}

/** Check if SMS login is enabled */
export async function isSmsLoginEnabled(): Promise<boolean> {
  const doc = await SystemConfig.findOne({ key: "sms_enabled" }).lean();
  return doc?.value === true || doc?.value === "true";
}

/** Send an SMS. Returns true on success, false if SMS not configured or disabled. */
export async function sendSms(to: string, message: string): Promise<boolean> {
  const cfg = await getSmsConfig();
  if (!cfg || !cfg.sms_enabled) {
    logger.warn("SMS not enabled — message not sent to " + to);
    return false;
  }
  if (!cfg.sms_api_url || !cfg.sms_api_key) {
    logger.warn("SMS API not configured — message not sent to " + to);
    return false;
  }

  try {
    const url = cfg.sms_api_url
      .replace("{{API_KEY}}", encodeURIComponent(cfg.sms_api_key))
      .replace("{{SENDER_ID}}", encodeURIComponent(cfg.sms_sender_id))
      .replace("{{TO}}", encodeURIComponent(to))
      .replace("{{MSG}}", encodeURIComponent(message));

    if (cfg.sms_provider === "http_post") {
      await axios.post(url, {
        apiKey: cfg.sms_api_key,
        senderId: cfg.sms_sender_id,
        to,
        message,
      });
    } else {
      // Default: http_get — URL already has all params via placeholders
      await axios.get(url);
    }
    logger.info(`SMS sent to ${to}`);
    return true;
  } catch (err: any) {
    logger.error(`SMS send failed to ${to}: ${err.message}`);
    return false;
  }
}

/** Send OTP via SMS */
export async function sendOtpSms(mobile: string, otp: string): Promise<boolean> {
  const message = `Your Unified Sports verification code is: ${otp}. Valid for 5 minutes. Do not share.`;
  return sendSms(mobile, message);
}
