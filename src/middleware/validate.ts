/**
 * @file    middleware/validate.ts
 * @desc    Zod validation middleware factory.
 *          validate(schema) → validates req.body
 *          validate(schema, "query") → validates req.query
 */
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodEffects } from "zod";
export const validate = (schema: AnyZodObject | ZodEffects<AnyZodObject>, target: "body" | "query" | "params" = "body") =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try { req[target] = await schema.parseAsync(req[target]); next(); }
    catch (e) { next(e); }
  };
