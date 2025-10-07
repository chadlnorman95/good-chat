import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { knowledgeBaseService } from "lib/knowledge-base/knowledge-base-service";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sourceType: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['relevance', 'created', 'updated', 'accessed']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    // Handle tags parameter (can be comma-separated)
    if (params.tags) {
      params.tags = params.tags.split(',').map((tag: string) => tag.trim());
    }

    const validatedParams = searchSchema.parse(params);

    const result = await knowledgeBaseService.searchDocuments({
      ...validatedParams,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error("Search documents error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    const result = await knowledgeBaseService.searchDocuments({
      ...validatedData,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error("Search documents error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}