import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { knowledgeBaseService } from "lib/knowledge-base/knowledge-base-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await knowledgeBaseService.getUserStats(session.user.id);

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error("Get knowledge base stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}