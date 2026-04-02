import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  actorRole: string;
  action: string;
  targetModel: string;
  targetId?: Types.ObjectId;
  details?: Record<string, any>;
  ip?: string;
  createdAt: Date;
}

const schema = new Schema<IAuditLog>({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  targetModel: { type: String, required: true },
  targetId: Schema.Types.ObjectId,
  details: Schema.Types.Mixed,
  ip: String,
}, { timestamps: true });

schema.index({ actor: 1 });
schema.index({ createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", schema);
