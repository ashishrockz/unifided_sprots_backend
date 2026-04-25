/**
 * @file    modules/notifications/notification.service.ts
 * @desc    Create, broadcast, and manage in-app notifications.
 *          Persists to MongoDB and pushes via Socket.IO in real-time.
 */
import { Types } from "mongoose";
import { Notification } from "./notification.model";
import { User } from "../users/user.model";
import { emitToUser } from "../../socket/index";
import { logger } from "../../utils/logger";
import { sendToDevices } from "../../utils/fcm";

interface CreatePayload {
  user: string | Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sentBy?: string | Types.ObjectId;
  source?: "admin" | "system";
}

export class NotificationService {
  /** Create a single notification and push via socket + FCM */
  static async create(payload: CreatePayload) {
    const notif = await Notification.create({
      ...payload,
      source: payload.source ?? "system",
    });
    const userId = payload.user.toString();
    emitToUser(userId, "notification:new", notif.toObject());
    this._emitUnreadCount(userId);

    // Fire-and-forget FCM push
    this._sendFcm([userId], payload.title, payload.body, { ...payload.data, type: payload.type });

    return notif;
  }

  /** Send the same notification to multiple specific users */
  static async sendToMany(
    userIds: string[],
    data: Omit<CreatePayload, "user">,
  ) {
    const docs = userIds.map((uid) => ({
      ...data,
      user: uid,
      source: data.source ?? "system",
    }));
    const notifs = await Notification.insertMany(docs);
    for (const uid of userIds) {
      const userNotif = notifs.find((n) => n.user.toString() === uid);
      if (userNotif) emitToUser(uid, "notification:new", userNotif.toObject());
      this._emitUnreadCount(uid);
    }

    // Fire-and-forget FCM push to all recipients
    this._sendFcm(userIds, data.title, data.body, { ...data.data, type: data.type });

    return notifs;
  }

  /** Broadcast notification to ALL active users */
  static async sendToAll(data: Omit<CreatePayload, "user">) {
    const users = await User.find({ isActive: true }).select("_id").lean();
    const userIds = users.map((u) => u._id.toString());
    if (userIds.length === 0) return [];
    return this.sendToMany(userIds, data);
  }

  /** Emit current unread count to a user */
  private static async _emitUnreadCount(userId: string) {
    try {
      const count = await Notification.countDocuments({
        user: userId,
        isRead: false,
      });
      emitToUser(userId, "notification:unread_count", { count });
    } catch (err) {
      logger.error("Failed to emit unread count", err);
    }
  }

  /**
   * Fire-and-forget FCM push to one or more users.
   * Looks up their fcmTokens and sends; cleans up stale tokens.
   */
  private static async _sendFcm(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    try {
      const users = await User.find({ _id: { $in: userIds }, "fcmTokens.0": { $exists: true } })
        .select("fcmTokens")
        .lean();

      const allTokens: string[] = [];
      for (const u of users) {
        for (const t of u.fcmTokens || []) {
          allTokens.push(t.token);
        }
      }
      if (allTokens.length === 0) return;

      // Convert data values to strings (FCM requires string values)
      const stringData: Record<string, string> = {};
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          stringData[k] = String(v);
        }
      }

      const failedTokens = await sendToDevices(allTokens, { title, body, data: stringData });

      // Remove stale tokens
      if (failedTokens.length > 0) {
        await User.updateMany(
          { "fcmTokens.token": { $in: failedTokens } },
          { $pull: { fcmTokens: { token: { $in: failedTokens } } } },
        );
      }
    } catch (err) {
      logger.error("FCM dispatch failed", err);
    }
  }
}
