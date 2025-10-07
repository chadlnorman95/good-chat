import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { mcpConnectionService } from "lib/mcp-connections/mcp-connection-service";
import { z } from "zod";

const QuickConnectSchema = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  headers: z.record(z.string()).optional(),
  authToken: z.string().optional(),
  testConnection: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = QuickConnectSchema.parse(body);

    const result = await mcpConnectionService.quickConnect(validatedData);

    return NextResponse.json({
      success: result.success,
      config: result.config,
      error: result.error,
      discoveredInfo: result.discoveredInfo,
    });

  } catch (error) {
    console.error("Quick connect error:", error);
    
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