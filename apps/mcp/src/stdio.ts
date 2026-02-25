#!/usr/bin/env node
/**
 * OpenSpawn MCP Server - stdio mode
 * For use with OpenClaw and other MCP clients
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server";

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  
  // Keep running until stdin closes
  process.stdin.resume();
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
