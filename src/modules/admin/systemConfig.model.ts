import { Schema, model, Document, Types } from "mongoose";
import { CONFIG_CATS } from "../../constants";
export interface ISystemConfig extends Document { key: string; value: any; category: string; description?: string; updatedBy?: Types.ObjectId; }
const s = new Schema<ISystemConfig>({ key: { type: String, required: true, unique: true }, value: { type: Schema.Types.Mixed, required: true }, category: { type: String, enum: CONFIG_CATS, required: true }, description: String, updatedBy: { type: Schema.Types.ObjectId, ref: "User" } }, { timestamps: true });
export const SystemConfig = model<ISystemConfig>("SystemConfig", s);
