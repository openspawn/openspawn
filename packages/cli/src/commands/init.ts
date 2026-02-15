import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_CONFIG = {
  port: 3333,
  orgFile: 'ORG.md',
  simulation: {
    mode: 'deterministic',
    tickInterval: 3000,
    startMode: 'full',
  },
  router: {
    preferLocal: true,
    providers: ['ollama', 'groq'],
  },
  protocols: {
    a2a: true,
    mcp: true,
  },
};

export function initCommand(name?: string): void {
  const targetDir = name ? resolve(process.cwd(), name) : process.cwd();

  if (name && !existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // Write ORG.md from template
  const templatePath = join(__dirname, '..', 'templates', 'ORG.md');
  let orgTemplate: string;
  try {
    orgTemplate = readFileSync(templatePath, 'utf-8');
  } catch {
    // Fallback if templates dir is alongside dist
    const altPath = join(__dirname, '..', '..', 'templates', 'ORG.md');
    orgTemplate = readFileSync(altPath, 'utf-8');
  }

  writeFileSync(join(targetDir, 'ORG.md'), orgTemplate);
  writeFileSync(join(targetDir, 'openspawn.config.json'), JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n');
  writeFileSync(join(targetDir, '.gitignore'), 'node_modules/\n.env\ndata/\n');

  const prefix = name ? `  cd ${name}\n` : '';

  console.log(`
\x1b[36m🪸 OpenSpawn initialized!\x1b[0m

Created:
  ORG.md                 — Define your agent organization
  openspawn.config.json  — Configuration
  .gitignore

Next steps:
${prefix}  1. Edit ORG.md to customize your agents
  2. Run: openspawn start
  3. Open: http://localhost:3333

Protocols enabled:
  🔗 A2A  → http://localhost:3333/.well-known/agent.json
  🔌 MCP  → http://localhost:3333/mcp
`);
}
