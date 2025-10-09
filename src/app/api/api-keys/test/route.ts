import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { apiKeyService } from "lib/api-keys/api-key-service";
import { z } from "zod";

const testApiKeySchema = z.object({
  keyId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { keyId } = testApiKeySchema.parse(body);

    const testResult = await apiKeyService.testApiKey(session.user.id, keyId);

    return NextResponse.json({
      success: true,
      result: testResult,
    });

  } catch (error) {
    console.error("Test API key error:", error);
    
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