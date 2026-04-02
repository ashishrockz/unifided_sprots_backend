import { Schema, model, Document, Types } from "mongoose";

export interface IOrder extends Document {
  user: Types.ObjectId;
  type: string;
  plan?: Types.ObjectId;
  matchPack?: Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: string;
}

const schema = new Schema<IOrder>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["subscription", "match_pack"], required: true },
  plan: { type: Schema.Types.ObjectId, ref: "Plan" },
  matchPack: { type: Schema.Types.ObjectId, ref: "MatchPack" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created" },
}, { timestamps: true });

schema.index({ user: 1 });
schema.index({ status: 1 });
schema.index({ createdAt: -1 });

export const Order = model<IOrder>("Order", schema);
