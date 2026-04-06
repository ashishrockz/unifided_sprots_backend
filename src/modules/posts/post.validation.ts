/**
 * @file    modules/posts/post.validation.ts
 * @desc    Zod schemas for post operations.
 */
import { z } from "zod";

/** POST /posts — Create post */
export const createPostSchema = z.object({
  content: z.string().max(2000).optional().default(""),
  media: z
    .array(
      z.object({
        url: z.string().url(),
        key: z.string(),
        type: z.enum(["image", "video"]),
      }),
    )
    .max(10)
    .optional()
    .default([]),
});

/** POST /posts/:id/comments — Add comment */
export const addCommentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(500),
});
