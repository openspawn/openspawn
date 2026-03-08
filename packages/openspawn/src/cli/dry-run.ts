import { parseOrgMdContent } from "../core/org-parser.js";

interface DryRunResult {
  agentCount: number;
  departments: number;
  sampleTask: {
    title: string;
    assignee: string;
    priority: string;
  };
  delegationChain: string[];
}

export function simulateDryRun(orgContent: string): DryRunResult {
  const org = parseOrgMdContent(orgContent);
  const agents = org.agents;

  // Count unique parentIds to estimate departments
  const parentIds = new Set(agents.map((a) => a.parentId).filter(Boolean));
  // top-level agents (no parent) each represent a department head
  const topLevel = agents.filter((a) => !a.parentId);

  // Find the highest-level agent (the leader)
  const leader = agents.reduce((best, a) => (a.level > best.level ? a : best), agents[0]);

  // Build delegation chain: leader → first direct report → first sub-report
  const chain: string[] = [];
  let current = leader;
  while (current) {
    chain.push(`${current.name} (L${current.level})`);
    const report = agents.find((a) => a.parentId === current.id);
    if (!report) break;
    current = report;
  }

  return {
    agentCount: agents.length,
    departments: Math.max(parentIds.size, topLevel.length),
    sampleTask: {
      title: "Sample onboarding task",
      assignee: leader.name,
      priority: "medium",
    },
    delegationChain: chain,
  };
}
