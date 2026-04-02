/**
 * @file    config/database.ts
 * @desc    MongoDB connection with exponential backoff retry
 *          and graceful shutdown support.
 */
import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("connected", () => logger.info("✅ MongoDB connected"));
  mongoose.connection.on("error", (e) => logger.error("MongoDB error:", e.message));
  for (let i = 1; i <= 5; i++) {
    try { await mongoose.connect(env.MONGO_URI, { maxPoolSize: 10 }); return; }
    catch { logger.warn(`MongoDB attempt ${i}/5 failed`); await new Promise(r => setTimeout(r, 3000 * i)); }
  }
  logger.error("❌ MongoDB connection failed after 5 attempts"); process.exit(1);
}
export const disconnectDB = () => mongoose.connection.close();
