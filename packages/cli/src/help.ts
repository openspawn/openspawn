import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
    return pkg.version;
  } catch {
    return '0.1.0';
  }
}

export function showHelp(): void {
  console.log(`
\x1b[36m🪸 OpenSpawn\x1b[0m — AI Agent Orchestration

  The control plane your AI agents deserve.
  32 agents. A2A + MCP protocols. Real-time dashboard.

\x1b[1mCommands:\x1b[0m
  init [name]    Scaffold a new agent organization
  start          Start the local control plane server
  status         Show current server status
  demo           Start with a demo scenario running

\x1b[1mOptions:\x1b[0m
  --help, -h     Show this help
  --version, -v  Show version

\x1b[1mExamples:\x1b[0m
  $ npx openspawn init my-org
  $ cd my-org && openspawn start
  $ openspawn status

Learn more: \x1b[36mhttps://openspawn.ai\x1b[0m
GitHub:     \x1b[36mhttps://github.com/openspawn/openspawn\x1b[0m
`);
}
