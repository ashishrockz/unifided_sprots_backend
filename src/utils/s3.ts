/**
 * @file    utils/s3.ts
 * @desc    S3 upload/delete helpers using AWS SDK v3.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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

/**
 * Upload a file buffer to S3.
 * @param file   - Multer file object
 * @param folder - S3 folder prefix (e.g. "avatars", "ads", "media")
 * @returns      - Public URL of the uploaded file
 */
export async function uploadToS3(
  file: { buffer: Buffer; originalname: string; mimetype: string },
  folder: string,
): Promise<{ url: string; key: string }> {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    }),
  );

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
