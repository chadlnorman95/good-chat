import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { apiKeyService } from "lib/api-keys/api-key-service";
import { z } from "zod";

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeValue = searchParams.get('includeValue') === 'true';

    if (includeValue) {
      const apiKey = await apiKeyService.getApiKey(session.user.id, params.id);
      if (!apiKey) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        apiKey,
      });
    } else {
      const apiKeys = await apiKeyService.getUserApiKeys(session.user.id);
      const apiKey = apiKeys.find(key => key.id === params.id);
      
      if (!apiKey) {
        return NextResponse.json(
          { error: "API key not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        apiKey,
      });
    }

  } catch (error) {
    console.error("Get API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateApiKeySchema.parse(body);

    const apiKey = await apiKeyService.updateApiKey(
      session.user.id,
      params.id,
      validatedData
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      apiKey,
    });

  } catch (error) {
    console.error("Update API key error:", error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await apiKeyService.deleteApiKey(session.user.id, params.id);

    if (!success) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    });

  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}