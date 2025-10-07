import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { mcpConnectionService } from "lib/mcp-connections/mcp-connection-service";
import { z } from "zod";

const DiscoverSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = DiscoverSchema.parse(body);

    const discoveredInfo = await mcpConnectionService.discoverServerInfo(url);
    const validation = mcpConnectionService.validateUrl(url);

    return NextResponse.json({
      success: true,
      discoveredInfo,
      validation,
    });

  } catch (error) {
    console.error("Discover MCP server error:", error);
    
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