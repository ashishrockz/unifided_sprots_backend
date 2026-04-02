/**
 * ─────────────────────────────────────────────────────────────────
 * @file    utils/response.ts
 * @desc    Standardized response helpers. Every controller uses these
 *          instead of calling res.json() directly. This ensures a
 *          consistent JSON envelope across all 120+ endpoints.
 * ─────────────────────────────────────────────────────────────────
 */
import { Response } from "express";
import type { PaginationMeta } from "../types";

/** 200 success with data */
export const ok = <T>(res: Response, data: T, message: string): Response =>
  res.status(200).json({ success: true, message, data });

/** 201 created */
export const created = <T>(res: Response, data: T, message: string): Response =>
  res.status(201).json({ success: true, message, data });

/** 200 paginated list */
export const paginated = <T>(res: Response, data: T[], pagination: PaginationMeta, message: string): Response =>
  res.status(200).json({ success: true, message, data, pagination });

/** 204 no content */
export const noContent = (res: Response): Response =>
  res.status(204).send();

/**
 * Build pagination metadata from page, limit, and total count.
 * Used by every list endpoint.
 */
export const buildPage = (page: number, limit: number, total: number): PaginationMeta => {
  const totalPages = Math.ceil(total / limit) || 1;
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
};

/**
 * Parse and sanitize pagination query parameters.
 * Clamps page ≥ 1 and 1 ≤ limit ≤ 100.
 */
export const parseQuery = (q: Record<string, any>) => {
  const page = Math.max(1, parseInt(q?.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q?.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};
