// ── Warm-Up Scenario ─────────────────────────────────────────────────────────
// Dynamic scenario that generates starter tasks from the org's actual domains.
// Default for `openspawn preview` — shows agents hiring, delegating, and working.

import type {
  ScenarioDefinition,
  EpicTemplate,
  TaskTemplate,
  SubtaskTemplate,
} from "../scenario-types.js";
import { Difficulty, ResourceType } from "../scenario-types.js";
import type { SandboxAgent } from "../types.js";

// ── Task recipes per domain ─────────────────────────────────────────────────
// Each domain gets a set of realistic starter tasks. Unknown domains get generic ones.

interface TaskRecipe {
  title: string;
  subtasks: string[];
}

const DOMAIN_RECIPES: Record<string, TaskRecipe[]> = {
  engineering: [
    {
      title: "Set up CI pipeline",
      subtasks: ["Configure build steps", "Add lint + test gates", "Set up deploy preview"],
    },
    {
      title: "Implement API health endpoint",
      subtasks: ["Add /health route", "Wire readiness checks", "Add monitoring integration"],
    },
  ],
  operations: [
    {
      title: "Establish team standup cadence",
      subtasks: ["Define standup format", "Schedule recurring meetings", "Set up async fallback"],
    },
    {
      title: "Create incident response playbook",
      subtasks: ["Define severity levels", "Map escalation paths", "Write runbook template"],
    },
  ],
  research: [
    {
      title: "Competitive landscape analysis",
      subtasks: ["Identify top competitors", "Compare feature matrices", "Draft summary report"],
    },
    {
      title: "User persona research",
      subtasks: ["Survey target segments", "Synthesize interview data", "Create persona cards"],
    },
  ],
  "content strategy": [
    {
      title: "Content calendar for Q1",
      subtasks: ["Audit existing content", "Identify topic gaps", "Schedule publishing cadence"],
    },
    {
      title: "Brand voice guidelines",
      subtasks: ["Define tone attributes", "Write example copy", "Create style checklist"],
    },
  ],
  writing: [
    {
      title: "Draft launch blog post",
      subtasks: ["Outline key points", "Write first draft", "Edit and finalize"],
    },
  ],
  "visual design": [
    {
      title: "Design system foundations",
      subtasks: ["Define color palette", "Set up typography scale", "Create component tokens"],
    },
  ],
  security: [
    {
      title: "Initial security audit",
      subtasks: ["Scan for vulnerabilities", "Review access controls", "Document findings"],
    },
  ],
  quality: [
    {
      title: "QA process setup",
      subtasks: [
        "Define test coverage targets",
        "Set up test framework",
        "Create test plan template",
      ],
    },
  ],
  marketing: [
    {
      title: "Launch marketing plan",
      subtasks: ["Define target audience", "Choose channels", "Create campaign timeline"],
    },
  ],
  finance: [
    {
      title: "Budget tracking setup",
      subtasks: ["Define cost categories", "Create tracking spreadsheet", "Set alert thresholds"],
    },
  ],
  support: [
    {
      title: "Support workflow setup",
      subtasks: ["Define ticket categories", "Create response templates", "Set SLA targets"],
    },
  ],
};

const GENERIC_RECIPES: TaskRecipe[] = [
  {
    title: "Domain audit and planning",
    subtasks: ["Review current state", "Identify quick wins", "Prioritize backlog"],
  },
  {
    title: "Process documentation",
    subtasks: ["Map current workflows", "Identify bottlenecks", "Write process guide"],
  },
];

// ── Builder ─────────────────────────────────────────────────────────────────

function getRecipesForDomain(domain: string): TaskRecipe[] {
  const lower = domain.toLowerCase();
  if (DOMAIN_RECIPES[lower]) return DOMAIN_RECIPES[lower];

  // Fuzzy match: check if any key is contained in the domain name
  for (const [key, recipes] of Object.entries(DOMAIN_RECIPES)) {
    if (lower.includes(key) || key.includes(lower)) return recipes;
  }

  return GENERIC_RECIPES;
}

function buildSubtasks(names: string[]): SubtaskTemplate[] {
  return names.map((title) => ({ title, durationRange: [2, 3] as [number, number] }));
}

function buildTaskTemplate(
  epicId: string,
  index: number,
  recipe: TaskRecipe,
  domain: string,
): TaskTemplate {
  return {
    id: `${epicId}-task-${index + 1}`,
    title: recipe.title,
    domain,
    subtasks: buildSubtasks(recipe.subtasks),
    durationRange: [2, 3],
    reviewRequired: index === 0,
    ...(index === 0 ? { reviewLoop: { maxIterations: 2, weights: [0.7, 0.2, 0.08, 0.02] } } : {}),
  };
}

