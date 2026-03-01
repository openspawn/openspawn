import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function initCommand(args: string[], ctx: { dir: string }) {
  const name = args[0] || 'My Organization';
  const orgPath = join(ctx.dir, 'ORG.md');
  const dotDir = join(ctx.dir, '.openspawn');

  if (existsSync(orgPath)) {
    console.log('ORG.md already exists, skipping.');
  } else {
    writeFileSync(orgPath, `# ${name}

## Culture

- **Preset:** balanced
- **Escalation:** normal
- **Progress Updates:** on-completion

## Policies

- **Per-Agent Limit:** $50

## Structure

### CEO — executive

- **Level:** 10
- **Domain:** operations
`);
    console.log(`Created ORG.md for "${name}"`);
  }

  mkdirSync(dotDir, { recursive: true });
  const tasksPath = join(dotDir, 'tasks.json');
  if (!existsSync(tasksPath)) {
    writeFileSync(tasksPath, JSON.stringify({ version: 1, tasks: [], budgets: {} }, null, 2) + '\n');
    console.log('Created .openspawn/tasks.json');
  }

  console.log('OpenSpawn initialized.');
}
