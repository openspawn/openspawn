import { startMcpServer } from "../../mcp/server.js";

export async function startCommand(args: string[], ctx: { dir: string; orgFile?: string }) {
  const portIdx = args.indexOf("--port");
  const port = portIdx >= 0 ? parseInt(args[portIdx + 1]) || 3456 : 3456;
  const stdio = args.includes("--stdio");
  await startMcpServer({ dir: ctx.dir, orgFile: ctx.orgFile, port, stdio });
}
