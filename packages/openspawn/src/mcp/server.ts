// ── MCP Server (Streamable HTTP + stdio) ─────────────────────────────────────

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "node:http";
import { registerTools } from "./tools.js";

export interface ServerOptions {
  dir: string;
  orgFile?: string;
  port?: number;
  stdio?: boolean;
}

export async function startMcpServer(opts: ServerOptions): Promise<void> {
  const { dir, orgFile, port = 3456, stdio = false } = opts;

  const server = new McpServer({
    name: "openspawn",
    version: "0.1.0",
  });

  registerTools(server, dir, orgFile);

  if (stdio) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return;
  }

  const httpServer = createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/mcp") {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined as any });
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } else if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", name: "openspawn" }));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  httpServer.listen(port, () => {
    console.log(`OpenSpawn MCP server listening on http://localhost:${port}/mcp`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`Working dir: ${dir}`);
    if (orgFile) console.log(`Org file: ${orgFile}`);
  });
}
