import { NextRequest, NextResponse } from "next/server";
import { apiKeyService } from "lib/api-keys/api-key-service";

export async function GET(request: NextRequest) {
  try {
    const services = apiKeyService.getSupportedServices();

    return NextResponse.json({
      success: true,
      services,
    });

  } catch (error) {
    console.error("Get supported services error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}