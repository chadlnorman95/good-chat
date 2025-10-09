import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { apiKeyService, CreateApiKeyRequest, UpdateApiKeyRequest } from "lib/api-keys/api-key-service";
import { z } from "zod";

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  service: z.string().min(1).max(50),
  value: z.string().min(1),
  description: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Validate API key format
    const validation = apiKeyService.validateApiKeyFormat(validatedData.service, validatedData.value);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid API key format" },
        { status: 400 }
      );
    }

    const apiKey = await apiKeyService.createApiKey(session.user.id, validatedData);

    return NextResponse.json({
      success: true,
      apiKey,
    });

  } catch (error) {
    console.error("Create API key error:", error);
    
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

    const apiKeys = await apiKeyService.getUserApiKeys(session.user.id);

    return NextResponse.json({
      success: true,
      apiKeys,
    });

  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}