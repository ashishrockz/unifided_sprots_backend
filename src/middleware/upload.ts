/**
 * @file    middleware/upload.ts
 * @desc    Multer middleware for file uploads (memory storage → S3).
 */
import multer from "multer";
import { AppError } from "../utils/AppError";
import { ERRORS } from "../constants";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50 MB

const storage = multer.memoryStorage();

/** Single image upload — field name: "file" */
export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(ERRORS.UPLOAD.INVALID_TYPE));
  },
}).single("file");

/** Single media upload (image or video) — field name: "file" */
export const uploadMedia = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (MEDIA_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError(ERRORS.UPLOAD.INVALID_MEDIA_TYPE));
  },
}).single("file");
