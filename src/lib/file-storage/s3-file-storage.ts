import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import type {
  FileStorage,
  UploadContent,
  UploadOptions,
  UploadResult,
  UploadUrlOptions,
  UploadUrl,
  FileMetadata,
} from "./file-storage.interface";

interface S3Config {
  bucket: string;
  region: string;
  prefix: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string; // For S3-compatible services
}

/**
 * Amazon S3 (or S3-compatible) storage backend implementation.
 * 
 * Supports:
 * - Direct server-side uploads
 * - Presigned URLs for client-side uploads
 * - File metadata management
 * - S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
 */
export const createS3FileStorage = (config?: Partial<S3Config>): FileStorage => {
  const s3Config: S3Config = {
    bucket: config?.bucket || process.env.FILE_STORAGE_S3_BUCKET || "",
    region: config?.region || process.env.FILE_STORAGE_S3_REGION || "us-east-1",
    prefix: config?.prefix || process.env.FILE_STORAGE_PREFIX || "uploads",
    accessKeyId: config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: config?.endpoint || process.env.FILE_STORAGE_S3_ENDPOINT,
  };

  if (!s3Config.bucket) {
    throw new Error("S3 bucket name is required. Set FILE_STORAGE_S3_BUCKET environment variable.");
  }

  const s3Client = new S3Client({
    region: s3Config.region,
    credentials: s3Config.accessKeyId && s3Config.secretAccessKey ? {
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
    } : undefined,
    endpoint: s3Config.endpoint,
    forcePathStyle: !!s3Config.endpoint, // Required for S3-compatible services
  });

  const generateKey = (filename?: string): string => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const id = nanoid(12);
    const extension = filename ? `.${filename.split('.').pop()}` : '';
    return `${s3Config.prefix}/${timestamp}/${id}${extension}`;
  };

  const getPublicUrl = (key: string): string => {
    if (s3Config.endpoint) {
      // For S3-compatible services, construct URL manually
      const baseUrl = s3Config.endpoint.replace(/\/$/, '');
      return `${baseUrl}/${s3Config.bucket}/${key}`;
    }
    // Standard S3 URL format
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  };

  const contentTypeFromFilename = (filename?: string): string => {
    if (!filename) return 'application/octet-stream';
    
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'json': 'application/json',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
    };
    
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  const convertContentToBuffer = async (content: UploadContent): Promise<Buffer> => {
    if (Buffer.isBuffer(content)) {
      return content;
    }
    
    if (content instanceof ArrayBuffer) {
      return Buffer.from(content);
    }
    
    if (content instanceof Blob || content instanceof File) {
      return Buffer.from(await content.arrayBuffer());
    }
    
    if (content instanceof ReadableStream) {
      const chunks: Uint8Array[] = [];
      const reader = content.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }
      
      return Buffer.concat(chunks);
    }
    
    // Handle Node.js ReadableStream
    if ('pipe' in content && typeof content.pipe === 'function') {
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        content.on('data', (chunk) => chunks.push(chunk));
        content.on('end', () => resolve(Buffer.concat(chunks)));
        content.on('error', reject);
      });
    }
    
    // Handle ArrayBufferView
    if (ArrayBuffer.isView(content)) {
      return Buffer.from(content.buffer, content.byteOffset, content.byteLength);
    }
    
    throw new Error('Unsupported content type for S3 upload');
  };

  return {
    async upload(content: UploadContent, options?: UploadOptions): Promise<UploadResult> {
      const key = generateKey(options?.filename);
      const buffer = await convertContentToBuffer(content);
      const contentType = options?.contentType || contentTypeFromFilename(options?.filename);

      const putObjectParams: PutObjectCommandInput = {
        Bucket: s3Config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          originalFilename: options?.filename || '',
          uploadedAt: new Date().toISOString(),
        },
      };

      await s3Client.send(new PutObjectCommand(putObjectParams));

      const metadata: FileMetadata = {
        key,
        filename: options?.filename || key.split('/').pop() || key,
        contentType,
        size: buffer.length,
        uploadedAt: new Date(),
      };

      return {
        key,
        sourceUrl: getPublicUrl(key),
        metadata,
      };
    },

    async createUploadUrl(options: UploadUrlOptions): Promise<UploadUrl | null> {
      const key = generateKey(options.filename);
      const expiresInSeconds = options.expiresInSeconds || 3600; // 1 hour default
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      const putObjectParams: PutObjectCommandInput = {
        Bucket: s3Config.bucket,
        Key: key,
        ContentType: options.contentType,
        Metadata: {
          originalFilename: options.filename,
          uploadedAt: new Date().toISOString(),
        },
      };

      const command = new PutObjectCommand(putObjectParams);
      const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });

      return {
        key,
        url,
        method: "PUT",
        expiresAt,
        headers: {
          'Content-Type': options.contentType,
        },
      };
    },

    async download(key: string): Promise<Buffer> {
      const command = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error(`File not found: ${key}`);
      }

      // Handle different body types
      if (response.Body instanceof ReadableStream) {
        const chunks: Uint8Array[] = [];
        const reader = response.Body.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
        } finally {
          reader.releaseLock();
        }
        
        return Buffer.concat(chunks);
      }

      // Handle Node.js ReadableStream
      if ('pipe' in response.Body && typeof response.Body.pipe === 'function') {
        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = [];
          response.Body.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.Body.on('end', () => resolve(Buffer.concat(chunks)));
          response.Body.on('error', reject);
        });
      }

      throw new Error('Unsupported response body type');
    },

    async delete(key: string): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
      });

      await s3Client.send(command);
    },

    async exists(key: string): Promise<boolean> {
      try {
        const command = new HeadObjectCommand({
          Bucket: s3Config.bucket,
          Key: key,
        });

        await s3Client.send(command);
        return true;
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          return false;
        }
        throw error;
      }
    },

    async getMetadata(key: string): Promise<FileMetadata | null> {
      try {
        const command = new HeadObjectCommand({
          Bucket: s3Config.bucket,
          Key: key,
        });

        const response = await s3Client.send(command);

        return {
          key,
          filename: response.Metadata?.originalFilename || key.split('/').pop() || key,
          contentType: response.ContentType || 'application/octet-stream',
          size: response.ContentLength || 0,
          uploadedAt: response.Metadata?.uploadedAt ? new Date(response.Metadata.uploadedAt) : response.LastModified,
        };
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          return null;
        }
        throw error;
      }
    },

    async getSourceUrl(key: string): Promise<string | null> {
      const exists = await this.exists(key);
      return exists ? getPublicUrl(key) : null;
    },

    async getDownloadUrl(key: string): Promise<string | null> {
      try {
        const command = new GetObjectCommand({
          Bucket: s3Config.bucket,
          Key: key,
          ResponseContentDisposition: 'attachment',
        });

        return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
      } catch (error) {
        return null;
      }
    },
  };
};
