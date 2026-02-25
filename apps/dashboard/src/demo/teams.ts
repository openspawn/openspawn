/**
 * Team data model for organizational structure.
 * Teams form a hierarchy: parent teams → sub-teams → agents.
 *
 * In sandbox mode, team IDs are generated as `team-{domain}` from agent domains.
 * This file defines the canonical teams that match both demo-data and sandbox.
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

// ── Team IDs ────────────────────────────────────────────────────────────────
export const TEAM_IDS = {
  // Top-level departments
  operations: 'team-operations',
  engineering: 'team-engineering',
  security: 'team-security',
  marketing: 'team-marketing',
  finance: 'team-finance',
  support: 'team-support',

  // Engineering sub-teams
  backend: 'team-backend',
  frontend: 'team-frontend',
  qa: 'team-testing',

  // Security sub-teams
  appsec: 'team-appsec',
  infrasec: 'team-infrastructure security',

  // Marketing sub-teams
  content: 'team-content strategy',
  copywriting: 'team-copywriting',
  seo: 'team-seo',

  // Finance sub-teams
  analytics: 'team-analytics',
  accounting: 'team-accounting',

  // Support sub-teams
  tier1: 'team-support', // same as parent — tier 1 is core support
  tier2: 'team-technical support',
} as const;

// ── Teams ───────────────────────────────────────────────────────────────────
export const teams: Team[] = [
  // ─── Top-Level Departments ───
  {
    id: TEAM_IDS.operations,
    name: 'Operations',
    description: 'Executive leadership and coordination',
    color: 'slate',
    icon: 'Crown',
  },
  {
    id: TEAM_IDS.engineering,
    name: 'Engineering',
    description: 'Core product, infrastructure, testing, and deployment',
    color: 'cyan',
    icon: 'Code2',
  },
  {
    id: TEAM_IDS.security,
    name: 'Security',
    description: 'Application security, infrastructure hardening, compliance',
    color: 'red',
    icon: 'Shield',
  },
  {
    id: TEAM_IDS.marketing,
    name: 'Marketing',
    description: 'Content, campaigns, brand voice, and public presence',
    color: 'pink',
    icon: 'Megaphone',
  },
  {
    id: TEAM_IDS.finance,
    name: 'Finance',
    description: 'Budget allocation, forecasting, expense management',
    color: 'emerald',
    icon: 'DollarSign',
  },
  {
    id: TEAM_IDS.support,
    name: 'Support',
    description: 'Customer-facing ticket queue and issue resolution',
    color: 'teal',
    icon: 'Headphones',
  },

  // ─── Engineering Sub-Teams ───
  {
    id: TEAM_IDS.backend,
    name: 'Backend',
    description: 'API layer, database, and server infrastructure',
    color: 'blue',
    icon: 'Server',
    parentTeamId: TEAM_IDS.engineering,
  },
  {
    id: TEAM_IDS.frontend,
    name: 'Frontend',
    description: 'Dashboard UI and marketing site',
    color: 'violet',
    icon: 'Monitor',
    parentTeamId: TEAM_IDS.engineering,
  },
  {
    id: TEAM_IDS.qa,
    name: 'QA',
    description: 'Quality assurance and testing',
    color: 'amber',
    icon: 'ShieldCheck',
    parentTeamId: TEAM_IDS.engineering,
  },

  // ─── Security Sub-Teams ───
  {
    id: TEAM_IDS.appsec,
    name: 'AppSec',
    description: 'Application security and deploy review',
    color: 'red',
    icon: 'Lock',
    parentTeamId: TEAM_IDS.security,
  },
  {
    id: TEAM_IDS.infrasec,
    name: 'Infra Security',
    description: 'Vulnerability scans, alerts, and incident response',
    color: 'orange',
    icon: 'AlertTriangle',
    parentTeamId: TEAM_IDS.security,
  },

  // ─── Marketing Sub-Teams ───
  {
    id: TEAM_IDS.content,
    name: 'Content Strategy',
    description: 'Content strategy and campaign direction',
    color: 'pink',
    icon: 'PenTool',
    parentTeamId: TEAM_IDS.marketing,
  },
  {
    id: TEAM_IDS.copywriting,
    name: 'Copywriting',
    description: 'Docs, blogs, and social copy',
    color: 'pink',
    icon: 'FileText',
    parentTeamId: TEAM_IDS.marketing,
  },
  {
    id: TEAM_IDS.seo,
    name: 'SEO',
    description: 'Search optimization, keywords, metadata',
    color: 'pink',
    icon: 'Search',
    parentTeamId: TEAM_IDS.marketing,
  },

  // ─── Finance Sub-Teams ───
  {
    id: TEAM_IDS.analytics,
    name: 'Analytics',
    description: 'Dashboards, trends, and actionable insights',
    color: 'emerald',
    icon: 'BarChart3',
    parentTeamId: TEAM_IDS.finance,
  },
  {
    id: TEAM_IDS.accounting,
    name: 'Accounting',
    description: 'Expenses, invoices, and financial records',
    color: 'emerald',
    icon: 'Calculator',
    parentTeamId: TEAM_IDS.finance,
  },

  // ─── Support Sub-Teams ───
  {
    id: TEAM_IDS.tier2,
    name: 'Tier 2 Technical',
    description: 'Complex technical issues and escalations',
    color: 'teal',
    icon: 'Wrench',
    parentTeamId: TEAM_IDS.support,
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
  red: '#ef4444',
};

export function getTeamColor(colorName: string): string {
  return TEAM_COLOR_MAP[colorName] || '#64748b';
}
