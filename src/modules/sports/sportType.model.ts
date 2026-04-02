import { Schema, model, Document, Types } from "mongoose";
import { SCORING_TYPES } from "../../constants";
export interface ISportType extends Document { _id: Types.ObjectId; name: string; slug: string; icon?: string; logo?: string; splashImage?: string; splashVideo?: string; isActive: boolean; rules: Record<string, any>; uiConfig?: Record<string, any>; maxPlayersPerTeam: number; minPlayersPerTeam: number; scoringType: string; }
const s = new Schema<ISportType>({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true },
  icon: String, logo: String, splashImage: String, splashVideo: String, isActive: { type: Boolean, default: true },
  rules: { type: Schema.Types.Mixed, required: true, default: {} }, uiConfig: { type: Schema.Types.Mixed, default: {} },
  maxPlayersPerTeam: { type: Number, required: true }, minPlayersPerTeam: { type: Number, required: true },
  scoringType: { type: String, enum: SCORING_TYPES, required: true },
}, { timestamps: true });
export const SportType = model<ISportType>("SportType", s);
