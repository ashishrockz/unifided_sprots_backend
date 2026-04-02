import { Schema, model, Document, Types } from "mongoose";

export interface IMatchPack extends Document {
  name: string;
  matchCount: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

const schema = new Schema<IMatchPack>({
  name: { type: String, required: true, trim: true },
  matchCount: { type: Number, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const MatchPack = model<IMatchPack>("MatchPack", schema);
