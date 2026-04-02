import { Schema, model, Document, Types } from "mongoose";
export interface INotification extends Document { user: Types.ObjectId; type: string; title: string; body: string; data?: Record<string, any>; isRead: boolean; sentBy?: Types.ObjectId; source: "admin" | "system"; }
const s = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  sentBy: { type: Schema.Types.ObjectId, ref: "User" },
  source: { type: String, enum: ["admin", "system"], default: "system" },
}, { timestamps: true });
s.index({ user: 1, isRead: 1, createdAt: -1 });
s.index({ source: 1, createdAt: -1 });
export const Notification = model<INotification>("Notification", s);
