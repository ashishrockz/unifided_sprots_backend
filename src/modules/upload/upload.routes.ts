import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { uploadImage, uploadMedia } from "../../middleware/upload";
import { uploadToS3, deleteFromS3 } from "../../utils/s3";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS } from "../../constants";
import type { AuthRequest } from "../../types";

export const uploadRoutes = Router();
uploadRoutes.use(authenticate);

/** POST /upload/image — General image upload (any authenticated user) */
uploadRoutes.post("/image", uploadImage, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError(ERRORS.UPLOAD.NO_FILE);
  const result = await uploadToS3(req.file, "general");
  ok(res, result, "Image uploaded");
}));

/** POST /upload/avatar — Upload user avatar */
uploadRoutes.post("/avatar", uploadImage, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError(ERRORS.UPLOAD.NO_FILE);
  const result = await uploadToS3(req.file, "avatars");
  ok(res, result, "Avatar uploaded");
}));

/** POST /upload/ad-media — Upload ad media: image or video (admin only) */
uploadRoutes.post("/ad-media", authorize("super_admin", "content_manager"), uploadMedia, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError(ERRORS.UPLOAD.NO_FILE);
  const result = await uploadToS3(req.file, "ads");
  ok(res, result, "Media uploaded");
}));

/** POST /upload/sport-media — Upload sport assets: image or video (admin only) */
uploadRoutes.post("/sport-media", authorize("super_admin", "sport_admin"), uploadMedia, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError(ERRORS.UPLOAD.NO_FILE);
  const result = await uploadToS3(req.file, "sports");
  ok(res, result, "Media uploaded");
}));

/** POST /upload/post-media — Upload post media: image or video (any authenticated user) */
uploadRoutes.post("/post-media", uploadMedia, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError(ERRORS.UPLOAD.NO_FILE);
  const result = await uploadToS3(req.file, "posts");
  ok(res, result, "Media uploaded");
}));

/** DELETE /upload — Delete a file from S3 by key */
uploadRoutes.delete("/", authorize("super_admin", "content_manager"), asyncHandler(async (req, res) => {
  const { key } = req.body;
  if (!key) throw new AppError(ERRORS.UPLOAD.MISSING_KEY);
  await deleteFromS3(key);
  ok(res, null, "File deleted");
}));
