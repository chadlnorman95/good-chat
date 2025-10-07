import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV) {
      console.log("🚀 Starting Good Chat without database dependencies");
      
      // Initialize MCP manager with simplified setup
      try {
        const initMCPManager = await import("./lib/ai/mcp/mcp-manager").then(
          (m) => m.initMCPManager,
        );
        await initMCPManager();
        console.log("✅ MCP Manager initialized successfully");
      } catch (e) {
        console.log("⚠️ MCP Manager init failed, continuing with basic functionality:", e.message);
      }
    }
  }
}
