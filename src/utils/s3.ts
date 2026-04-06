/**
 * @file    utils/s3.ts
 * @desc    S3 upload/delete helpers using AWS SDK v3.
 *          Images are auto-compressed to ~1MB before upload.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import { env } from "../config/env";
import { logger } from "./logger";

if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
  logger.warn("AWS credentials not configured — S3 uploads will fail");
}

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB target

/**
 * Compress image buffer to ~1MB using sharp.
 * - Converts PNG/WebP/GIF to JPEG for smaller size
 * - Resizes if width > 1920px
 * - Reduces quality until under 1MB
 */
async function compressImage(buffer: Buffer, mimetype: string): Promise<{ buffer: Buffer; mimetype: string }> {
  // Skip GIF (animated) — just resize
  if (mimetype === "image/gif") {
    return { buffer, mimetype };
  }

  let img = sharp(buffer).rotate(); // auto-rotate from EXIF

  // Resize if too large
  const meta = await img.metadata();
  if (meta.width && meta.width > 1920) {
    img = img.resize(1920, undefined, { withoutEnlargement: true });
  }

  // If already under 1MB, just optimize lightly
  if (buffer.length <= MAX_IMAGE_BYTES) {
    const out = await img.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    return { buffer: out, mimetype: "image/jpeg" };
  }

  // Progressively reduce quality until under 1MB
  for (const quality of [80, 65, 50, 40]) {
    const out = await img.jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= MAX_IMAGE_BYTES) {
      logger.info(`Image compressed: ${(buffer.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB (q=${quality})`);
      return { buffer: out, mimetype: "image/jpeg" };
    }
  }

  // Last resort — resize down + low quality
  const out = await sharp(buffer)
    .rotate()
    .resize(1280, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 40, mozjpeg: true })
    .toBuffer();
  logger.info(`Image compressed (resized): ${(buffer.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`);
  return { buffer: out, mimetype: "image/jpeg" };
}

/**
 * Upload a file buffer to S3.
 * Images are auto-compressed before upload.
 */
export async function uploadToS3(
  file: { buffer: Buffer; originalname: string; mimetype: string },
  folder: string,
): Promise<{ url: string; key: string }> {
  let { buffer, mimetype } = file;
  let ext = path.extname(file.originalname);

  // Compress images
  if (IMAGE_TYPES.includes(mimetype)) {
    const compressed = await compressImage(buffer, mimetype);
    buffer = compressed.buffer;
    mimetype = compressed.mimetype;
    if (compressed.mimetype === "image/jpeg") ext = ".jpg";
  }

  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );
  } catch (err: any) {
    logger.error(`S3 upload failed: ${err.message}`);
    throw err;
  }

  const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  return { url, key };
}

/**
 * Delete a file from S3 by its key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
    }),
  );
}
