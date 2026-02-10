/**
 * Team data model for organizational structure.
 * Teams form a hierarchy: parent teams → sub-teams → agents.
 */

export interface Team {
  id: string;
  name: string;
  description: string;
  color: string; // tailwind color name
  icon: string; // lucide icon name
  parentTeamId?: string; // for nested org chart
  leadAgentId?: string;
}

// Agent IDs for lead assignments (mirrors libs/demo-data agent IDs)
const AGENT_IDS = {
  agentDennis: 'a0000000-0000-0000-0000-000000000001',
  techTalent: 'a0000000-0000-0000-0000-000000000010',
  financeTalent: 'a0000000-0000-0000-0000-000000000011',
  marketingTalent: 'a0000000-0000-0000-0000-000000000012',
  salesTalent: 'a0000000-0000-0000-0000-000000000013',
  codeReviewer: 'a0000000-0000-0000-0000-000000000020',
  copywriter: 'a0000000-0000-0000-0000-000000000022',
  analyst: 'a0000000-0000-0000-0000-000000000021',
  hrCoordinator: 'a0000000-0000-0000-0000-000000000050',
  recruiterBot: 'a0000000-0000-0000-0000-000000000051',
  onboardingAgent: 'a0000000-0000-0000-0000-000000000052',
  supportLead: 'a0000000-0000-0000-0000-000000000060',
  tier1Agent: 'a0000000-0000-0000-0000-000000000061',
  tier2Agent: 'a0000000-0000-0000-0000-000000000063',
  frontendDev: 'a0000000-0000-0000-0000-000000000070',
  qaEngineer: 'a0000000-0000-0000-0000-000000000071',
  accountManager: 'a0000000-0000-0000-0000-000000000080',
  analyticsBot: 'a0000000-0000-0000-0000-000000000090',
};

// ── Team IDs ────────────────────────────────────────────────────────────────
export const TEAM_IDS = {
  // Top-level
  executive: 'team-executive',
  epd: 'team-epd',
  sales: 'team-sales',
  marketing: 'team-marketing',
  hr: 'team-hr',
  support: 'team-support',

  // EPD sub-teams
  backend: 'team-backend',
  frontend: 'team-frontend',
  qa: 'team-qa',

  // Sales sub-teams
  outbound: 'team-outbound',
  accountMgmt: 'team-account-mgmt',

  // Marketing sub-teams
  content: 'team-content',
  analytics: 'team-analytics',

  // HR sub-teams
  recruiting: 'team-recruiting',
  peopleOps: 'team-people-ops',

  // Support sub-teams
  tier1: 'team-tier1',
  tier2: 'team-tier2',
} as const;

