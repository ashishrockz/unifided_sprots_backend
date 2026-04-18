/**
 * @file    modules/auth/auth.service.ts
 * @desc    Authentication business logic — OTP lifecycle, JWT
 *          issuance, admin password auth, token refresh/revoke.
 */
import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../../config/env";
import { getRedis } from "../../config/redis";
import { User } from "../users/user.model";
import { AppError } from "../../utils/AppError";
import { ERRORS } from "../../constants";
import { logger } from "../../utils/logger";
import { sendOtpEmail } from "../../utils/mailer";
import { sendOtpSms, isSmsLoginEnabled } from "../../utils/sms";
import type { TokenPair, JwtPayload } from "../../types";

export class AuthService {
  /** Generate 6-digit OTP, store in Redis with TTL, deliver via email/SMS */
  static async sendOtp(identifier: string, type: "email" | "mobile") {
    // If type is mobile, check if SMS login is enabled from admin config
    if (type === "mobile") {
      const enabled = await isSmsLoginEnabled();
      if (!enabled) {
        throw new AppError(ERRORS.BUSINESS.SMS_LOGIN_DISABLED);
      }
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await getRedis().set(
      `otp:${type}:${identifier}`,
      otp,
      "EX",
      env.OTP_EXPIRY_SECONDS,
    );
    logger.info(`OTP for ${identifier}: ${otp}`);

    // Deliver OTP via the appropriate channel
    if (type === "email") {
      const sent = await sendOtpEmail(identifier, otp);
      if (!sent) logger.warn(`Email delivery failed for ${identifier} — OTP still in Redis`);
    } else {
      const sent = await sendOtpSms(identifier, otp);
      if (!sent) logger.warn(`SMS delivery failed for ${identifier} — OTP still in Redis`);
    }

    return otp;
  }

  /** Verify OTP → auto-register if new → issue token pair */
  static async verifyOtp(
    identifier: string,
    type: "email" | "mobile",
    otp: string,
    deviceInfo?: any,
  ) {
    const redis = getRedis(),
      key = `otp:${type}:${identifier}`;
    const stored = await redis.get(key);
    if (!stored || stored !== otp) throw new AppError(ERRORS.AUTH.INVALID_OTP);
    await redis.del(key);

    const q = type === "email" ? { email: identifier } : { mobile: identifier };
    let user = await User.findOne(q);
    if (!user) {
      const username = `user_${crypto.randomBytes(4).toString("hex")}`;
      user = await User.create({
        ...q,
        username,
        displayName: username,
        deviceInfo,
      });
    }
    user.lastLoginAt = new Date();
    if (deviceInfo) user.deviceInfo = deviceInfo;
    await user.save();

    const tokens = this._tokens({
      userId: user._id.toString(),
      role: user.role,
    });
    await redis.set(
      `refresh:${user._id}`,
      tokens.refreshToken,
      "EX",
      30 * 24 * 3600,
    );
    return { user, tokens };
  }

  /** Admin email + password authentication */
  static async adminLogin(email: string, password: string) {
    const user = await User.findOne({ email, role: "admin" }).select(
      "+password",
    );
    if (!user?.password) throw new AppError(ERRORS.AUTH.INVALID_CREDENTIALS);
    if (!(await bcrypt.compare(password, user.password)))
      throw new AppError(ERRORS.AUTH.INVALID_CREDENTIALS);
    user.lastLoginAt = new Date();
    await user.save();
    const role = user.adminRole ?? "admin";
    const tokens = this._tokens({ userId: user._id.toString(), role });
    await getRedis().set(
      `refresh:${user._id}`,
      tokens.refreshToken,
      "EX",
      30 * 24 * 3600,
    );
    return { user, tokens };
  }

  /** Exchange refresh token for new pair */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const d = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
      const redis = getRedis();
      if ((await redis.get(`refresh:${d.userId}`)) !== refreshToken)
        throw new AppError(ERRORS.AUTH.INVALID_REFRESH);
      const tokens = this._tokens({ userId: d.userId, role: d.role });
      await redis.set(
        `refresh:${d.userId}`,
        tokens.refreshToken,
        "EX",
        30 * 24 * 3600,
      );
      return tokens;
    } catch {
      throw new AppError(ERRORS.AUTH.INVALID_REFRESH);
    }
  }

  /** Revoke refresh token */
  static async logout(userId: string) {
    await getRedis().del(`refresh:${userId}`);
  }

  /** Blacklist the current access token on logout */
  static async blacklistToken(token: string) {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti) {
        const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
        if (ttl > 0) {
          await getRedis().set(`bl:${decoded.jti}`, "1", "EX", ttl);
        }
      }
    } catch {
      // Token already expired or invalid — no need to blacklist
    }
  }

  /** Check if a token's jti is blacklisted */
  static async isBlacklisted(jti: string): Promise<boolean> {
    if (!jti) return false;
    const val = await getRedis().get(`bl:${jti}`);
    return val === "1";
  }

  /** Generate JWT access + refresh pair */
  private static _tokens(p: { userId: string; role: string }): TokenPair {
    const jti = crypto.randomBytes(16).toString("hex");
    return {
      accessToken: jwt.sign({ ...p, jti }, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRY,
      } as any),
      refreshToken: jwt.sign(p, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRY,
      } as any),
    };
  }
}
