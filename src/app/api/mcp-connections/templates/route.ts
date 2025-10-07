import { NextRequest, NextResponse } from "next/server";
import { auth } from "lib/auth/server";
import { mcpConnectionService } from "lib/mcp-connections/mcp-connection-service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const popular = searchParams.get('popular') === 'true';

    let templates = mcpConnectionService.getPopularTemplates();

    if (category) {
      templates = mcpConnectionService.getTemplatesByCategory(category);
    }

    if (search) {
      templates = mcpConnectionService.searchTemplates(search);
    }

    if (popular) {
      templates = templates.filter(t => t.isPopular);
    }

    const categories = mcpConnectionService.getCategories();

    return NextResponse.json({
      success: true,
      templates,
      categories,
    });

  } catch (error) {
    console.error("Get MCP templates error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}