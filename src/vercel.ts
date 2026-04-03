/**
 * Vercel serverless entry point.
 * Exports the Express app as a serverless function.
 * Note: Socket.IO and background jobs (autoAbandon) are not supported on Vercel.
 */
import { connectDatabase } from "./config/database";
import { createApp } from "./config/app";

const app = createApp();

// Cache the DB connection across warm invocations
let dbConnected = false;
const ensureDb = async () => {
  if (!dbConnected) {
    await connectDatabase();
    dbConnected = true;
  }
};

export default async function handler(req: any, res: any) {
  await ensureDb();
  return app(req, res);
}
