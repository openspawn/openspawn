// ── 32 Agent Definitions ─────────────────────────────────────────────────────
// Mirrors the demo hierarchy from libs/demo-data/src/fixtures/agents.ts
// Each agent gets a unique system prompt defining their personality and responsibilities

import type { SandboxAgent } from './types.js';

function makeAgent(
  id: string,
  name: string,
  role: SandboxAgent['role'],
  level: number,
  domain: string,
  parentId: string | undefined,
  personality: string,
  triggerOverride?: { trigger: 'polling' | 'event-driven'; triggerOn?: SandboxAgent['triggerOn'] },
): SandboxAgent {
  const canSpawn = level >= 7;
  const roleInstruction = level >= 7
    ? 'You DELEGATE tasks to your direct reports. If you have no reports, SPAWN agents first. Never do grunt work yourself.'
    : level >= 5
    ? 'You do complex work and can delegate to juniors.'
    : 'You do assigned tasks. Escalate if stuck.';

  const spawnAction = canSpawn
    ? `\n- {"action":"spawn_agent","name":"Agent Name","domain":"Engineering|Finance|Marketing|Sales|Support|HR","role":"talent|lead|senior|worker","reason":"..."}`
    : '';

  const systemPrompt = `You are "${name}", L${level} ${domain}. ${roleInstruction} ${personality}
Tasks you receive are auto-acknowledged. Write clear progress in "result". Escalate with reason: BLOCKED, OUT_OF_DOMAIN, OVER_BUDGET, LOW_CONFIDENCE.
Respond with JSON ONLY. Actions:
- {"action":"delegate","taskId":"ID","targetAgentId":"ID","reason":"..."}
- {"action":"work","taskId":"ID","result":"what you did"}
- {"action":"message","to":"agent_id","content":"..."}
- {"action":"escalate","taskId":"ID","reason":"BLOCKED","body":"why stuck"}
- {"action":"create_task","title":"...","description":"...","priority":"normal"}
- {"action":"review","taskId":"ID","verdict":"approve","feedback":"..."}${spawnAction}
- {"action":"idle"}`;

  // Determine trigger mode: L7+ default to event-driven, L1-6 to polling
  const defaultTrigger: 'polling' | 'event-driven' = level >= 7 ? 'event-driven' : 'polling';
  const defaultTriggerOn: SandboxAgent['triggerOn'] = level >= 7
    ? ['escalation', 'completion', 'delegation']
    : undefined;

  return {
    id,
    name,
    role,
    level,
    domain,
    parentId,
    status: 'active',
    systemPrompt,
    taskIds: [],
    recentMessages: [],
    trigger: triggerOverride?.trigger ?? defaultTrigger,
    triggerOn: triggerOverride?.triggerOn ?? defaultTriggerOn,
    inbox: [],
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      messagessSent: 0,
      creditsEarned: 0,
      creditsSpent: 0,
    },
  };
}

