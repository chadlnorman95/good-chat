import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { trackEvent } from "lib/analytics/analytics-service";
import { z } from "zod";

const trackEventSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  eventData: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = trackEventSchema.parse(body);
    
    // Get client information
    const userAgent = request.headers.get("user-agent") || undefined;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : 
                     request.headers.get("x-real-ip") || 
                     "unknown";

    await trackEvent({
      userId: session.user.id,
      eventType: validatedData.eventType,
      eventData: validatedData.eventData,
      sessionId: validatedData.sessionId,
      userAgent,
      ipAddress,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Analytics tracking error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}