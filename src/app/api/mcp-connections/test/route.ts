import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { mcpConnectionService } from "lib/mcp-connections/mcp-connection-service";
import { z } from "zod";

const TestConnectionSchema = z.object({
  config: z.object({
    url: z.string().url(),
    headers: z.record(z.string()).optional(),
  }).or(z.object({
    command: z.string(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { config } = TestConnectionSchema.parse(body);

    const result = await mcpConnectionService.testConnection(config);

    return NextResponse.json({
      success: result.success,
      error: result.error,
      latency: result.latency,
      serverInfo: result.serverInfo,
    });

  } catch (error) {
    console.error("Test MCP connection error:", error);
    
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