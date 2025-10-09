import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createS3FileStorage } from './s3-file-storage';
import type { FileStorage } from './file-storage.interface';

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

describe('S3FileStorage', () => {
  let storage: FileStorage;
  let mockS3Client: any;

  beforeEach(() => {
    // Reset environment variables
    process.env.FILE_STORAGE_S3_BUCKET = 'test-bucket';
    process.env.FILE_STORAGE_S3_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.FILE_STORAGE_PREFIX = 'test-uploads';

    // Mock S3Client
    const { S3Client } = require('@aws-sdk/client-s3');
    mockS3Client = {
      send: vi.fn(),
    };
    S3Client.mockImplementation(() => mockS3Client);

    storage = createS3FileStorage();
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up environment variables
    delete process.env.FILE_STORAGE_S3_BUCKET;
    delete process.env.FILE_STORAGE_S3_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.FILE_STORAGE_PREFIX;
  });

  describe('Configuration', () => {
    it('should throw error when bucket is not configured', () => {
      delete process.env.FILE_STORAGE_S3_BUCKET;
      
      expect(() => createS3FileStorage()).toThrow(
        'S3 bucket name is required. Set FILE_STORAGE_S3_BUCKET environment variable.'
      );
    });

    it('should use custom configuration when provided', () => {
      const customConfig = {
        bucket: 'custom-bucket',
        region: 'eu-west-1',
        prefix: 'custom-prefix',
      };

      expect(() => createS3FileStorage(customConfig)).not.toThrow();
    });

    it('should support S3-compatible services with custom endpoint', () => {
      const customConfig = {
        bucket: 'minio-bucket',
        endpoint: 'http://localhost:9000',
      };

      expect(() => createS3FileStorage(customConfig)).not.toThrow();
    });
  });

  describe('upload', () => {
    it('should upload buffer content successfully', async () => {
      const testBuffer = Buffer.from('test content');
      const mockResponse = { ETag: '"test-etag"' };
      
      mockS3Client.send.mockResolvedValueOnce(mockResponse);

      const result = await storage.upload(testBuffer, {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

      expect(result).toMatchObject({
        sourceUrl: expect.stringContaining('test-bucket'),
        metadata: {
          filename: 'test.txt',
          contentType: 'text/plain',
          size: testBuffer.length,
        },
      });

      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should handle File objects', async () => {
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test-etag"' });

      const result = await storage.upload(testFile, {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

      expect(result.metadata.filename).toBe('test.txt');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });

    it('should auto-detect content type from filename', async () => {
      const testBuffer = Buffer.from('test content');
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test-etag"' });

      const result = await storage.upload(testBuffer, {
        filename: 'test.pdf',
      });

      expect(result.metadata.contentType).toBe('application/pdf');
    });

    it('should generate unique keys with timestamp and nanoid', async () => {
      const testBuffer = Buffer.from('test content');
      mockS3Client.send.mockResolvedValueOnce({ ETag: '"test-etag"' });

      const result = await storage.upload(testBuffer, {
        filename: 'test.txt',
      });

      expect(result.key).toMatch(/^test-uploads\/\d{4}-\d{2}-\d{2}\/[a-zA-Z0-9_-]{12}\.txt$/);
    });
  });

  describe('createUploadUrl', () => {
    it('should create presigned upload URL', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
      
      getSignedUrl.mockResolvedValueOnce(mockUrl);

      const result = await storage.createUploadUrl({
        filename: 'test.txt',
        contentType: 'text/plain',
        expiresInSeconds: 1800,
      });

      expect(result).toMatchObject({
        url: mockUrl,
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      expect(result?.expiresAt).toBeInstanceOf(Date);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('download', () => {
    it('should download file as buffer', async () => {
      const testContent = 'test file content';
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(testContent));
          controller.close();
        },
      });

      mockS3Client.send.mockResolvedValueOnce({
        Body: mockStream,
      });

      const result = await storage.download('test-key');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe(testContent);
    });

    it('should throw error when file not found', async () => {
      mockS3Client.send.mockResolvedValueOnce({
        Body: null,
      });

      await expect(storage.download('non-existent-key')).rejects.toThrow(
        'File not found: non-existent-key'
      );
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      mockS3Client.send.mockResolvedValueOnce({});

      await expect(storage.delete('test-key')).resolves.not.toThrow();
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      mockS3Client.send.mockResolvedValueOnce({
        ContentLength: 100,
        LastModified: new Date(),
      });

      const result = await storage.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      const error = new Error('Not Found');
      error.name = 'NotFound';
      mockS3Client.send.mockRejectedValueOnce(error);

      const result = await storage.exists('non-existent-key');

      expect(result).toBe(false);
    });

    it('should throw error for other S3 errors', async () => {
      const error = new Error('Access Denied');
      error.name = 'AccessDenied';
      mockS3Client.send.mockRejectedValueOnce(error);

      await expect(storage.exists('test-key')).rejects.toThrow('Access Denied');
    });
  });

  describe('getMetadata', () => {
    it('should return file metadata', async () => {
      const mockResponse = {
        ContentType: 'text/plain',
        ContentLength: 100,
        LastModified: new Date('2023-01-01'),
        Metadata: {
          originalFilename: 'original.txt',
          uploadedAt: '2023-01-01T00:00:00.000Z',
        },
      };

      mockS3Client.send.mockResolvedValueOnce(mockResponse);

      const result = await storage.getMetadata('test-key');

      expect(result).toMatchObject({
        key: 'test-key',
        filename: 'original.txt',
        contentType: 'text/plain',
        size: 100,
        uploadedAt: new Date('2023-01-01T00:00:00.000Z'),
      });
    });

    it('should return null when file does not exist', async () => {
      const error = new Error('Not Found');
      error.name = 'NotFound';
      mockS3Client.send.mockRejectedValueOnce(error);

      const result = await storage.getMetadata('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('getSourceUrl', () => {
    it('should return public URL for existing file', async () => {
      // Mock exists call
      mockS3Client.send.mockResolvedValueOnce({
        ContentLength: 100,
      });

      const result = await storage.getSourceUrl('test-key');

      expect(result).toBe('https://test-bucket.s3.us-east-1.amazonaws.com/test-key');
    });

    it('should return null for non-existent file', async () => {
      const error = new Error('Not Found');
      error.name = 'NotFound';
      mockS3Client.send.mockRejectedValueOnce(error);

      const result = await storage.getSourceUrl('non-existent-key');

      expect(result).toBeNull();
    });
  });

  describe('getDownloadUrl', () => {
    it('should return presigned download URL', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/download-url';
      
      getSignedUrl.mockResolvedValueOnce(mockUrl);

      const result = await storage.getDownloadUrl('test-key');

      expect(result).toBe(mockUrl);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should return null on error', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockRejectedValueOnce(new Error('Access denied'));

      const result = await storage.getDownloadUrl('test-key');

      expect(result).toBeNull();
    });
  });

  describe('Content Type Detection', () => {
    const testCases = [
      { filename: 'test.jpg', expected: 'image/jpeg' },
      { filename: 'test.png', expected: 'image/png' },
      { filename: 'test.pdf', expected: 'application/pdf' },
      { filename: 'test.xlsx', expected: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { filename: 'test.mp4', expected: 'video/mp4' },
      { filename: 'test.unknown', expected: 'application/octet-stream' },
      { filename: undefined, expected: 'application/octet-stream' },
    ];

    testCases.forEach(({ filename, expected }) => {
      it(`should detect content type for ${filename || 'undefined'} as ${expected}`, async () => {
        const testBuffer = Buffer.from('test content');
        mockS3Client.send.mockResolvedValueOnce({ ETag: '"test-etag"' });

        const result = await storage.upload(testBuffer, { filename });

        expect(result.metadata.contentType).toBe(expected);
      });
    });
  });
});