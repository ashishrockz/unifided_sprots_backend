/**
 * @file    utils/fcm.ts
 * @desc    Firebase Cloud Messaging push notification sender.
 *          Uses firebase-admin SDK. Requires GOOGLE_APPLICATION_CREDENTIALS
 *          env var pointing to the service account JSON, or individual
 *          FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.
 *
 *          Gracefully no-ops if Firebase is not configured.
 */
import { logger } from "./logger";

let admin: any = null;
let messaging: any = null;

/** Lazy-init Firebase Admin — called once on first send */
function init() {
  if (admin !== null) return; // already attempted
  try {
    admin = require("firebase-admin");
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      logger.warn("[FCM] No Firebase credentials found — push notifications disabled");
      admin = false;
      return;
    }
    messaging = admin.messaging();
    logger.info("[FCM] Firebase Admin initialized");
  } catch (err: any) {
    logger.warn(`[FCM] Firebase init failed: ${err.message} — push disabled`);
    admin = false;
  }
}

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a single device token.
 * Returns true on success, false on failure (token invalid, FCM down, etc.).
 */
export async function sendToDevice(token: string, payload: FcmPayload): Promise<boolean> {
  init();
  if (!messaging) return false;
  try {
    await messaging.send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: { priority: "high" as const },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    });
    return true;
  } catch (err: any) {
    // Token expired / unregistered — caller should remove it
    if (
      err.code === "messaging/registration-token-not-registered" ||
      err.code === "messaging/invalid-registration-token"
    ) {
      logger.info(`[FCM] Stale token removed: ${token.slice(0, 12)}...`);
      return false;
    }
    logger.error(`[FCM] Send failed: ${err.message}`);
    return false;
  }
}

/**
 * Send push notification to multiple device tokens.
 * Returns list of tokens that failed (should be cleaned up by caller).
 */
export async function sendToDevices(
  tokens: string[],
  payload: FcmPayload,
): Promise<string[]> {
  init();
  if (!messaging || tokens.length === 0) return [];

  const failedTokens: string[] = [];
  try {
    const message = {
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      android: { priority: "high" as const },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    };

    const response = await messaging.sendEachForMulticast({
      tokens,
      ...message,
    });

    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        failedTokens.push(tokens[idx]);
      }
    });
  } catch (err: any) {
    logger.error(`[FCM] Multicast failed: ${err.message}`);
  }
  return failedTokens;
}
