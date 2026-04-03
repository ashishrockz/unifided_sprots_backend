import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../users/user.model";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { AppError } from "../../utils/AppError";
import { ERRORS, MSG } from "../../constants";
import { uploadImage } from "../../middleware/upload";
import { uploadToS3 } from "../../utils/s3";
import type { AuthRequest } from "../../types";

export const adminProfileRoutes = Router();
adminProfileRoutes.use(authenticate, authorize("super_admin", "sport_admin", "content_manager", "support_agent"));

/** PUT /admin/me — Update admin profile (displayName) */
adminProfileRoutes.put("/me", asyncHandler(async (req: AuthRequest, res) => {
  const updates: Record<string, any> = {};
  if (req.body.name) updates.displayName = req.body.name;
  if (req.body.displayName) updates.displayName = req.body.displayName;
  const user = await User.findByIdAndUpdate(req.user!.userId, { $set: updates }, { new: true }).select("-password -__v");
  if (!user) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
  ok(res, { user }, MSG.UPDATED("Profile"));
}));

/** PUT /admin/me/password — Change admin password */
adminProfileRoutes.put("/me/password", asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.userId).select("+password");
  if (!user) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
  const valid = await bcrypt.compare(req.body.currentPassword, user.password || "");
  if (!valid) throw new AppError(ERRORS.AUTH.INVALID_CREDENTIALS);
  user.password = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  ok(res, null, MSG.UPDATED("Password"));
}));

/** POST /admin/me/avatar — Upload avatar to S3 */
adminProfileRoutes.post("/me/avatar", uploadImage, asyncHandler(async (req: AuthRequest, res) => {
  if (!req.file) throw new AppError(ERRORS.UPLOAD.NO_FILE);
  const { url } = await uploadToS3(req.file, "avatars");
  const user = await User.findByIdAndUpdate(
    req.user!.userId,
    { avatar: url },
    { new: true },
  ).select("-password -__v");
  if (!user) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
  ok(res, { user }, MSG.UPDATED("Avatar"));
}));

/** POST /admin/forgot-password — Send password reset (placeholder) */
adminProfileRoutes.post("/forgot-password", asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, role: "admin" });
  // Always return success to prevent email enumeration
  ok(res, null, "If the email exists, a reset link has been sent");
}));

/** POST /admin/reset-password — Reset password with token (placeholder) */
adminProfileRoutes.post("/reset-password", asyncHandler(async (req, res) => {
  // In production, verify token from email link
  ok(res, null, MSG.UPDATED("Password"));
}));
