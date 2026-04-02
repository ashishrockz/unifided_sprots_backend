/**
 * @file    utils/asyncHandler.ts
 * @desc    Wraps async route handlers so rejected promises are
 *          automatically forwarded to the Express error middleware.
 *          Eliminates try/catch in every controller method.
 */
import { Request, Response, NextFunction, RequestHandler } from "express";
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<any>;
export const asyncHandler = (fn: AsyncFn): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
