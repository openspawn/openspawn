import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

export function startCommand(): void {
  const configPath = join(process.cwd(), 'openspawn.config.json');
  const legacyConfigPath = join(process.cwd(), 'bikinibottom.config.json');
  const actualConfigPath = existsSync(configPath) ? configPath : legacyConfigPath;

  if (!existsSync(actualConfigPath)) {
    console.log(`
\x1b[31m✗\x1b[0m No openspawn.config.json found in current directory.

Run \x1b[36mopenspawn init\x1b[0m first to scaffold a project.
`);
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(actualConfigPath, 'utf-8'));
  const port = config.port ?? 3333;
  const orgFile = config.orgFile ?? 'ORG.md';

  if (!existsSync(join(process.cwd(), orgFile))) {
    console.log(`\x1b[31m✗\x1b[0m ${orgFile} not found. Create one or run \x1b[36mopenspawn init\x1b[0m.`);
    process.exit(1);
  }

  console.log(`
\x1b[36m🪸 Starting OpenSpawn...\x1b[0m

Port:       ${port}
Org:        ${orgFile}
Protocols:  A2A ${config.protocols?.a2a ? '✓' : '✗'}  MCP ${config.protocols?.mcp ? '✓' : '✗'}
`);

  // Try to find the sandbox server
  const serverEntry = findServerEntry();

  if (serverEntry) {
    console.log(`\x1b[2mStarting sandbox server from ${serverEntry}\x1b[0m\n`);

    const child = spawn('npx', ['tsx', serverEntry], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: String(port),
        ORG_FILE: join(process.cwd(), orgFile),
      },
    });

    child.on('error', (err) => {
      console.error(`\x1b[31m✗\x1b[0m Failed to start server: ${err.message}`);
      console.log(`
\x1b[2mMake sure you have the sandbox package installed:
  npm install openspawn

Or run from the monorepo:
  cd tools/sandbox && npx tsx src/server.ts\x1b[0m
`);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });

    // Forward signals for clean shutdown
    process.on('SIGINT', () => child.kill('SIGINT'));
    process.on('SIGTERM', () => child.kill('SIGTERM'));
  } else {
    console.log(`\x1b[33m⚠\x1b[0m  Local sandbox server not found.

\x1b[1mOptions:\x1b[0m
  1. Try the live demo:      \x1b[36mhttps://bikinibottom.ai\x1b[0m
  2. Run from the monorepo:  \x1b[33mcd tools/sandbox && npx tsx src/server.ts\x1b[0m
  3. Use Docker:             \x1b[33mdocker run -p ${port}:3333 ghcr.io/openspawn/openspawn\x1b[0m

\x1b[2mFull local server support coming soon via npm install.\x1b[0m
`);
    process.exit(1);
  }
}

function findServerEntry(): string | null {
  const candidates = [
    // Monorepo development
    join(process.cwd(), '..', '..', 'tools', 'sandbox', 'src', 'server.ts'),
    join(process.cwd(), 'tools', 'sandbox', 'src', 'server.ts'),
    // npm installed package
    join(process.cwd(), 'node_modules', 'openspawn', 'sandbox', 'src', 'server.ts'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}
