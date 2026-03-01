#!/usr/bin/env node
// ── OpenSpawn CLI ────────────────────────────────────────────────────────────

import { parseArgs } from 'node:util';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { hireCommand } from './commands/hire.js';
import { fireCommand } from './commands/fire.js';
import { taskCommand } from './commands/task.js';
import { delegateCommand } from './commands/delegate.js';
import { escalateCommand } from './commands/escalate.js';
import { reportCommand } from './commands/report.js';
import { budgetCommand } from './commands/budget.js';

const HELP = `
openspawn - Multi-agent organization CLI

Usage: openspawn <command> [options]

Commands:
  init [name]                  Scaffold ORG.md + .openspawn/
  start                        Start MCP server
  status                       Show org status
  hire <name> [options]        Add agent to org
  fire <name>                  Remove agent from org
  task list                    List all tasks
  task create <desc>           Create task
  task next                    Claim next available task
  task done <id>               Mark task complete
  delegate --to <agent> --task <desc>
  escalate --task <id> --reason <R>
  report --status <S> [--pr N]
  budget [agent]               Show budget status

Options:
  --org-file <path>            Path to ORG.md (default: ./ORG.md)
  --dir <path>                 Working directory (default: .)
  --help, -h                   Show help
`.trim();

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  const command = args[0];
  const rest = args.slice(1);

  // Extract global flags
  const dirIdx = rest.indexOf('--dir');
  let dir = process.cwd();
  if (dirIdx >= 0 && rest[dirIdx + 1]) {
    dir = rest[dirIdx + 1];
    rest.splice(dirIdx, 2);
  }

  const orgIdx = rest.indexOf('--org-file');
  let orgFile: string | undefined;
  if (orgIdx >= 0 && rest[orgIdx + 1]) {
    orgFile = rest[orgIdx + 1];
    rest.splice(orgIdx, 2);
  }

  const ctx = { dir, orgFile };

  switch (command) {
    case 'init': return initCommand(rest, ctx);
    case 'start': return startCommand(rest, ctx);
    case 'status': return statusCommand(rest, ctx);
    case 'hire': return hireCommand(rest, ctx);
    case 'fire': return fireCommand(rest, ctx);
    case 'task': return taskCommand(rest, ctx);
    case 'delegate': return delegateCommand(rest, ctx);
    case 'escalate': return escalateCommand(rest, ctx);
    case 'report': return reportCommand(rest, ctx);
    case 'budget': return budgetCommand(rest, ctx);
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
