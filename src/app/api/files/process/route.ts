import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { fileProcessor, FileProcessingOptions } from "lib/file-processing/file-processor";
import { z } from "zod";

const fileProcessingSchema = z.object({
  extractText: z.boolean().default(true),
  generateThumbnails: z.boolean().default(false),
  generateSummary: z.boolean().default(false),
  extractKeywords: z.boolean().default(false),
  detectEntities: z.boolean().default(false),
  maxTextLength: z.number().min(100).max(50000).default(10000),
  thumbnailSizes: z.array(z.object({
    width: z.number().min(50).max(1000),
    height: z.number().min(50).max(1000),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const optionsStr = formData.get("options") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    // Parse processing options
    let options: FileProcessingOptions = {};
    if (optionsStr) {
      try {
        const parsedOptions = JSON.parse(optionsStr);
        options = fileProcessingSchema.parse(parsedOptions);
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid processing options" },
          { status: 400 }
        );
      }
    }

    // Process the file
    const result = await fileProcessor.processFile(file, file.name, options);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error("File processing error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return supported file types and processing capabilities
    const supportedTypes = {
      text: [
        'text/plain',
        'text/markdown',
        'text/html',
        'text/csv',
        'application/json',
        'application/xml',
      ],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      images: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/svg+xml',
      ],
      audio: [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
      ],
      video: [
        'video/mp4',
        'video/avi',
        'video/quicktime',
      ],
    };

    const capabilities = {
      textExtraction: true,
      thumbnailGeneration: true,
      summaryGeneration: true,
      keywordExtraction: true,
      entityDetection: true,
      metadataExtraction: true,
    };

    const limits = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxTextLength: 50000,
      maxThumbnailSize: { width: 1000, height: 1000 },
    };

    return NextResponse.json({
      supportedTypes,
      capabilities,
      limits,
    });

  } catch (error) {
    console.error("File processing info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}