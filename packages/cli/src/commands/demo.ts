import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function demoCommand(): void {
  const configPath = join(process.cwd(), 'bikinibottom.config.json');

  if (!existsSync(configPath)) {
    console.log(`
\x1b[31m✗\x1b[0m No bikinibottom.config.json found in current directory.

Run \x1b[33mbikinibottom init\x1b[0m first to scaffold a project.
`);
    process.exit(1);
  }

  console.log(`
\x1b[33m🍍 Starting BikiniBottom Demo...\x1b[0m

Sending demo task: "Build a REST API for user management"
Watch the agents coordinate at http://localhost:3333

\x1b[2mNote: Full local server requires the sandbox package.
For now, try the live demo at https://bikinibottom.ai

Or run from the monorepo:
  cd tools/sandbox && npm start\x1b[0m
`);
}
