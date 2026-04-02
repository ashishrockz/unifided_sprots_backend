import { z } from "zod";
export const sendOtpSchema = z.object({
  identifier: z.string().min(1),
  type: z.enum(["email", "mobile"]),
});
export const verifyOtpSchema = z.object({
  identifier: z.string().min(1),
  type: z.enum(["email", "mobile"]),
  otp: z.string().length(6),
  deviceInfo: z
    .object({
      platform: z.string(),
      deviceId: z.string(),
      appVersion: z.string(),
    })
    .optional(),
});
export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
