import { Schema, model, Document, Types } from "mongoose";
import { FR_STATUSES } from "../../constants";
export interface IFriendRequest extends Document { sender: Types.ObjectId; receiver: Types.ObjectId; status: string; respondedAt?: Date; }
const s = new Schema<IFriendRequest>({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: FR_STATUSES, default: "pending" }, respondedAt: Date,
}, { timestamps: true });
s.index({ sender: 1, receiver: 1 }, { unique: true }); s.index({ receiver: 1, status: 1 });
export const FriendRequest = model<IFriendRequest>("FriendRequest", s);
