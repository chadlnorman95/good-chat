import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { apiKeyService } from "lib/api-keys/api-key-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('keyId') || undefined;

    const stats = await apiKeyService.getUsageStats(session.user.id, keyId);

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error("Get API key stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}