import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { getSearchSuggestions } from "lib/search/search-service";
import { z } from "zod";

const suggestionsQuerySchema = z.object({
  q: z.string().min(1, "Query is required"),
  limit: z.coerce.number().min(1).max(20).default(5),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = suggestionsQuerySchema.parse(queryParams);
    
    const suggestions = await getSearchSuggestions(
      session.user.id,
      validatedParams.q,
      validatedParams.limit
    );

    return NextResponse.json({
      suggestions,
      query: validatedParams.q,
    });

  } catch (error) {
    console.error("Search suggestions error:", error);
    
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