import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { getChatActivity } from "lib/analytics/analytics-service";
import { z } from "zod";

const activityQuerySchema = z.object({
  timeframe: z.enum(["day", "week", "month"]).default("week"),
  global: z.coerce.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = activityQuerySchema.parse(queryParams);
    
    const userId = validatedParams.global ? undefined : session.user.id;
    const activity = await getChatActivity(userId, validatedParams.timeframe);

    return NextResponse.json({
      activity,
      timeframe: validatedParams.timeframe,
      global: validatedParams.global,
    });

  } catch (error) {
    console.error("Analytics activity error:", error);
    
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