// ── Teams ───────────────────────────────────────────────────────────────────
export const teams: Team[] = [
  // ─── Top-Level Teams ───
  {
    id: TEAM_IDS.executive,
    name: 'Executive',
    description: 'C-suite leadership and strategy',
    color: 'slate',
    icon: 'Crown',
    leadAgentId: AGENT_IDS.agentDennis,
  },
  {
    id: TEAM_IDS.epd,
    name: 'EPD',
    description: 'Engineering, Product & Design',
    color: 'cyan',
    icon: 'Code2',
    leadAgentId: AGENT_IDS.techTalent,
  },
  {
    id: TEAM_IDS.sales,
    name: 'Sales',
    description: 'Revenue generation and client acquisition',
    color: 'emerald',
    icon: 'DollarSign',
    leadAgentId: AGENT_IDS.financeTalent,
  },
  {
    id: TEAM_IDS.marketing,
    name: 'Marketing',
    description: 'Brand, content, and growth marketing',
    color: 'pink',
    icon: 'Megaphone',
    leadAgentId: AGENT_IDS.marketingTalent,
  },
  {
    id: TEAM_IDS.hr,
    name: 'HR',
    description: 'Human resources and talent management',
    color: 'orange',
    icon: 'Users',
    leadAgentId: AGENT_IDS.hrCoordinator,
  },
  {
    id: TEAM_IDS.support,
    name: 'Customer Support',
    description: 'Customer success and technical support',
    color: 'teal',
    icon: 'Headphones',
    leadAgentId: AGENT_IDS.supportLead,
  },

  // ─── EPD Sub-Teams ───
  {
    id: TEAM_IDS.backend,
    name: 'Backend',
    description: 'Server-side architecture and APIs',
    color: 'blue',
    icon: 'Server',
    parentTeamId: TEAM_IDS.epd,
    leadAgentId: AGENT_IDS.codeReviewer,
  },
  {
    id: TEAM_IDS.frontend,
    name: 'Frontend',
    description: 'UI/UX implementation and web apps',
    color: 'violet',
    icon: 'Monitor',
    parentTeamId: TEAM_IDS.epd,
    leadAgentId: AGENT_IDS.frontendDev,
  },
  {
    id: TEAM_IDS.qa,
    name: 'QA',
    description: 'Quality assurance and testing',
    color: 'amber',
    icon: 'ShieldCheck',
    parentTeamId: TEAM_IDS.epd,
    leadAgentId: AGENT_IDS.qaEngineer,
  },

  // ─── Sales Sub-Teams ───
  {
    id: TEAM_IDS.outbound,
    name: 'Outbound',
    description: 'Outbound sales and lead generation',
    color: 'emerald',
    icon: 'Send',
    parentTeamId: TEAM_IDS.sales,
    leadAgentId: AGENT_IDS.salesTalent,
  },
  {
    id: TEAM_IDS.accountMgmt,
    name: 'Account Management',
    description: 'Client retention and expansion',
    color: 'emerald',
    icon: 'Handshake',
    parentTeamId: TEAM_IDS.sales,
    leadAgentId: AGENT_IDS.accountManager,
  },

  // ─── Marketing Sub-Teams ───
  {
    id: TEAM_IDS.content,
    name: 'Content',
    description: 'Content strategy and creation',
    color: 'pink',
    icon: 'PenTool',
    parentTeamId: TEAM_IDS.marketing,
    leadAgentId: AGENT_IDS.copywriter,
  },
  {
    id: TEAM_IDS.analytics,
    name: 'Analytics',
    description: 'Marketing analytics and reporting',
    color: 'pink',
    icon: 'BarChart3',
    parentTeamId: TEAM_IDS.marketing,
    leadAgentId: AGENT_IDS.analyst,
  },

  // ─── HR Sub-Teams ───
  {
    id: TEAM_IDS.recruiting,
    name: 'Recruiting',
    description: 'Talent acquisition and hiring',
    color: 'orange',
    icon: 'UserPlus',
    parentTeamId: TEAM_IDS.hr,
    leadAgentId: AGENT_IDS.recruiterBot,
  },
  {
    id: TEAM_IDS.peopleOps,
    name: 'People Ops',
    description: 'Employee experience and operations',
    color: 'orange',
    icon: 'Heart',
    parentTeamId: TEAM_IDS.hr,
    leadAgentId: AGENT_IDS.onboardingAgent,
  },

  // ─── Support Sub-Teams ───
  {
    id: TEAM_IDS.tier1,
    name: 'Tier 1',
    description: 'First-response customer support',
    color: 'teal',
    icon: 'MessageCircle',
    parentTeamId: TEAM_IDS.support,
    leadAgentId: AGENT_IDS.tier1Agent,
  },
  {
    id: TEAM_IDS.tier2,
    name: 'Tier 2 Technical',
    description: 'Escalated technical support',
    color: 'teal',
    icon: 'Wrench',
    parentTeamId: TEAM_IDS.support,
    leadAgentId: AGENT_IDS.tier2Agent,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getTeamById(id: string): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function getParentTeams(): Team[] {
  return teams.filter((t) => !t.parentTeamId);
}

export function getSubTeams(parentId: string): Team[] {
  return teams.filter((t) => t.parentTeamId === parentId);
}

/** Tailwind color name → hex map for consistent rendering in canvas/SVG contexts */
export const TEAM_COLOR_MAP: Record<string, string> = {
  slate: '#64748b',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  emerald: '#10b981',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
};

export function getTeamColor(colorName: string): string {
  return TEAM_COLOR_MAP[colorName] || '#64748b';
}
