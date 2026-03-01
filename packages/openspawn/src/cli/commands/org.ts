import { parseOrgMd } from '../../core/org-parser.js';
import type { Agent } from '../../core/types.js';

export async function orgCommand(_args: string[], ctx: { dir: string; orgFile?: string }) {
  const orgPath = ctx.orgFile ?? `${ctx.dir}/ORG.md`;
  const org = parseOrgMd(orgPath);

  if (!org.agents.length) {
    console.log('No agents found in ORG.md');
    return;
  }

  console.log(org.name);

  // Build children map
  const childrenOf = new Map<string | undefined, Agent[]>();
  for (const agent of org.agents) {
    const parent = agent.parentId;
    if (!childrenOf.has(parent)) childrenOf.set(parent, []);
    childrenOf.get(parent)!.push(agent);
  }

  // Find roots (no parent)
  const roots = childrenOf.get(undefined) ?? [];

  function printTree(agent: Agent, prefix: string, isLast: boolean) {
    const connector = isLast ? '└── ' : '├── ';
    const roleLabel = agent.role !== 'worker' ? agent.role : '';
    const parts = [agent.name];
    if (roleLabel) parts.push(`(${roleLabel}, L${agent.level})`);
    else parts.push(`(L${agent.level})`);
    console.log(`${prefix}${connector}${parts.join(' ')}`);

    const children = childrenOf.get(agent.id) ?? [];
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    children.forEach((child, i) => {
      printTree(child, nextPrefix, i === children.length - 1);
    });
  }

  roots.forEach((root, i) => {
    printTree(root, '', i === roots.length - 1);
  });
}
