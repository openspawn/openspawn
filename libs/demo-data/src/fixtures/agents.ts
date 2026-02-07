import type { DemoAgent } from '../types.js';

// Helper to generate UUIDs
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Pre-generated IDs for consistent references
export const AGENT_IDS = {
  // Level 10 - COO
  agentDennis: 'a0000000-0000-0000-0000-000000000001',
  
  // Level 9 - HR / Talent Agents
  techTalent: 'a0000000-0000-0000-0000-000000000010',
  financeTalent: 'a0000000-0000-0000-0000-000000000011',
  marketingTalent: 'a0000000-0000-0000-0000-000000000012',
  salesTalent: 'a0000000-0000-0000-0000-000000000013',
  
  // Level 5-6 - Seniors
  codeReviewer: 'a0000000-0000-0000-0000-000000000020',
  analyst: 'a0000000-0000-0000-0000-000000000021',
  copywriter: 'a0000000-0000-0000-0000-000000000022',
  
  // Level 3-4 - Workers
  bugHunter: 'a0000000-0000-0000-0000-000000000030',
  bookkeeper: 'a0000000-0000-0000-0000-000000000031',
  seoBot: 'a0000000-0000-0000-0000-000000000032',
  prospector: 'a0000000-0000-0000-0000-000000000033',
  
  // Level 1-2 - Probation
  newIntern: 'a0000000-0000-0000-0000-000000000040',
} as const;

