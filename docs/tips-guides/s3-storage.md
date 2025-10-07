# S3 Storage Configuration Guide

This guide explains how to configure Amazon S3 or S3-compatible storage services for file uploads in Better Chatbot.

## Overview

The S3 storage driver provides enterprise-grade file storage with the following features:

- **Direct server-side uploads** for AI-generated content
- **Presigned URLs** for secure client-side uploads
- **File metadata management** with automatic content type detection
- **S3-compatible services** support (MinIO, DigitalOcean Spaces, etc.)
- **Comprehensive error handling** and validation

## Quick Setup

### 1. Amazon S3

1. Create an S3 bucket in your AWS account
2. Create an IAM user with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

3. Configure your environment variables:

```env
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=your-bucket-name
FILE_STORAGE_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
FILE_STORAGE_PREFIX=uploads
```

### 2. S3-Compatible Services

#### MinIO (Self-hosted)

```env
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=your-bucket-name
FILE_STORAGE_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
FILE_STORAGE_S3_ENDPOINT=http://localhost:9000
FILE_STORAGE_PREFIX=uploads
```

#### DigitalOcean Spaces

```env
FILE_STORAGE_TYPE=s3
FILE_STORAGE_S3_BUCKET=your-space-name
FILE_STORAGE_S3_REGION=nyc3
AWS_ACCESS_KEY_ID=your-spaces-key
AWS_SECRET_ACCESS_KEY=your-spaces-secret
FILE_STORAGE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
FILE_STORAGE_PREFIX=uploads
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FILE_STORAGE_TYPE` | Yes | `vercel-blob` | Set to `s3` to enable S3 storage |
| `FILE_STORAGE_S3_BUCKET` | Yes | - | S3 bucket name |
| `FILE_STORAGE_S3_REGION` | No | `us-east-1` | AWS region |
| `AWS_ACCESS_KEY_ID` | Yes | - | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | Yes | - | AWS secret access key |
| `FILE_STORAGE_S3_ENDPOINT` | No | - | Custom endpoint for S3-compatible services |
| `FILE_STORAGE_PREFIX` | No | `uploads` | Prefix for all uploaded files |

## Features

### Automatic Content Type Detection

The S3 storage driver automatically detects content types based on file extensions:

- **Images**: `.jpg`, `.png`, `.gif`, `.webp`
- **Documents**: `.pdf`, `.docx`, `.xlsx`
- **Media**: `.mp4`, `.mp3`, `.wav`
- **Text**: `.txt`, `.json`, `.csv`
- **Fallback**: `application/octet-stream`

### File Organization

Files are automatically organized with the following structure:

```
uploads/
├── 2024-01-15/
│   ├── abc123def456.jpg
│   └── xyz789uvw012.pdf
├── 2024-01-16/
│   └── mno345pqr678.docx
```

- **Date-based folders**: `YYYY-MM-DD` format
- **Unique identifiers**: 12-character nanoid
- **Original extensions**: Preserved from uploaded files

### Presigned URLs

For client-side uploads, the driver generates secure presigned URLs:

```typescript
const uploadUrl = await storage.createUploadUrl({
  filename: 'document.pdf',
  contentType: 'application/pdf',
  expiresInSeconds: 3600, // 1 hour
});

// Client can upload directly to uploadUrl.url
```

### Metadata Management

File metadata is automatically stored and retrieved:

```typescript
const metadata = await storage.getMetadata('uploads/2024-01-15/abc123def456.jpg');
// Returns:
// {
//   key: 'uploads/2024-01-15/abc123def456.jpg',
//   filename: 'profile-picture.jpg',
//   contentType: 'image/jpeg',
//   size: 245760,
//   uploadedAt: Date
// }
```

## Security Considerations

### Bucket Permissions

- **Private buckets**: Recommended for sensitive data
- **Public read**: Only if you need direct public access to files
- **CORS configuration**: Required for client-side uploads

Example CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Access Keys

- **Principle of least privilege**: Only grant necessary S3 permissions
- **Rotation**: Regularly rotate access keys
- **Environment variables**: Never commit keys to version control

## Troubleshooting

### Common Issues

1. **Bucket not found**
   - Verify `FILE_STORAGE_S3_BUCKET` is correct
   - Ensure bucket exists in the specified region

2. **Access denied**
   - Check IAM permissions
   - Verify access keys are correct
   - Ensure bucket policy allows the operations

3. **CORS errors** (client-side uploads)
   - Configure CORS policy on the bucket
   - Verify allowed origins match your domain

4. **Endpoint connection issues** (S3-compatible services)
   - Verify `FILE_STORAGE_S3_ENDPOINT` is accessible
   - Check if service requires `forcePathStyle: true`

### Testing Configuration

Use the built-in storage check:

```bash
# The app will validate S3 configuration on startup
pnpm dev

# Or check via API
curl http://localhost:3000/api/storage/check
```

### Debug Logging

Enable debug logging to troubleshoot issues:

```env
DEBUG=s3*
```

## Migration from Vercel Blob

To migrate existing files from Vercel Blob to S3:

1. **Backup existing data**
2. **Update environment variables**
3. **Test with new uploads**
4. **Migrate existing files** (custom script required)

Example migration script structure:

```typescript
// scripts/migrate-to-s3.ts
import { serverFileStorage as oldStorage } from 'lib/file-storage/vercel-blob-storage';
import { createS3FileStorage } from 'lib/file-storage/s3-file-storage';

const s3Storage = createS3FileStorage();

// Migrate files...
```

## Performance Optimization

### Upload Performance

- **Direct uploads**: Use presigned URLs for large files
- **Multipart uploads**: For files > 100MB (implement if needed)
- **Compression**: Consider client-side compression

### Download Performance

- **CDN**: Use CloudFront or similar CDN
- **Caching**: Implement appropriate cache headers
- **Regions**: Choose regions close to your users

## Cost Optimization

- **Storage classes**: Use appropriate S3 storage classes
- **Lifecycle policies**: Automatically transition or delete old files
- **Monitoring**: Track storage usage and costs

Example lifecycle policy:

```json
{
  "Rules": [
    {
      "Status": "Enabled",
      "Filter": {"Prefix": "uploads/"},
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

## Support

For issues specific to S3 storage:

1. Check the [troubleshooting section](#troubleshooting)
2. Review AWS S3 documentation
3. Open an issue with detailed error logs