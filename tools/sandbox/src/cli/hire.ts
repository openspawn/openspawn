// ── openspawn hire ───────────────────────────────────────────────────────────

import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { Command } from 'commander';
import { readConfig, writeConfig, findAgent, addAgent } from './config.js';
import { generateSoulMd, generateAgentsMd, generateToolsMd, generateUserMd } from './templates.js';

export function registerHireCommand(program: Command): void {
  program
    .command('hire')
    .description('Create a new agent in the org')
    .requiredOption('--name <name>', 'Agent name/id (lowercase, no spaces)')
    .requiredOption('--role <role>', 'Role title (e.g. "Engineering Lead")')
    .option('--level <level>', 'Agent level 1-10', '4')
    .option('--domain <domain>', 'Domain of expertise', 'general')
    .option('--reports-to <agentId>', 'Parent agent id')
    .option('--restart', 'Restart the gateway after adding agent')
    .action((opts) => {
      const agentId = opts.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const level = Math.min(10, Math.max(1, parseInt(opts.level, 10) || 4));

      // Check if agent already exists
      const config = readConfig();
      if (findAgent(config, agentId)) {
        console.error(`❌ Agent "${agentId}" already exists in config.`);
        process.exit(1);
      }

      // 1. Create workspace
      const ocDir = join(homedir(), '.openclaw');
      const workspaceDir = join(ocDir, `workspace-${agentId}`);
      const memoryDir = join(workspaceDir, 'memory');
      mkdirSync(memoryDir, { recursive: true });

      // 2. Generate workspace files
      writeFileSync(
        join(workspaceDir, 'SOUL.md'),
        generateSoulMd({ name: opts.name, role: opts.role, level, domain: opts.domain, reportsTo: opts.reportsTo }),
      );
      writeFileSync(join(workspaceDir, 'AGENTS.md'), generateAgentsMd());
      writeFileSync(join(workspaceDir, 'TOOLS.md'), generateToolsMd());
      writeFileSync(join(workspaceDir, 'USER.md'), generateUserMd());

      // 3. Update config
      const agentEntry: Record<string, unknown> = {
        id: agentId,
        name: opts.name,
        workspace: workspaceDir,
      };
      if (opts.reportsTo) {
        agentEntry.reportsTo = opts.reportsTo;
      }

      addAgent(config, agentEntry as any);
      writeConfig(config);

      // 4. Optionally restart gateway
      if (opts.restart) {
        console.log('⚠️  Restarting gateway — active sessions will be interrupted.');
        try {
          execSync('openclaw gateway restart', { stdio: 'inherit' });
        } catch {
          console.error('⚠️  Failed to restart gateway. You may need to restart manually.');
        }
      }

      // 5. Summary
      console.log(`
✅ Agent hired successfully!

  ID:        ${agentId}
  Role:      ${opts.role}
  Level:     L${level}
  Domain:    ${opts.domain}
  Reports to: ${opts.reportsTo || '(none)'}
  Workspace: ${workspaceDir}

Files created:
  - SOUL.md
  - AGENTS.md
  - TOOLS.md
  - USER.md
  - memory/

Config updated: ~/.openclaw/openclaw.json
${opts.restart ? 'Gateway restarted.' : 'Run with --restart to activate, or restart gateway manually.'}
`);
    });
}
