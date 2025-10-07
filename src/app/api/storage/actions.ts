"use server";

import { storageDriver } from "lib/file-storage";
import { IS_VERCEL_ENV } from "lib/const";

/**
 * Get storage configuration info.
 * Used by clients to determine upload strategy.
 */
export async function getStorageInfoAction() {
  return {
    type: storageDriver,
    supportsDirectUpload:
      storageDriver === "vercel-blob" || storageDriver === "s3",
  };
}

interface StorageCheckResult {
  isValid: boolean;
  error?: string;
  solution?: string;
}

/**
 * Check if storage is properly configured.
 * Returns detailed error messages with solutions.
 */
export async function checkStorageAction(): Promise<StorageCheckResult> {
  // 1. Check Vercel Blob configuration
  if (storageDriver === "vercel-blob") {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        isValid: false,
        error: "BLOB_READ_WRITE_TOKEN is not set",
        solution:
          "Please add Vercel Blob to your project:\n" +
          "1. Go to your Vercel Dashboard\n" +
          "2. Navigate to Storage tab\n" +
          "3. Create a new Blob Store\n" +
          "4. Connect it to your project\n" +
          (IS_VERCEL_ENV
            ? "5. Redeploy your application"
            : "5. Run 'vercel env pull' to get the token locally"),
      };
    }
  }

  // 2. Check S3 configuration
  if (storageDriver === "s3") {
    const requiredEnvVars = [
      "FILE_STORAGE_S3_BUCKET",
      "AWS_ACCESS_KEY_ID", 
      "AWS_SECRET_ACCESS_KEY"
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        isValid: false,
        error: `Missing required S3 environment variables: ${missingVars.join(", ")}`,
        solution:
          "Please set the following environment variables:\n" +
          "- FILE_STORAGE_S3_BUCKET: Your S3 bucket name\n" +
          "- FILE_STORAGE_S3_REGION: AWS region (optional, defaults to us-east-1)\n" +
          "- AWS_ACCESS_KEY_ID: Your AWS access key\n" +
          "- AWS_SECRET_ACCESS_KEY: Your AWS secret key\n" +
          "- FILE_STORAGE_S3_ENDPOINT: Custom endpoint for S3-compatible services (optional)",
      };
    }
  }

  // 3. Validate storage driver
  if (!["vercel-blob", "s3"].includes(storageDriver)) {
    return {
      isValid: false,
      error: `Invalid storage driver: ${storageDriver}`,
      solution:
        "FILE_STORAGE_TYPE must be one of:\n" +
        "- 'vercel-blob' (default)\n" +
        "- 's3' (fully supported)",
    };
  }

  return {
    isValid: true,
  };
}
