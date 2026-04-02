import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";

export const uploadRoutes = Router();
uploadRoutes.use(authenticate, authorize("super_admin", "content_manager"));

/** POST /upload/ad-media — Upload ad media (placeholder until S3/Cloudinary) */
uploadRoutes.post("/ad-media", asyncHandler(async (req, res) => {
  // For now, accept a URL in body. In production, use multer + cloud storage.
  const url = req.body.url || req.body.media || "";
  ok(res, { url, publicId: "local_" + Date.now(), resourceType: "image", format: "png" }, "Media uploaded");
}));
