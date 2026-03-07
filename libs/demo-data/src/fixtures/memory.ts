import type { DemoMemory } from "../types";
import { AGENT_IDS } from "./agents";

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export const MEMORY_IDS = {
  ciPipelineInsight: "m0000000-0000-0000-0000-000000000001",
  apiRateLimit: "m0000000-0000-0000-0000-000000000002",
  budgetPattern: "m0000000-0000-0000-0000-000000000003",
  deploymentPlaybook: "m0000000-0000-0000-0000-000000000004",
  codeReviewChecklist: "m0000000-0000-0000-0000-000000000005",
  seoStrategy: "m0000000-0000-0000-0000-000000000006",
  leadScoringModel: "m0000000-0000-0000-0000-000000000007",
  onboardingFlow: "m0000000-0000-0000-0000-000000000008",
  bugTriageRules: "m0000000-0000-0000-0000-000000000009",
  copyToneGuide: "m0000000-0000-0000-0000-000000000010",
  frontendPatterns: "m0000000-0000-0000-0000-000000000011",
  qaRegressionPlan: "m0000000-0000-0000-0000-000000000012",
} as const;

export const demoMemories: DemoMemory[] = [
  {
    id: MEMORY_IDS.ciPipelineInsight,
    agentId: AGENT_IDS.codeReviewer,
    type: "semantic",
    visibility: "shared",
    source: "task_completion",
    content:
      "CI pipeline builds fail when Node version mismatches. Always pin Node 20.x in .nvmrc and Dockerfile. The nx affected command saves ~60% build time on PRs touching <5 projects.",
    tags: ["ci", "devops", "node", "nx"],
    confidence: 90,
    accessCount: 14,
    lastAccessedAt: hoursAgo(1),
    createdAt: daysAgo(12),
    updatedAt: daysAgo(2),
  },
  {
    id: MEMORY_IDS.apiRateLimit,
    agentId: AGENT_IDS.analyst,
    type: "episodic",
    visibility: "shared",
    source: "observation",
    content:
      "External analytics API rate-limits at 100 req/min. Batch requests with 500ms delay between batches of 10. Retry with exponential backoff on 429 responses.",
    tags: ["api", "rate-limit", "analytics"],
    confidence: 60,
    accessCount: 8,
    lastAccessedAt: hoursAgo(6),
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    id: MEMORY_IDS.budgetPattern,
    agentId: AGENT_IDS.bookkeeper,
    type: "semantic",
    visibility: "shared",
    source: "inference",
    content:
      "Model costs spike on Mondays and Fridays. Monday spikes correlate with sprint planning (many agents querying simultaneously). Friday spikes are from end-of-week report generation.",
    tags: ["budget", "costs", "patterns"],
    confidence: 40,
    accessCount: 5,
    lastAccessedAt: daysAgo(1),
    createdAt: daysAgo(15),
    updatedAt: daysAgo(3),
  },
  {
    id: MEMORY_IDS.deploymentPlaybook,
    agentId: AGENT_IDS.codeReviewer,
    type: "semantic",
    visibility: "shared",
    source: "task_completion",
    content:
      "Production deploys require: 1) All CI checks green, 2) At least one L5+ approval, 3) No open P0/P1 bugs, 4) Deploy window Mon-Thu 10am-4pm UTC. Rollback within 15 min if error rate >1%.",
    tags: ["deployment", "production", "playbook"],
    confidence: 90,
    accessCount: 22,
    lastAccessedAt: hoursAgo(3),
    createdAt: daysAgo(25),
    updatedAt: daysAgo(1),
  },
  {
    id: MEMORY_IDS.codeReviewChecklist,
    agentId: AGENT_IDS.codeReviewer,
    type: "semantic",
    visibility: "shared",
    source: "code_change",
    content:
      "Code review priorities: 1) Security (injection, auth bypass), 2) Data integrity (migrations, schema changes), 3) Performance (N+1 queries, missing indexes), 4) Correctness, 5) Style (auto-handled by oxlint/oxfmt).",
    tags: ["code-review", "checklist", "quality"],
    confidence: 85,
    accessCount: 31,
    lastAccessedAt: hoursAgo(2),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(4),
  },
  {
    id: MEMORY_IDS.seoStrategy,
    agentId: AGENT_IDS.seoBot,
    type: "episodic",
    visibility: "private",
    source: "task_completion",
    content:
      "Blog posts with 1500-2500 words rank best for our target keywords. Include 3-5 internal links and 2-3 external authority links. Publish Tuesdays or Wednesdays for peak organic reach.",
    tags: ["seo", "content", "strategy"],
    confidence: 90,
    accessCount: 7,
    lastAccessedAt: daysAgo(2),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: MEMORY_IDS.leadScoringModel,
    agentId: AGENT_IDS.prospector,
    type: "semantic",
    visibility: "targeted",
    source: "inference",
    content:
      "Lead scoring weights: Company size (25%), tech stack match (20%), engagement recency (20%), role seniority (15%), industry fit (10%), budget signals (10%). Leads scoring >70 should be routed to Account Manager immediately.",
    tags: ["sales", "leads", "scoring"],
    confidence: 40,
    accessCount: 12,
    lastAccessedAt: hoursAgo(8),
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
  },
  {
    id: MEMORY_IDS.onboardingFlow,
    agentId: AGENT_IDS.onboardingAgent,
    type: "episodic",
    visibility: "shared",
    source: "observation",
    content:
      "New agent onboarding takes 2-3 simulated days. Agents that complete the sandbox tutorial before live tasks have 40% fewer errors in their first week. Always assign a buddy agent at L5+.",
    tags: ["onboarding", "training", "agents"],
    confidence: 60,
    accessCount: 4,
    lastAccessedAt: daysAgo(3),
    createdAt: daysAgo(14),
    updatedAt: daysAgo(7),
  },
  {
    id: MEMORY_IDS.bugTriageRules,
    agentId: AGENT_IDS.bugHunter,
    type: "semantic",
    visibility: "shared",
    source: "task_completion",
    content:
      "Bug triage: P0 = data loss or security breach (fix immediately), P1 = feature broken for >10% users (fix within 4h), P2 = degraded experience (fix this sprint), P3 = cosmetic/minor (backlog). Always check error logs + Sentry before investigating.",
    tags: ["bugs", "triage", "priorities"],
    confidence: 90,
    accessCount: 18,
    lastAccessedAt: hoursAgo(4),
    createdAt: daysAgo(22),
    updatedAt: daysAgo(6),
  },
  {
    id: MEMORY_IDS.copyToneGuide,
    agentId: AGENT_IDS.copywriter,
    type: "semantic",
    visibility: "private",
    source: "code_change",
    content:
      "Brand voice: Professional but approachable. Avoid jargon unless targeting developers. Use active voice. Headlines should be benefit-driven, not feature-driven. Max 3 CTAs per page.",
    tags: ["copy", "brand", "guidelines"],
    confidence: 85,
    accessCount: 9,
    lastAccessedAt: daysAgo(1),
    createdAt: daysAgo(16),
    updatedAt: daysAgo(3),
  },
  {
    id: MEMORY_IDS.frontendPatterns,
    agentId: AGENT_IDS.frontendDev,
    type: "semantic",
    visibility: "shared",
    source: "code_change",
    content:
      "Use shadcn/ui components with Tailwind. No barrel files. Keep event handlers in named functions above JSX (handleClickSave, handleChangeName). Animations under 300ms with spring transitions. Respect prefers-reduced-motion.",
    tags: ["frontend", "react", "patterns", "tailwind"],
    confidence: 85,
    accessCount: 15,
    lastAccessedAt: hoursAgo(5),
    createdAt: daysAgo(19),
    updatedAt: daysAgo(2),
  },
  {
    id: MEMORY_IDS.qaRegressionPlan,
    agentId: AGENT_IDS.qaEngineer,
    type: "episodic",
    visibility: "shared",
    source: "task_completion",
    content:
      "Regression test suite covers: auth flows, task CRUD, credit transactions, agent spawning, webhook delivery. Run full suite before every release. Flaky tests should be quarantined within 24h, not skipped.",
    tags: ["qa", "testing", "regression"],
    confidence: 90,
    accessCount: 10,
    lastAccessedAt: daysAgo(1),
    createdAt: daysAgo(11),
    updatedAt: daysAgo(4),
  },
];

export function getMemoriesByAgent(agentId: string): DemoMemory[] {
  return demoMemories.filter((m) => m.agentId === agentId);
}

export function getMemoriesByType(type: DemoMemory["type"]): DemoMemory[] {
  return demoMemories.filter((m) => m.type === type);
}

export function getMemoriesByTag(tag: string): DemoMemory[] {
  return demoMemories.filter((m) => m.tags.includes(tag));
}

export function searchMemories(query: string): DemoMemory[] {
  const lower = query.toLowerCase();
  return demoMemories.filter(
    (m) => m.content.toLowerCase().includes(lower) || m.tags.some((t) => t.includes(lower)),
  );
}
