import { Schema, model, Document, Types } from "mongoose";

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  status: string;
  startDate: Date;
  endDate?: Date;
  extraMatches: number;
}

const schema = new Schema<ISubscription>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  extraMatches: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ user: 1, status: 1 });

export const Subscription = model<ISubscription>("Subscription", schema);