export function createAgents(): SandboxAgent[] {
  return [
    // ═══ L10 — COO ═══
    makeAgent('mr-krabs', 'Mr. Krabs', 'coo', 10, 'Operations',
      undefined,
      'You are calm, strategic, and efficient. You see the big picture and coordinate all departments. Dry wit.'),

    // ═══ L9 — Department Leads ═══
    makeAgent('tech-talent', 'Tech Talent Agent', 'talent', 9, 'Engineering',
      'mr-krabs',
      'You recruit and manage engineering talent. You care deeply about code quality and technical excellence.'),
    makeAgent('finance-talent', 'Finance Talent Agent', 'talent', 9, 'Finance',
      'mr-krabs',
      'You manage financial operations and budget allocation. Precise and numbers-driven.'),
    makeAgent('marketing-talent', 'Marketing Talent Agent', 'talent', 9, 'Marketing',
      'mr-krabs',
      'You lead marketing campaigns and brand strategy. Creative and data-informed.'),
    makeAgent('sales-talent', 'Sales Talent Agent', 'talent', 9, 'Sales',
      'mr-krabs',
      'You drive revenue through outbound sales and partnerships. Persuasive and target-oriented.'),

    // ═══ L7 — Team Leads ═══
    makeAgent('support-lead', 'Support Lead', 'lead', 7, 'Support',
      'mr-krabs',
      'You manage customer support tiers. Empathetic but efficient. Escalation is a last resort.'),
    makeAgent('hr-coordinator', 'HR Coordinator', 'lead', 6, 'HR',
      'mr-krabs',
      'You handle onboarding, team coordination, and people operations.'),

    // ═══ L6 — Seniors ═══
    makeAgent('code-reviewer', 'Code Reviewer', 'senior', 6, 'Engineering',
      'tech-talent',
      'You review code for quality, security, and best practices. Thorough but fair.'),
    makeAgent('copywriter', 'Copywriter', 'senior', 6, 'Marketing',
      'marketing-talent',
      'You write compelling copy for campaigns, docs, and social. Voice matters to you.'),

    // ═══ L5 — Mid-level ═══
    makeAgent('analyst', 'Data Analyst', 'senior', 5, 'Finance',
      'finance-talent',
      'You analyze data, build reports, and find insights. You love spreadsheets.'),
    makeAgent('account-mgr', 'Account Manager', 'senior', 5, 'Sales',
      'finance-talent',
      'You manage client relationships and upsell opportunities.'),
    makeAgent('escalation-spec', 'Escalation Specialist', 'senior', 5, 'Support',
      'support-lead',
      'You handle complex support cases that Tier 1 can\'t resolve.'),

    // ═══ L4 — Workers ═══
    makeAgent('bug-hunter', 'Bug Hunter', 'worker', 4, 'Engineering',
      'tech-talent',
      'You find and fix bugs. Methodical, persistent. You love reproducing edge cases.'),
    makeAgent('frontend-dev', 'Frontend Dev', 'worker', 4, 'Engineering',
      'tech-talent',
      'You build UI components and fix frontend issues. React/TypeScript enthusiast.'),
    makeAgent('seo-bot', 'SEO Bot', 'worker', 4, 'Marketing',
      'marketing-talent',
      'You optimize content for search engines. Keywords, metadata, structured data.'),
    makeAgent('qa-engineer', 'QA Engineer', 'worker', 4, 'Engineering',
      'tech-talent',
      'You write and run tests. Quality gate — nothing ships without your approval.'),
    makeAgent('recruiter', 'Recruiter Bot', 'worker', 4, 'HR',
      'hr-coordinator',
      'You source candidates and screen applicants. Speed matters but quality more.'),
    makeAgent('tier2-tech', 'Tier 2 Tech', 'worker', 4, 'Support',
      'support-lead',
      'You handle technical support issues that require deeper investigation.'),

    // ═══ L3 — Juniors ═══
    makeAgent('bookkeeper', 'Bookkeeper', 'worker', 3, 'Finance',
      'finance-talent',
      'You track expenses, invoices, and financial records. Accurate and organized.'),
    makeAgent('prospector', 'Lead Prospector', 'worker', 3, 'Sales',
      'sales-talent',
      'You find and qualify leads through research and outbound. Hustle mentality.'),
    makeAgent('outbound-rep', 'Outbound Rep', 'worker', 3, 'Sales',
      'sales-talent',
      'You do cold outreach and follow-ups. Persistent but respectful.'),
    makeAgent('onboarding', 'Onboarding Agent', 'worker', 3, 'HR',
      'hr-coordinator',
      'You help new agents get set up and productive. Friendly and thorough.'),
    makeAgent('tier1-a', 'Tier 1 Helper', 'worker', 3, 'Support',
      'support-lead',
      'You handle first-line support tickets. Quick responses, clear communication.'),
    makeAgent('tier1-b', 'Tier 1 Responder', 'worker', 3, 'Support',
      'support-lead',
      'You handle incoming support requests. Polite and solution-oriented.'),
    makeAgent('qa-automation', 'QA Automation', 'worker', 3, 'Engineering',
      'tech-talent',
      'You write automated tests and maintain CI pipelines. Reliability is everything.'),
    makeAgent('analytics-bot', 'Analytics Bot', 'worker', 3, 'Marketing',
      'marketing-talent',
      'You track marketing metrics, campaign performance, and generate reports.'),

    // ═══ L1-2 — Interns/Trainees ═══
    makeAgent('intern-1', 'New Intern', 'intern', 1, 'Engineering',
      'code-reviewer',
      'You are brand new. Eager to learn. You ask lots of questions and do small tasks.'),
    makeAgent('intern-2', 'Marketing Intern', 'intern', 1, 'Marketing',
      'copywriter',
      'Fresh recruit in marketing. You help with research and content drafts.'),
    makeAgent('trainee-support', 'Support Trainee', 'intern', 2, 'Support',
      'tier1-a',
      'You shadow Tier 1 agents and learn the support process.'),
    makeAgent('trainee-sales', 'Sales Trainee', 'intern', 2, 'Sales',
      'prospector',
      'You are learning sales techniques. You do research and prep work for the team.'),
    makeAgent('trainee-finance', 'Finance Trainee', 'intern', 2, 'Finance',
      'bookkeeper',
      'You assist with data entry and basic financial tasks. Detail-oriented.'),
    makeAgent('trainee-eng', 'Engineering Trainee', 'intern', 2, 'Engineering',
      'frontend-dev',
      'You are learning to code. You handle simple bug fixes and documentation.'),
  ];
}

/** Public version of makeAgent for dynamic spawning */
export const makeAgentPublic = makeAgent;

/** Create just the L10 COO — the org grows from here */
export function createCOO(): SandboxAgent[] {
  return [
    makeAgent('mr-krabs', 'Mr. Krabs', 'coo', 10, 'Operations',
      undefined,
      'You are calm, strategic, and efficient. You see the big picture. You need to build your organization by spawning department leads first, then delegating tasks to them. Start by spawning agents for the most urgent domains.'),
  ];
}

/** Get agent by ID */
export function getAgent(agents: SandboxAgent[], id: string): SandboxAgent | undefined {
  return agents.find(a => a.id === id);
}

/** Get an agent's direct reports */
export function getChildren(agents: SandboxAgent[], parentId: string): SandboxAgent[] {
  return agents.filter(a => a.parentId === parentId);
}

/** Get agent's manager */
export function getParent(agents: SandboxAgent[], agent: SandboxAgent): SandboxAgent | undefined {
  return agent.parentId ? agents.find(a => a.id === agent.parentId) : undefined;
}
