import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { searchChats, searchMessages, SearchFilters, SearchResult } from "lib/search/search-service";
import { z } from "zod";

const searchQuerySchema = z.object({
  q: z.string().min(1, "Query is required"),
  type: z.enum(["all", "chats", "messages"]).default("all"),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  projectId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = searchQuerySchema.parse(queryParams);
    
    const filters: SearchFilters = {
      userId: session.user.id,
      projectId: validatedParams.projectId,
      dateFrom: validatedParams.dateFrom ? new Date(validatedParams.dateFrom) : undefined,
      dateTo: validatedParams.dateTo ? new Date(validatedParams.dateTo) : undefined,
    };

    let results: SearchResult[] = [];

    switch (validatedParams.type) {
      case "chats":
        results = await searchChats(
          validatedParams.q,
          filters,
          validatedParams.limit,
          validatedParams.offset
        );
        break;
      case "messages":
        results = await searchMessages(
          validatedParams.q,
          filters,
          validatedParams.limit,
          validatedParams.offset
        );
        break;
      case "all":
      default:
        const [chatResults, messageResults] = await Promise.all([
          searchChats(validatedParams.q, filters, Math.ceil(validatedParams.limit / 2), 0),
          searchMessages(validatedParams.q, filters, Math.ceil(validatedParams.limit / 2), 0),
        ]);
        results = [...chatResults, ...messageResults]
          .sort((a, b) => b.score - a.score)
          .slice(0, validatedParams.limit);
        break;
    }

    return NextResponse.json({
      results,
      query: validatedParams.q,
      type: validatedParams.type,
      total: results.length,
      hasMore: results.length === validatedParams.limit,
    });

  } catch (error) {
    console.error("Search error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
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
    const validatedParams = searchQuerySchema.parse(body);
    
    const filters: SearchFilters = {
      userId: session.user.id,
      projectId: validatedParams.projectId,
      dateFrom: validatedParams.dateFrom ? new Date(validatedParams.dateFrom) : undefined,
      dateTo: validatedParams.dateTo ? new Date(validatedParams.dateTo) : undefined,
    };

    let results: SearchResult[] = [];

    switch (validatedParams.type) {
      case "chats":
        results = await searchChats(
          validatedParams.q,
          filters,
          validatedParams.limit,
          validatedParams.offset
        );
        break;
      case "messages":
        results = await searchMessages(
          validatedParams.q,
          filters,
          validatedParams.limit,
          validatedParams.offset
        );
        break;
      case "all":
      default:
        const [chatResults, messageResults] = await Promise.all([
          searchChats(validatedParams.q, filters, Math.ceil(validatedParams.limit / 2), 0),
          searchMessages(validatedParams.q, filters, Math.ceil(validatedParams.limit / 2), 0),
        ]);
        results = [...chatResults, ...messageResults]
          .sort((a, b) => b.score - a.score)
          .slice(0, validatedParams.limit);
        break;
    }

    return NextResponse.json({
      results,
      query: validatedParams.q,
      type: validatedParams.type,
      total: results.length,
      hasMore: results.length === validatedParams.limit,
    });

  } catch (error) {
    console.error("Search error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}