/**
 * @file    server.ts
 * @desc    Application entry — connects DB/Redis, starts HTTP + Socket.IO, auto-abandon worker.
 */
import http from "http";
import { env } from "./config/env";
import { createApp } from "./config/app";
import { connectDatabase, disconnectDB } from "./config/database";
import { disconnectRedis } from "./config/redis";
import { initSocket } from "./socket";
import { startAutoAbandon } from "./jobs/autoAbandon";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  startAutoAbandon();
  server.listen(env.PORT, () => {
    logger.info("🚀 Port " + env.PORT);
    logger.info("📡 http://localhost:" + env.PORT + "/api/v1");
  });
  const shutdown = async (sig: string) => {
    logger.info(sig + " — shutting down");
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
bootstrap().catch((e) => {
  logger.error("Fatal:", e);
  process.exit(1);
});