function buildEpicForDomain(domain: string, phaseId: string, index: number): EpicTemplate {
  const epicId = `warm-up-${domain.toLowerCase().replace(/\s+/g, "-")}-${index}`;
  const recipes = getRecipesForDomain(domain);
  // Take first 1-2 recipes
  const selected = recipes.slice(0, 2);

  return {
    id: epicId,
    title: `${domain} — Kickoff`,
    phase: phaseId,
    domains: [domain.toLowerCase()],
    priority: "NORMAL",
    description: `Initial ${domain.toLowerCase()} tasks to get the team moving`,
    taskTemplates: selected.map((recipe, i) =>
      buildTaskTemplate(epicId, i, recipe, domain.toLowerCase()),
    ),
  };
}

export function buildWarmUpScenario(agents: SandboxAgent[]): ScenarioDefinition {
  // Extract unique domains from org agents (skip the COO's generic "operations" if others exist)
  const allDomains = [...new Set(agents.map((a) => a.domain).filter(Boolean))];
  const domains =
    allDomains.length > 1 ? allDomains : allDomains.length === 1 ? allDomains : ["operations"];

  const phaseId = "kickoff";
  const epics = domains.map((domain, i) => buildEpicForDomain(domain, phaseId, i));

  // Cross-domain epic unlocked after first phase completes
  const crossDomainEpic: EpicTemplate = {
    id: "warm-up-cross-domain",
    title: "Cross-team coordination",
    phase: "sprint",
    domains: domains.map((d) => d.toLowerCase()),
    priority: "HIGH",
    description: "A task that requires multiple domains to collaborate",
    taskTemplates: [
      {
        id: "warm-up-cross-domain-task-1",
        title: "Org-wide status report",
        domain: domains[0].toLowerCase(),
        subtasks: [
          { title: "Collect domain updates", durationRange: [2, 3] },
          { title: "Compile into summary", durationRange: [1, 2] },
          { title: "Distribute to stakeholders", durationRange: [1, 1] },
        ],
        durationRange: [1, 3],
        reviewRequired: true,
        reviewLoop: { maxIterations: 1, weights: [0.9, 0.1, 0, 0] },
      },
    ],
  };

  const totalTicks = 60;

  return {
    meta: {
      id: "warm-up",
      name: "Warm-Up",
      industry: "general",
      description: "Starter tasks generated from your org's domains — see your team in action",
      duration: "2 minutes",
      targetDecisions: 20,
      tickIntervalMs: 1500,
      seed: 42,
      difficulty: Difficulty.Easy,
      totalTicks,
    },
    phases: [
      {
        id: phaseId,
        name: "Kickoff",
        tickRange: [1, 30],
        unlocksEpics: epics.map((e) => e.id),
        enabledEvents: ["urgent-request"],
        difficultyMod: 0.5,
        transition: { type: "hybrid", tick: 30, condition: { epicCompletionPct: 0.5 } },
        narrative: "Your team is getting started. Tasks are flowing to domain leads.",
      },
      {
        id: "sprint",
        name: "First Sprint",
        tickRange: [20, totalTicks],
        unlocksEpics: ["warm-up-cross-domain"],
        enabledEvents: ["urgent-request"],
        difficultyMod: 0.8,
        transition: { type: "tick", tick: totalTicks },
        narrative: "Domains are coordinating. Cross-team work begins.",
      },
    ],
    epics: [...epics, crossDomainEpic],
    events: [
      {
        id: "urgent-request",
        name: "Urgent request from stakeholder",
        type: "interrupt",
        probability: 0.08,
        cooldownTicks: 15,
        maxOccurrences: 2,
        narrative: "A stakeholder needs something ASAP — new task incoming.",
        effect: {
          createTasks: [
            {
              title: "Urgent: stakeholder request",
              domain: domains[0].toLowerCase(),
              priority: "HIGH",
              subtaskCount: 2,
              durationRange: [2, 3],
            },
          ],
        },
      },
    ],
    resources: [
      {
        id: "agent-hours",
        name: "Agent Hours",
        type: ResourceType.AgentHours,
        initial: 100,
        burnRate: 1,
        alertThresholdPct: 0.2,
        depletedEffect: "none",
      },
    ],
    scoring: {
      dimensions: [
        { id: "velocity", name: "Velocity", description: "Tasks completed per tick" },
        { id: "quality", name: "Quality", description: "Review pass rate" },
        { id: "efficiency", name: "Efficiency", description: "Resource utilization" },
      ],
      weights: { velocity: 0.4, quality: 0.35, efficiency: 0.25 },
      grades: [
        { grade: "S", minScore: 90, label: "Outstanding" },
        { grade: "A", minScore: 75, label: "Excellent" },
        { grade: "B", minScore: 60, label: "Good" },
        { grade: "C", minScore: 40, label: "Needs Improvement" },
        { grade: "D", minScore: 0, label: "Below Expectations" },
      ],
    },
  };
}
