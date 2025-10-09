import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { getUserStats, getUsageStats } from "lib/analytics/analytics-service";
import { z } from "zod";

const statsQuerySchema = z.object({
  timeframe: z.enum(["day", "week", "month", "all"]).default("week"),
  type: z.enum(["user", "global"]).default("user"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = statsQuerySchema.parse(queryParams);
    
    let stats;
    
    if (validatedParams.type === "global") {
      // Only allow admins to view global stats
      // For now, we'll allow all users - in production you'd check user role
      stats = await getUsageStats(validatedParams.timeframe);
    } else {
      stats = await getUserStats(session.user.id, validatedParams.timeframe);
    }

    return NextResponse.json({
      stats,
      timeframe: validatedParams.timeframe,
      type: validatedParams.type,
    });

  } catch (error) {
    console.error("Analytics stats error:", error);
    
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