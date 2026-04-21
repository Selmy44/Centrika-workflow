import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for DigitalOcean Spaces
const spacesClient = new S3Client({
  region: process.env.SPACES_REGION || "nyc3",
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY || "",
    secretAccessKey: process.env.SPACES_SECRET_KEY || "",
  },
  endpoint: process.env.SPACES_ENDPOINT || "https://nyc3.digitaloceanspaces.com",
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.SPACES_BUCKET || "www.xentripay.com";

/**
 * Check if DigitalOcean Spaces is properly configured
 */
export function isSpacesConfigured(): boolean {
  return !!(process.env.SPACES_ACCESS_KEY && process.env.SPACES_SECRET_KEY);
}

/**
 * Generate a unique file key for storage in Spaces
 */
export function generateFileKey(
  requestId: number,
  fileType: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "");
  return `uploads/request-${requestId}-${fileType}-${timestamp}-${sanitizedFileName}`;
}

/**
 * Upload file to DigitalOcean Spaces
 */
export async function uploadFileToSpaces(
  fileBuffer: Buffer,
  fileKey: string,
  mimeType: string = "application/octet-stream"
): Promise<{ url: string; key: string }> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read", // Make file publicly readable
    });

    await spacesClient.send(command);

    // Construct the public URL
    const url = `https://${BUCKET_NAME}.${process.env.SPACES_REGION || "nyc3"}.digitaloceanspaces.com/${fileKey}`;

    return { url, key: fileKey };
  } catch (error) {
    console.error("Error uploading file to Spaces:", error);
    throw new Error(
      `Failed to upload file to Spaces: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate a signed URL for downloading file (optional, for private access)
 */
export async function getSignedDownloadUrl(
  fileKey: string,
  expirationSeconds: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(spacesClient, command, {
      expiresIn: expirationSeconds,
    });

    return signedUrl;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Delete file from Spaces
 */
export async function deleteFileFromSpaces(fileKey: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await spacesClient.send(command);
  } catch (error) {
    console.error("Error deleting file from Spaces:", error);
    throw new Error("Failed to delete file from Spaces");
  }
}

/**
 * Validate file type and size
 */
export function validateFile(
  fileBuffer: Buffer,
  mimeType: string,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (fileBuffer.length > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ];

  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, error: "File type not allowed" };
  }

  return { valid: true };
}
