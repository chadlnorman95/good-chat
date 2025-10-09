import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { knowledgeBaseService } from "lib/knowledge-base/knowledge-base-service";
import { z } from "zod";

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  summary: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  sourceType: z.enum(['manual', 'file_upload', 'chat_export', 'web_import']).default('manual'),
  sourceMetadata: z.object({
    filename: z.string().optional(),
    url: z.string().optional(),
    chatId: z.string().optional(),
    fileType: z.string().optional(),
  }).optional(),
  isPublic: z.boolean().default(false),
});

const updateDocumentSchema = createDocumentSchema.partial();

const getDocumentsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  sortBy: z.enum(['created', 'updated', 'accessed', 'title']).default('updated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDocumentSchema.parse(body);

    const document = await knowledgeBaseService.createDocument({
      ...validatedData,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      document,
    });

  } catch (error) {
    console.error("Create document error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
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

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getDocumentsSchema.parse(params);

    const result = await knowledgeBaseService.getUserDocuments(
      session.user.id,
      validatedParams
    );

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error("Get documents error:", error);
    
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