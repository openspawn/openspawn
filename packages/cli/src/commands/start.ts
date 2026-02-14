import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function startCommand(): void {
  const configPath = join(process.cwd(), 'bikinibottom.config.json');

  if (!existsSync(configPath)) {
    console.log(`
\x1b[31m✗\x1b[0m No bikinibottom.config.json found in current directory.

Run \x1b[33mbikinibottom init\x1b[0m first to scaffold a project.
`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  const port = config.port ?? 3333;
  const a2a = config.protocols?.a2a ? '✓' : '✗';
  const mcp = config.protocols?.mcp ? '✓' : '✗';

  console.log(`
\x1b[33m🍍 Starting BikiniBottom...\x1b[0m

Port:       ${port}
Agents:     Loading from ${config.orgFile ?? 'ORG.md'}...
Protocols:  A2A ${a2a}  MCP ${mcp}

\x1b[2mNote: Full local server requires the sandbox package.
For now, try the live demo at https://bikinibottom.ai

Or run from the monorepo:
  cd tools/sandbox && npm start\x1b[0m
`);
}
