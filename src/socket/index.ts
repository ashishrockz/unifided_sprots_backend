/**
 * @file    socket/index.ts
 * @desc    Socket.IO server bootstrap with JWT handshake auth, Redis
 *          adapter for horizontal scaling, lifecycle handlers, and
 *          per-match broadcast helpers.
 */
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { getRedis } from "../config/redis";
import { logger } from "../utils/logger";

let io: Server | undefined;

export async function initSocket(http: HttpServer): Promise<Server> {
  io = new Server(http, {
    cors: { origin: env.CORS_ORIGINS.split(","), credentials: true },
    pingInterval: 10_000,
    pingTimeout: 5_000,
  });

  // Redis adapter — enables multi-instance broadcasts. If Redis is
  // unreachable we log and continue without adapter (single-instance mode).
  try {
    const pub = getRedis().duplicate();
    const sub = getRedis().duplicate();
    await Promise.all([
      new Promise<void>((res, rej) => {
        pub.once("ready", () => res());
        pub.once("error", rej);
      }),
      new Promise<void>((res, rej) => {
        sub.once("ready", () => res());
        sub.once("error", rej);
      }),
    ]);
    io.adapter(createAdapter(pub, sub));
    logger.info("✅ Socket.IO Redis adapter attached");
  } catch (err) {
    logger.warn("⚠️  Socket.IO Redis adapter unavailable — running single-instance", err as any);
  }

  // JWT handshake auth
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth as any)?.token ??
        (socket.handshake.query as any)?.token;
      if (!token) {
        logger.warn(`[socket] missing token from ${socket.handshake.address}`);
        return next(new Error("Auth required"));
      }
      const user = jwt.verify(token as string, env.JWT_ACCESS_SECRET);
      (socket as any).user = user;
      next();
    } catch (err: any) {
      logger.warn(`[socket] invalid token from ${socket.handshake.address}: ${err?.message}`);
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const u = (socket as any).user;
    const userId = u?.userId;
    if (userId) socket.join("user:" + userId);

    socket.on("match:join", (id: unknown) => {
      if (typeof id === "string" && id.length > 0 && id.length < 64) {
        socket.join("match:" + id);
      }
    });
    socket.on("match:leave", (id: unknown) => {
      if (typeof id === "string") socket.leave("match:" + id);
    });

    socket.on("error", (err) => {
      logger.error(`[socket] socket error user=${userId}:`, err);
    });
    socket.on("disconnect", (reason) => {
      logger.debug(`[socket] disconnect user=${userId} reason=${reason}`);
    });
  });

  io.engine.on("connection_error", (err: any) => {
    logger.warn(`[socket] connection_error code=${err?.code} msg=${err?.message}`);
  });

  logger.info("✅ Socket.IO ready");
  return io;
}

export const getIO = () => io;

/** Close the socket server — notify clients first, then stop accepting. */
export async function closeSocket(): Promise<void> {
  if (!io) return;
  try {
    io.emit("server:shutdown", { at: Date.now() });
  } catch {
    /* best-effort */
  }
  await new Promise<void>((resolve) => io!.close(() => resolve()));
}

export const emitToMatch = (id: string, ev: string, d: any) =>
  io?.to("match:" + id).emit(ev, d);
export const emitToUser = (id: string, ev: string, d: any) =>
  io?.to("user:" + id).emit(ev, d);
export const broadcastAll = (ev: string, d: any) => io?.emit(ev, d);
