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
  /** Create a single notification and push via socket */
  static async create(payload: CreatePayload) {
    const notif = await Notification.create({
      ...payload,
      source: payload.source ?? "system",
    });
    const userId = payload.user.toString();
    emitToUser(userId, "notification:new", notif.toObject());
    this._emitUnreadCount(userId);
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
}
