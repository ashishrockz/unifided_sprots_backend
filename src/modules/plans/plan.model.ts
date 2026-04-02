import { Schema, model, Document, Types } from "mongoose";

export interface IPlan extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  limits: {
    matchesPerDay: number;
    matchesPerWeek: number;
    matchHistoryCount: number;
  };
  features: {
    adFree: boolean;
    commentary: boolean;
    analytics: boolean;
  };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const schema = new Schema<IPlan>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, default: "INR" },
  interval: { type: String, enum: ["monthly", "yearly", "lifetime"], default: "monthly" },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  limits: {
    matchesPerDay: { type: Number, default: 3 },
    matchesPerWeek: { type: Number, default: 10 },
    matchHistoryCount: { type: Number, default: 20 },
  },
  features: {
    adFree: { type: Boolean, default: false },
    commentary: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const Plan = model<IPlan>("Plan", schema);
