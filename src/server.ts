/**
 * @file    server.ts
 * @desc    Application entry — connects DB/Redis, starts HTTP + Socket.IO, auto-abandon worker.
 *          Registers process-level handlers for unhandled rejections,
 *          uncaught exceptions, and graceful shutdown.
 */
import http from "http";
import { env } from "./config/env";
import { createApp } from "./config/app";
import { connectDatabase, disconnectDB } from "./config/database";
import { disconnectRedis } from "./config/redis";
import { initSocket, closeSocket } from "./socket";
import { startAutoAbandon } from "./jobs/autoAbandon";
import { logger } from "./utils/logger";

let shuttingDown = false;

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  await initSocket(server);
  startAutoAbandon();

  server.listen(env.PORT, () => {
    logger.info("🚀 Port " + env.PORT);
    logger.info("📡 http://localhost:" + env.PORT + "/api/v1");
  });

  const shutdown = async (sig: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(sig + " — shutting down");

    // Stop accepting new HTTP connections.
    server.close((err) => {
      if (err) logger.error("HTTP server close error:", err);
    });

    // Kick clients off sockets cleanly.
    try {
      await closeSocket();
    } catch (err) {
      logger.error("Socket close error:", err);
    }

    try {
      await disconnectDB();
    } catch (err) {
      logger.error("DB disconnect error:", err);
    }
    try {
      await disconnectRedis();
    } catch (err) {
      logger.error("Redis disconnect error:", err);
    }

    // Safety net: if anything hangs, bail after 10s.
    setTimeout(() => process.exit(0), 500).unref();
    setTimeout(() => {
      logger.error("Shutdown timed out — forcing exit");
      process.exit(1);
    }, 10_000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("UNHANDLED_REJECTION:", { reason, promise });
    // Don't exit — log and keep serving. An unhandled rejection is a
    // programming error, but killing a live scoring server would be
    // worse. Operators should monitor the error log.
  });

  process.on("uncaughtException", (err) => {
    logger.error("UNCAUGHT_EXCEPTION:", err);
    // Uncaught exceptions CAN leave the process in an undefined state,
    // so after logging we trigger a graceful shutdown. Process manager
    // (pm2/systemd/k8s) will restart us.
    void shutdown("uncaughtException");
  });
}

bootstrap().catch((e) => {
  logger.error("Fatal:", e);
  process.exit(1);
});
