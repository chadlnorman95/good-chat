import { createDbBasedMCPConfigsStorage } from "./db-mcp-config-storage";
import { createFileBasedMCPConfigsStorage } from "./fb-mcp-config-storage";
import { createMCPClientsManager } from "./create-mcp-clients-manager";
import { FILE_BASED_MCP_CONFIG } from "lib/const";
declare global {
  // eslint-disable-next-line no-var
  // use any to avoid cross-package type mismatch for global singleton
  var __mcpClientsManager__: any;
}

if (!globalThis.__mcpClientsManager__) {
  // Choose the appropriate storage implementation based on environment
  const storage = FILE_BASED_MCP_CONFIG
    ? createFileBasedMCPConfigsStorage()
    : createDbBasedMCPConfigsStorage();
  // assign as any to avoid type mismatch across module boundaries
  (globalThis as any).__mcpClientsManager__ = createMCPClientsManager(
    storage,
  ) as any;
}

export const initMCPManager = async () => {
  if (!(globalThis as any).__mcpClientsManager__) {
    throw new Error("MCP clients manager is not initialized");
  }
  return (globalThis as any).__mcpClientsManager__.init();
};

export const mcpClientsManager = (globalThis as any).__mcpClientsManager__;
