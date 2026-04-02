/**
 * @file    middleware/maintenance.ts
 * @desc    Checks Redis for maintenance flag. Returns 503 when active.
 */
import { Request, Response, NextFunction } from "express";
import { getRedis } from "../config/redis";
import { AppError } from "../utils/AppError";
import { ERRORS } from "../constants";
export async function maintenanceCheck(_req: Request, _res: Response, next: NextFunction) {
  try { if (await getRedis().get("config:maintenance_mode") === "true") throw new AppError(ERRORS.SYSTEM.MAINTENANCE); next(); }
  catch (e) { next(e); }
}