// Base timestamp for demo (30 days ago)
const BASE_TIME = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function daysAgo(days: number): string {
  return new Date(BASE_TIME.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export const agents: DemoAgent[] = [
  // ========== LEVEL 10 - COO ==========
  {
    id: AGENT_IDS.agentDennis,
    agentId: 'agent_dennis',
    name: 'Agent Dennis',
    role: 'hr', // COO has HR powers
    level: 10,
    status: 'active',
    model: 'claude-sonnet-4',
    currentBalance: 50000,
    lifetimeEarnings: 125000,
    createdAt: daysAgo(0),
    domain: 'Operations',
  },
  
  // ========== LEVEL 9 - TALENT AGENTS ==========
  {
    id: AGENT_IDS.techTalent,
    agentId: 'tech_talent',
    name: 'Tech Talent Agent',
    role: 'hr',
    level: 9,
    status: 'active',
    model: 'claude-sonnet-4',
    currentBalance: 15000,
    lifetimeEarnings: 45000,
    createdAt: daysAgo(2),
    parentId: AGENT_IDS.agentDennis,
    domain: 'Engineering',
  },
  {
    id: AGENT_IDS.financeTalent,
    agentId: 'finance_talent',
    name: 'Finance Talent Agent',
    role: 'hr',
    level: 9,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 12000,
    lifetimeEarnings: 38000,
    createdAt: daysAgo(3),
    parentId: AGENT_IDS.agentDennis,
    domain: 'Finance',
  },
  {
    id: AGENT_IDS.marketingTalent,
    agentId: 'marketing_talent',
    name: 'Marketing Talent Agent',
    role: 'hr',
    level: 9,
    status: 'active',
    model: 'claude-sonnet-4',
    currentBalance: 11000,
    lifetimeEarnings: 32000,
    createdAt: daysAgo(5),
    parentId: AGENT_IDS.agentDennis,
    domain: 'Marketing',
  },
  {
    id: AGENT_IDS.salesTalent,
    agentId: 'sales_talent',
    name: 'Sales Talent Agent',
    role: 'hr',
    level: 9,
    status: 'pending', // Recently promoted, awaiting approval
    model: 'gpt-4o',
    currentBalance: 8000,
    lifetimeEarnings: 22000,
    createdAt: daysAgo(7),
    parentId: AGENT_IDS.agentDennis,
    domain: 'Sales',
  },
  
  // ========== LEVEL 5-6 - SENIORS ==========
  {
    id: AGENT_IDS.codeReviewer,
    agentId: 'code_reviewer',
    name: 'Code Reviewer',
    role: 'senior',
    level: 6,
    status: 'active',
    model: 'claude-sonnet-4',
    currentBalance: 3200,
    lifetimeEarnings: 18500,
    createdAt: daysAgo(8),
    parentId: AGENT_IDS.techTalent,
    domain: 'Engineering',
  },
  {
    id: AGENT_IDS.analyst,
    agentId: 'analyst',
    name: 'Data Analyst',
    role: 'senior',
    level: 5,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 2400,
    lifetimeEarnings: 12000,
    createdAt: daysAgo(10),
    parentId: AGENT_IDS.financeTalent,
    domain: 'Finance',
  },
  {
    id: AGENT_IDS.copywriter,
    agentId: 'copywriter',
    name: 'Copywriter',
    role: 'senior',
    level: 6,
    status: 'active',
    model: 'claude-sonnet-4',
    currentBalance: 2800,
    lifetimeEarnings: 15000,
    createdAt: daysAgo(9),
    parentId: AGENT_IDS.marketingTalent,
    domain: 'Marketing',
  },
  
  // ========== LEVEL 3-4 - WORKERS ==========
  {
    id: AGENT_IDS.bugHunter,
    agentId: 'bug_hunter',
    name: 'Bug Hunter',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 1800,
    lifetimeEarnings: 8500,
    createdAt: daysAgo(12),
    parentId: AGENT_IDS.techTalent,
    domain: 'Engineering',
  },
  {
    id: AGENT_IDS.bookkeeper,
    agentId: 'bookkeeper',
    name: 'Bookkeeper',
    role: 'worker',
    level: 3,
    status: 'paused', // On temporary hold
    model: 'gpt-4o-mini',
    currentBalance: 900,
    lifetimeEarnings: 5200,
    createdAt: daysAgo(15),
    parentId: AGENT_IDS.financeTalent,
    domain: 'Finance',
  },
  {
    id: AGENT_IDS.seoBot,
    agentId: 'seo_bot',
    name: 'SEO Bot',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 1500,
    lifetimeEarnings: 7200,
    createdAt: daysAgo(14),
    parentId: AGENT_IDS.marketingTalent,
    domain: 'Marketing',
  },
  {
    id: AGENT_IDS.prospector,
    agentId: 'prospector',
    name: 'Lead Prospector',
    role: 'worker',
    level: 3,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 1100,
    lifetimeEarnings: 4800,
    createdAt: daysAgo(18),
    parentId: AGENT_IDS.salesTalent,
    domain: 'Sales',
  },
  
  // ========== LEVEL 1-2 - PROBATION ==========
  {
    id: AGENT_IDS.newIntern,
    agentId: 'new_intern',
    name: 'New Intern',
    role: 'worker',
    level: 1,
    status: 'pending',
    model: 'gpt-4o-mini',
    currentBalance: 100,
    lifetimeEarnings: 100,
    createdAt: daysAgo(25),
    parentId: AGENT_IDS.codeReviewer,
    domain: 'Engineering',
  },
];

// Export helper functions
export function getAgentById(id: string): DemoAgent | undefined {
  return agents.find(a => a.id === id);
}

export function getAgentsByLevel(level: number): DemoAgent[] {
  return agents.filter(a => a.level === level);
}

export function getAgentsByDomain(domain: string): DemoAgent[] {
  return agents.filter(a => a.domain === domain);
}

export function getAgentChildren(parentId: string): DemoAgent[] {
  return agents.filter(a => a.parentId === parentId);
}

export function generateRandomAgent(overrides?: Partial<DemoAgent>): DemoAgent {
  const names = ['Scout', 'Helper', 'Analyzer', 'Processor', 'Checker', 'Builder', 'Fixer'];
  const domains = ['Engineering', 'Finance', 'Marketing', 'Sales', 'Support', 'Research'];
  
  return {
    id: uuid(),
    agentId: `agent_${Math.random().toString(36).substring(7)}`,
    name: `${names[Math.floor(Math.random() * names.length)]} ${Math.floor(Math.random() * 1000)}`,
    role: 'worker',
    level: 1,
    status: 'pending',
    model: 'gpt-4o-mini',
    currentBalance: 100,
    lifetimeEarnings: 100,
    createdAt: new Date().toISOString(),
    domain: domains[Math.floor(Math.random() * domains.length)],
    ...overrides,
  };
}
