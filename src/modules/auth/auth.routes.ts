import { Router } from "express";
import { AuthService } from "./auth.service";
import { User } from "../users/user.model";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { otpLimiter, authLimiter } from "../../middleware/rateLimiter";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { ok } from "../../utils/response";
import { ERRORS, MSG } from "../../constants";
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshSchema,
  adminLoginSchema,
} from "./auth.validation";

export const authRoutes = Router();
authRoutes.post(
  "/otp/send",
  otpLimiter,
  validate(sendOtpSchema),
  asyncHandler(async (req, res) => {
    await AuthService.sendOtp(req.body.identifier, req.body.type);
    ok(res, null, MSG.OTP_SENT);
  }),
);
authRoutes.post(
  "/otp/verify",
  authLimiter,
  validate(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    const r = await AuthService.verifyOtp(
      req.body.identifier,
      req.body.type,
      req.body.otp,
      req.body.deviceInfo,
    );
    ok(res, r, MSG.AUTH_SUCCESS);
  }),
);
authRoutes.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await AuthService.refreshToken(req.body.refreshToken),
      MSG.TOKEN_REFRESHED,
    );
  }),
);
authRoutes.post(
  "/logout",
  authenticate,
  asyncHandler(async (req: any, res) => {
    // Blacklist the access token so it can't be reused
    const token = req.headers.authorization?.split(" ")[1];
    if (token) await AuthService.blacklistToken(token);
    await AuthService.logout(req.user!.userId);
    ok(res, null, MSG.LOGGED_OUT);
  }),
);
authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req: any, res) => {
    const u = await User.findById(req.user?.userId);
    if (!u) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
    ok(res, u, MSG.PROFILE_FETCHED);
  }),
);

export const adminAuthRoutes = Router();
adminAuthRoutes.post(
  "/login",
  authLimiter,
  validate(adminLoginSchema),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await AuthService.adminLogin(req.body.email, req.body.password),
      MSG.AUTH_SUCCESS,
    );
  }),
);
adminAuthRoutes.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await AuthService.refreshToken(req.body.refreshToken),
      MSG.TOKEN_REFRESHED,
    );
  }),
);
adminAuthRoutes.post(
  "/logout",
  authenticate,
  asyncHandler(async (req: any, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) await AuthService.blacklistToken(token);
    await AuthService.logout(req.user!.userId);
    ok(res, null, MSG.LOGGED_OUT);
  }),
);
adminAuthRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req: any, res) => {
    const u = await User.findById(req.user?.userId);
    if (!u) throw new AppError(ERRORS.RESOURCE.USER_NOT_FOUND);
    ok(res, u, MSG.PROFILE_FETCHED);
  }),
);
