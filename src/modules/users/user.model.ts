/**
 * @file    modules/users/user.model.ts
 * @desc    User schema — unified identity across all sports.
 *          Stores credentials, profile, subscription, friends.
 */
import { Schema, model, Document, Types } from "mongoose";
import { USER_ROLES, ADMIN_ROLES, SUB_PLANS, VISIBILITY } from "../../constants";

export interface IUser extends Document {
  _id: Types.ObjectId; username: string; email?: string; mobile?: string; password?: string;
  avatar?: string; displayName?: string; bio?: string; country?: string;
  isActive: boolean; role: string; adminRole?: string;
  subscription: { plan: string; expiresAt?: Date };
  profileVisibility: string;
  totalMatchesAllSports: number; totalWinsAllSports: number; totalMVPCount: number; totalPOMCount: number;
  friends: Types.ObjectId[]; lastLoginAt?: Date;
  deviceInfo?: { platform: string; deviceId: string; appVersion: string };
  createdAt: Date; updatedAt: Date;
}

const schema = new Schema<IUser>({
  username:    { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:       { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  mobile:      { type: String, unique: true, sparse: true, trim: true },
  password:    { type: String, select: false },
  avatar:      String, displayName: { type: String, trim: true, maxlength: 50 },
  bio:         { type: String, trim: true, maxlength: 250 }, country: { type: String, maxlength: 2 },
  isActive:    { type: Boolean, default: true },
  role:        { type: String, enum: USER_ROLES, default: "user" },
  adminRole:   { type: String, enum: [...ADMIN_ROLES, null], default: null },
  subscription:{ plan: { type: String, enum: SUB_PLANS, default: "free" }, expiresAt: Date },
  profileVisibility: { type: String, enum: VISIBILITY, default: "public" },
  totalMatchesAllSports: { type: Number, default: 0 }, totalWinsAllSports: { type: Number, default: 0 },
  totalMVPCount: { type: Number, default: 0 }, totalPOMCount: { type: Number, default: 0 },
  friends:     [{ type: Schema.Types.ObjectId, ref: "User" }],
  lastLoginAt: Date,
  deviceInfo:  { platform: String, deviceId: String, appVersion: String },
}, { timestamps: true, toJSON: { transform: (_d, r: Record<string, any>) => { delete r.password; delete r.__v; return r; } } });

// Indexes already created via `unique: true` on schema fields
export const User = model<IUser>("User", schema);
