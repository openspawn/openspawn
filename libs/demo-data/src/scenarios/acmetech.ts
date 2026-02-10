import type { DemoScenario, DemoAgent, DemoTask, DemoMessage, DemoCreditTransaction, DemoEvent } from '../types';

/**
 * NovaTech AI - Realistic Startup Simulation
 * 
 * A complete product launch lifecycle following Stanford/Harvard business progression:
 * 
 * Phase 1: Discovery (Week 1-2) - Market research, customer insights
 * Phase 2: Definition (Week 3-4) - PRD, architecture, wireframes
 * Phase 3: Development (Week 5-8) - Build, test, iterate
 * Phase 4: Go-to-Market (Week 9-10) - Content, sales prep, docs
 * Phase 5: Launch (Week 11) - Deploy, campaigns, outreach
 * Phase 6: Growth (Week 12+) - Metrics, feedback, iteration
 */

// =============================================================================
// AGENTS - Organized by Department
// =============================================================================

const AGENT_IDS = {
  // Executive
  coo: 'nt-coo-001',
  
  // Product
  productDirector: 'nt-prod-dir-001',
  productManager: 'nt-prod-pm-001',
  userResearcher: 'nt-prod-ux-001',
  
  // Engineering
  engDirector: 'nt-eng-dir-001',
  techLead: 'nt-eng-lead-001',
  backendDev: 'nt-eng-be-001',
  frontendDev: 'nt-eng-fe-001',
  qaEngineer: 'nt-eng-qa-001',
  
  // Design
  designLead: 'nt-des-lead-001',
  uxDesigner: 'nt-des-ux-001',
  uiDesigner: 'nt-des-ui-001',
  
  // Marketing
  marketingLead: 'nt-mkt-lead-001',
  contentWriter: 'nt-mkt-content-001',
  seoSpecialist: 'nt-mkt-seo-001',
  socialManager: 'nt-mkt-social-001',
  
  // Sales
  salesLead: 'nt-sales-lead-001',
  sdr: 'nt-sales-sdr-001',
  salesOps: 'nt-sales-ops-001',
  
  // Customer Success
  csLead: 'nt-cs-lead-001',
  onboardingSpec: 'nt-cs-onboard-001',
  supportAgent: 'nt-cs-support-001',
};

const baseDate = new Date();
baseDate.setDate(baseDate.getDate() - 14); // Start 2 weeks ago

function daysAgo(days: number): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

const agents: DemoAgent[] = [
  // === EXECUTIVE ===
  {
    id: AGENT_IDS.coo,
    agentId: 'agent-dennis',
    name: 'Agent Dennis',
    role: 'manager',
    level: 10,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 50000,
    lifetimeEarnings: 125000,
    createdAt: daysAgo(-30),
    domain: 'Executive',
    trustScore: 98,
    reputationLevel: 'ELITE',
    tasksCompleted: 156,
    tasksSuccessful: 154,
  },
  
  // === PRODUCT ===
  {
    id: AGENT_IDS.productDirector,
    agentId: 'vision',
    name: 'Vision',
    role: 'manager',
    level: 8,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 15000,
    lifetimeEarnings: 45000,
    createdAt: daysAgo(-25),
    parentId: AGENT_IDS.coo,
    domain: 'Product',
    trustScore: 88,
    reputationLevel: 'VETERAN',
    tasksCompleted: 89,
    tasksSuccessful: 85,
  },
  {
    id: AGENT_IDS.productManager,
    agentId: 'roadmap',
    name: 'Roadmap',
    role: 'senior',
    level: 6,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 8000,
    lifetimeEarnings: 22000,
    createdAt: daysAgo(-20),
    parentId: AGENT_IDS.productDirector,
    domain: 'Product',
    trustScore: 72,
    reputationLevel: 'VETERAN',
    tasksCompleted: 67,
    tasksSuccessful: 61,
  },
  {
    id: AGENT_IDS.userResearcher,
    agentId: 'insights',
    name: 'Insights',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 3500,
    lifetimeEarnings: 12000,
    createdAt: daysAgo(-15),
    parentId: AGENT_IDS.productManager,
    domain: 'Product',
    trustScore: 65,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 34,
    tasksSuccessful: 30,
  },
  
  // === ENGINEERING ===
  {
    id: AGENT_IDS.engDirector,
    agentId: 'architect',
    name: 'Architect',
    role: 'manager',
    level: 8,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 18000,
    lifetimeEarnings: 52000,
    createdAt: daysAgo(-25),
    parentId: AGENT_IDS.coo,
    domain: 'Engineering',
    trustScore: 91,
    reputationLevel: 'ELITE',
    tasksCompleted: 112,
    tasksSuccessful: 108,
  },
  {
    id: AGENT_IDS.techLead,
    agentId: 'sentinel',
    name: 'Sentinel',
    role: 'senior',
    level: 6,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 9500,
    lifetimeEarnings: 28000,
    createdAt: daysAgo(-20),
    parentId: AGENT_IDS.engDirector,
    domain: 'Engineering',
    trustScore: 82,
    reputationLevel: 'VETERAN',
    tasksCompleted: 78,
    tasksSuccessful: 72,
  },
  {
    id: AGENT_IDS.backendDev,
    agentId: 'forge',
    name: 'Forge',
    role: 'worker',
    level: 5,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 6000,
    lifetimeEarnings: 18000,
    createdAt: daysAgo(-18),
    parentId: AGENT_IDS.techLead,
    domain: 'Engineering',
    trustScore: 74,
    reputationLevel: 'VETERAN',
    tasksCompleted: 56,
    tasksSuccessful: 50,
  },
  {
    id: AGENT_IDS.frontendDev,
    agentId: 'pixel',
    name: 'Pixel',
    role: 'worker',
    level: 5,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 5500,
    lifetimeEarnings: 16000,
    createdAt: daysAgo(-18),
    parentId: AGENT_IDS.techLead,
    domain: 'Engineering',
    trustScore: 71,
    reputationLevel: 'VETERAN',
    tasksCompleted: 52,
    tasksSuccessful: 46,
  },
  {
    id: AGENT_IDS.qaEngineer,
    agentId: 'guardian',
    name: 'Guardian',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 4000,
    lifetimeEarnings: 11000,
    createdAt: daysAgo(-15),
    parentId: AGENT_IDS.techLead,
    domain: 'Engineering',
    trustScore: 68,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 45,
    tasksSuccessful: 42,
  },
  
  // === DESIGN ===
  {
    id: AGENT_IDS.designLead,
    agentId: 'aesthetic',
    name: 'Aesthetic',
    role: 'manager',
    level: 7,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 10000,
    lifetimeEarnings: 32000,
    createdAt: daysAgo(-22),
    parentId: AGENT_IDS.coo,
    domain: 'Design',
    trustScore: 85,
    reputationLevel: 'VETERAN',
    tasksCompleted: 72,
    tasksSuccessful: 68,
  },
  {
    id: AGENT_IDS.uxDesigner,
    agentId: 'flow',
    name: 'Flow',
    role: 'senior',
    level: 5,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 5000,
    lifetimeEarnings: 14000,
    createdAt: daysAgo(-18),
    parentId: AGENT_IDS.designLead,
    domain: 'Design',
    trustScore: 69,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 38,
    tasksSuccessful: 34,
  },
  {
    id: AGENT_IDS.uiDesigner,
    agentId: 'brush',
    name: 'Brush',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 3800,
    lifetimeEarnings: 10000,
    createdAt: daysAgo(-15),
    parentId: AGENT_IDS.designLead,
    domain: 'Design',
    trustScore: 62,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 28,
    tasksSuccessful: 24,
  },
  
  // === MARKETING ===
  {
    id: AGENT_IDS.marketingLead,
    agentId: 'amplify',
    name: 'Amplify',
    role: 'manager',
    level: 7,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 12000,
    lifetimeEarnings: 35000,
    createdAt: daysAgo(-22),
    parentId: AGENT_IDS.coo,
    domain: 'Marketing',
    trustScore: 83,
    reputationLevel: 'VETERAN',
    tasksCompleted: 68,
    tasksSuccessful: 62,
  },
  {
    id: AGENT_IDS.contentWriter,
    agentId: 'scribe',
    name: 'Scribe',
    role: 'senior',
    level: 5,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 5200,
    lifetimeEarnings: 15000,
    createdAt: daysAgo(-18),
    parentId: AGENT_IDS.marketingLead,
    domain: 'Marketing',
    trustScore: 76,
    reputationLevel: 'VETERAN',
    tasksCompleted: 48,
    tasksSuccessful: 44,
  },
  {
    id: AGENT_IDS.seoSpecialist,
    agentId: 'crawler',
    name: 'Crawler',
    role: 'senior',
    level: 5,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 4800,
    lifetimeEarnings: 13000,
    createdAt: daysAgo(-16),
    parentId: AGENT_IDS.marketingLead,
    domain: 'Marketing',
    trustScore: 70,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 42,
    tasksSuccessful: 38,
  },
  {
    id: AGENT_IDS.socialManager,
    agentId: 'buzz',
    name: 'Buzz',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 3200,
    lifetimeEarnings: 9000,
    createdAt: daysAgo(-14),
    parentId: AGENT_IDS.marketingLead,
    domain: 'Marketing',
    trustScore: 58,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 32,
    tasksSuccessful: 26,
  },
  
  // === SALES ===
  {
    id: AGENT_IDS.salesLead,
    agentId: 'closer',
    name: 'Closer',
    role: 'manager',
    level: 7,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 11000,
    lifetimeEarnings: 38000,
    createdAt: daysAgo(-22),
    parentId: AGENT_IDS.coo,
    domain: 'Sales',
    trustScore: 87,
    reputationLevel: 'VETERAN',
    tasksCompleted: 75,
    tasksSuccessful: 70,
  },
  {
    id: AGENT_IDS.sdr,
    agentId: 'outreach',
    name: 'Outreach',
    role: 'senior',
    level: 5,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 4500,
    lifetimeEarnings: 12000,
    createdAt: daysAgo(-16),
    parentId: AGENT_IDS.salesLead,
    domain: 'Sales',
    trustScore: 66,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 55,
    tasksSuccessful: 48,
  },
  {
    id: AGENT_IDS.salesOps,
    agentId: 'pipeline',
    name: 'Pipeline',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 3000,
    lifetimeEarnings: 8000,
    createdAt: daysAgo(-14),
    parentId: AGENT_IDS.salesLead,
    domain: 'Sales',
    trustScore: 60,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 38,
    tasksSuccessful: 32,
  },
  
  // === CUSTOMER SUCCESS ===
  {
    id: AGENT_IDS.csLead,
    agentId: 'advocate',
    name: 'Advocate',
    role: 'manager',
    level: 7,
    status: 'active',
    model: 'claude-sonnet-4-20250514',
    currentBalance: 9000,
    lifetimeEarnings: 28000,
    createdAt: daysAgo(-22),
    parentId: AGENT_IDS.coo,
    domain: 'Customer Success',
    trustScore: 84,
    reputationLevel: 'VETERAN',
    tasksCompleted: 62,
    tasksSuccessful: 58,
  },
  {
    id: AGENT_IDS.onboardingSpec,
    agentId: 'welcome',
    name: 'Welcome',
    role: 'senior',
    level: 5,
    status: 'active',
    model: 'gpt-4o',
    currentBalance: 4200,
    lifetimeEarnings: 11000,
    createdAt: daysAgo(-16),
    parentId: AGENT_IDS.csLead,
    domain: 'Customer Success',
    trustScore: 72,
    reputationLevel: 'VETERAN',
    tasksCompleted: 45,
    tasksSuccessful: 42,
  },
  {
    id: AGENT_IDS.supportAgent,
    agentId: 'helper',
    name: 'Helper',
    role: 'worker',
    level: 4,
    status: 'active',
    model: 'gpt-4o-mini',
    currentBalance: 2800,
    lifetimeEarnings: 7500,
    createdAt: daysAgo(-14),
    parentId: AGENT_IDS.csLead,
    domain: 'Customer Success',
    trustScore: 55,
    reputationLevel: 'TRUSTED',
    tasksCompleted: 52,
    tasksSuccessful: 45,
  },
];

// =============================================================================
// TASKS - Organized by Phase
// =============================================================================

export type ProjectPhase = 
  | 'discovery' 
  | 'definition' 
  | 'development' 
  | 'go-to-market' 
  | 'launch' 
  | 'growth';

export interface PhaseInfo {
  id: ProjectPhase;
  name: string;
  description: string;
  week: string;
  color: string;
  icon: string;
}

export const PROJECT_PHASES: PhaseInfo[] = [
  { id: 'discovery', name: 'Discovery', description: 'Market research & customer insights', week: 'Week 1-2', color: '#8b5cf6', icon: '🔍' },
  { id: 'definition', name: 'Definition', description: 'PRD, architecture & wireframes', week: 'Week 3-4', color: '#3b82f6', icon: '📋' },
  { id: 'development', name: 'Development', description: 'Build, test & iterate', week: 'Week 5-8', color: '#22c55e', icon: '🔧' },
  { id: 'go-to-market', name: 'Go-to-Market', description: 'Content, sales prep & docs', week: 'Week 9-10', color: '#f59e0b', icon: '📣' },
  { id: 'launch', name: 'Launch', description: 'Deploy, campaigns & outreach', week: 'Week 11', color: '#ef4444', icon: '🚀' },
  { id: 'growth', name: 'Growth', description: 'Metrics, feedback & iteration', week: 'Week 12+', color: '#06b6d4', icon: '📈' },
];

interface TaskWithPhase extends DemoTask {
  phase: ProjectPhase;
}

const tasks: TaskWithPhase[] = [
  // === PHASE 1: DISCOVERY ===
  {
    id: 'task-nt-001',
    identifier: 'NT-001',
    title: 'Competitive analysis: AI dashboard market',
    description: 'Analyze top 5 competitors, document features, pricing, and positioning',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.userResearcher,
    creatorId: AGENT_IDS.productDirector,
    createdAt: daysAgo(0),
    updatedAt: daysAgo(2),
    completedAt: daysAgo(2),
    phase: 'discovery',
  },
  {
    id: 'task-nt-002',
    identifier: 'NT-002',
    title: 'Customer interview synthesis',
    description: 'Compile insights from 12 customer interviews into actionable themes',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.userResearcher,
    creatorId: AGENT_IDS.productManager,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(3),
    completedAt: daysAgo(3),
    phase: 'discovery',
  },
  {
    id: 'task-nt-003',
    identifier: 'NT-003',
    title: 'Opportunity brief for Q2 launch',
    description: 'Executive summary presenting market opportunity and recommended direction',
    status: 'done',
    priority: 'critical',
    assigneeId: AGENT_IDS.productDirector,
    creatorId: AGENT_IDS.coo,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(4),
    completedAt: daysAgo(4),
    phase: 'discovery',
  },
  
  // === PHASE 2: DEFINITION ===
  {
    id: 'task-nt-004',
    identifier: 'NT-004',
    title: 'Product requirements document (PRD)',
    description: 'Detailed specs for Dashboard v2.0 including user stories and acceptance criteria',
    status: 'done',
    priority: 'critical',
    assigneeId: AGENT_IDS.productManager,
    creatorId: AGENT_IDS.productDirector,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(6),
    completedAt: daysAgo(6),
    phase: 'definition',
  },
  {
    id: 'task-nt-005',
    identifier: 'NT-005',
    title: 'Technical architecture proposal',
    description: 'System design, API contracts, and infrastructure requirements',
    status: 'done',
    priority: 'critical',
    assigneeId: AGENT_IDS.engDirector,
    creatorId: AGENT_IDS.coo,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(7),
    completedAt: daysAgo(7),
    phase: 'definition',
  },
  {
    id: 'task-nt-006',
    identifier: 'NT-006',
    title: 'UX wireframes for core flows',
    description: '12 wireframes covering onboarding, dashboard, and settings',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.uxDesigner,
    creatorId: AGENT_IDS.designLead,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(7),
    completedAt: daysAgo(7),
    phase: 'definition',
  },
  {
    id: 'task-nt-007',
    identifier: 'NT-007',
    title: 'Effort estimation and sprint planning',
    description: 'Break down PRD into story points and assign to 4 sprints',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.techLead,
    creatorId: AGENT_IDS.engDirector,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(7),
    completedAt: daysAgo(7),
    phase: 'definition',
  },
  
  // === PHASE 3: DEVELOPMENT ===
  {
    id: 'task-nt-008',
    identifier: 'NT-008',
    title: 'Backend API: Agent management endpoints',
    description: 'CRUD operations for agents, hierarchy, and permissions',
    status: 'done',
    priority: 'critical',
    assigneeId: AGENT_IDS.backendDev,
    creatorId: AGENT_IDS.techLead,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(9),
    completedAt: daysAgo(9),
    phase: 'development',
  },
  {
    id: 'task-nt-009',
    identifier: 'NT-009',
    title: 'Backend API: Task workflow engine',
    description: 'State machine for task transitions with validation hooks',
    status: 'done',
    priority: 'critical',
    assigneeId: AGENT_IDS.backendDev,
    creatorId: AGENT_IDS.techLead,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(10),
    completedAt: daysAgo(10),
    phase: 'development',
  },
  {
    id: 'task-nt-010',
    identifier: 'NT-010',
    title: 'Frontend: Agent network visualization',
    description: 'Interactive graph showing agent hierarchy and relationships',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.frontendDev,
    creatorId: AGENT_IDS.techLead,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(11),
    completedAt: daysAgo(11),
    phase: 'development',
  },
  {
    id: 'task-nt-011',
    identifier: 'NT-011',
    title: 'Frontend: Task kanban board',
    description: 'Drag-and-drop kanban with filters and bulk actions',
    status: 'review',
    priority: 'high',
    assigneeId: AGENT_IDS.frontendDev,
    creatorId: AGENT_IDS.techLead,
    createdAt: daysAgo(9),
    updatedAt: hoursAgo(4),
    phase: 'development',
  },
  {
    id: 'task-nt-012',
    identifier: 'NT-012',
    title: 'UI component library',
    description: 'Reusable components matching design system specs',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.uiDesigner,
    creatorId: AGENT_IDS.designLead,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(10),
    completedAt: daysAgo(10),
    phase: 'development',
  },
  {
    id: 'task-nt-013',
    identifier: 'NT-013',
    title: 'Integration test suite',
    description: 'E2E tests covering critical user journeys',
    status: 'in_progress',
    priority: 'high',
    assigneeId: AGENT_IDS.qaEngineer,
    creatorId: AGENT_IDS.techLead,
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(2),
    phase: 'development',
  },
  
  // === PHASE 4: GO-TO-MARKET ===
  {
    id: 'task-nt-014',
    identifier: 'NT-014',
    title: 'Launch landing page copy',
    description: 'Hero, features, pricing, and CTA sections',
    status: 'in_progress',
    priority: 'high',
    assigneeId: AGENT_IDS.contentWriter,
    creatorId: AGENT_IDS.marketingLead,
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(3),
    phase: 'go-to-market',
  },
  {
    id: 'task-nt-015',
    identifier: 'NT-015',
    title: 'SEO optimization for landing page',
    description: 'Keyword research, meta tags, and structured data',
    status: 'pending',
    priority: 'normal',
    assigneeId: AGENT_IDS.seoSpecialist,
    creatorId: AGENT_IDS.marketingLead,
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
    phase: 'go-to-market',
  },
  {
    id: 'task-nt-016',
    identifier: 'NT-016',
    title: 'Sales enablement deck',
    description: 'Pitch deck with value props, pricing, and objection handling',
    status: 'pending',
    priority: 'high',
    assigneeId: AGENT_IDS.salesLead,
    creatorId: AGENT_IDS.coo,
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
    phase: 'go-to-market',
  },
  {
    id: 'task-nt-017',
    identifier: 'NT-017',
    title: 'Customer documentation',
    description: 'Getting started guide, API reference, and tutorials',
    status: 'pending',
    priority: 'high',
    assigneeId: AGENT_IDS.contentWriter,
    creatorId: AGENT_IDS.productManager,
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
    phase: 'go-to-market',
  },
  {
    id: 'task-nt-018',
    identifier: 'NT-018',
    title: 'Prospect list for launch outreach',
    description: 'Qualified list of 200 prospects for SDR outreach',
    status: 'assigned',
    priority: 'normal',
    assigneeId: AGENT_IDS.sdr,
    creatorId: AGENT_IDS.salesLead,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
    phase: 'go-to-market',
  },
  
  // === PHASE 5: LAUNCH ===
  {
    id: 'task-nt-019',
    identifier: 'NT-019',
    title: 'Production deployment',
    description: 'Deploy v2.0 to production with rollback plan',
    status: 'backlog',
    priority: 'critical',
    creatorId: AGENT_IDS.engDirector,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
    phase: 'launch',
  },
  {
    id: 'task-nt-020',
    identifier: 'NT-020',
    title: 'Launch campaign execution',
    description: 'Coordinate email, social, and PR for launch day',
    status: 'backlog',
    priority: 'critical',
    creatorId: AGENT_IDS.marketingLead,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
    phase: 'launch',
  },
  {
    id: 'task-nt-021',
    identifier: 'NT-021',
    title: 'Launch day support coverage',
    description: 'Extended support hours and escalation protocols',
    status: 'backlog',
    priority: 'high',
    creatorId: AGENT_IDS.csLead,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
    phase: 'launch',
  },
  
  // === PHASE 6: GROWTH ===
  {
    id: 'task-nt-022',
    identifier: 'NT-022',
    title: 'Week 1 metrics analysis',
    description: 'Analyze signups, activation, and engagement metrics',
    status: 'backlog',
    priority: 'high',
    creatorId: AGENT_IDS.productManager,
    createdAt: daysAgo(13),
    updatedAt: daysAgo(13),
    phase: 'growth',
  },
  {
    id: 'task-nt-023',
    identifier: 'NT-023',
    title: 'Customer feedback synthesis',
    description: 'Compile and prioritize feedback from early adopters',
    status: 'backlog',
    priority: 'normal',
    creatorId: AGENT_IDS.csLead,
    createdAt: daysAgo(13),
    updatedAt: daysAgo(13),
    phase: 'growth',
  },
  {
    id: 'task-nt-024',
    identifier: 'NT-024',
    title: 'v2.1 roadmap planning',
    description: 'Plan next iteration based on launch learnings',
    status: 'backlog',
    priority: 'normal',
    creatorId: AGENT_IDS.productDirector,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(14),
    phase: 'growth',
  },
];

// =============================================================================
// MESSAGES - Cross-department coordination
// =============================================================================

const messages: DemoMessage[] = [
  // Discovery phase messages
  {
    id: 'msg-nt-001',
    fromAgentId: AGENT_IDS.userResearcher,
    toAgentId: AGENT_IDS.productDirector,
    content: 'Competitive analysis complete! Key finding: nobody has good agent hierarchy visualization. Big opportunity.',
    type: 'report',
    taskRef: 'NT-001',
    read: true,
    createdAt: daysAgo(2),
  },
  {
    id: 'msg-nt-002',
    fromAgentId: AGENT_IDS.productDirector,
    toAgentId: AGENT_IDS.coo,
    content: 'Opportunity brief ready for review. Recommending we prioritize the network visualization feature based on research.',
    type: 'status',
    taskRef: 'NT-003',
    read: true,
    createdAt: daysAgo(3),
  },
  {
    id: 'msg-nt-003',
    fromAgentId: AGENT_IDS.coo,
    toAgentId: AGENT_IDS.productDirector,
    content: 'Approved. Allocating 40K credits to Product and 50K to Engineering for Q2. Let\'s ship this.',
    type: 'status',
    taskRef: 'NT-003',
    read: true,
    createdAt: daysAgo(3),
  },
  
  // Definition phase messages
  {
    id: 'msg-nt-004',
    fromAgentId: AGENT_IDS.productManager,
    toAgentId: AGENT_IDS.engDirector,
    content: 'PRD draft ready for technical review. Key question: can we do real-time sync on the network graph?',
    type: 'question',
    taskRef: 'NT-004',
    read: true,
    createdAt: daysAgo(5),
  },
  {
    id: 'msg-nt-005',
    fromAgentId: AGENT_IDS.engDirector,
    toAgentId: AGENT_IDS.productManager,
    content: 'Yes, we can use WebSocket subscriptions. Added technical notes to the PRD. Estimating 40 story points total.',
    type: 'status',
    taskRef: 'NT-005',
    read: true,
    createdAt: daysAgo(5),
  },
  {
    id: 'msg-nt-006',
    fromAgentId: AGENT_IDS.designLead,
    toAgentId: AGENT_IDS.productManager,
    content: 'Wireframes approved! Moving to high-fidelity. Should we sync with Frontend before I hand off?',
    type: 'question',
    taskRef: 'NT-006',
    read: true,
    createdAt: daysAgo(6),
  },
  {
    id: 'msg-nt-007',
    fromAgentId: AGENT_IDS.productManager,
    toAgentId: AGENT_IDS.designLead,
    content: 'Yes please! Looping in @Pixel for the handoff meeting.',
    type: 'task',
    read: true,
    createdAt: daysAgo(6),
  },
  
  // Development phase messages
  {
    id: 'msg-nt-008',
    fromAgentId: AGENT_IDS.backendDev,
    toAgentId: AGENT_IDS.techLead,
    content: 'Agent management API complete. All endpoints passing tests. Ready for code review.',
    type: 'status',
    taskRef: 'NT-008',
    read: true,
    createdAt: daysAgo(8),
  },
  {
    id: 'msg-nt-009',
    fromAgentId: AGENT_IDS.techLead,
    toAgentId: AGENT_IDS.backendDev,
    content: 'LGTM! Clean implementation. One suggestion: add rate limiting before we ship to production.',
    type: 'status',
    taskRef: 'NT-008',
    read: true,
    createdAt: daysAgo(8),
  },
  {
    id: 'msg-nt-010',
    fromAgentId: AGENT_IDS.frontendDev,
    toAgentId: AGENT_IDS.uiDesigner,
    content: 'The network visualization is coming together! Can you review the interaction patterns?',
    type: 'question',
    taskRef: 'NT-010',
    read: true,
    createdAt: daysAgo(10),
  },
  {
    id: 'msg-nt-011',
    fromAgentId: AGENT_IDS.uiDesigner,
    toAgentId: AGENT_IDS.frontendDev,
    content: 'Looks great! Minor tweak: increase the node hover size for better touch targets on mobile.',
    type: 'status',
    taskRef: 'NT-010',
    read: true,
    createdAt: daysAgo(10),
  },
  {
    id: 'msg-nt-012',
    fromAgentId: AGENT_IDS.qaEngineer,
    toAgentId: AGENT_IDS.techLead,
    content: 'Found a bug in task transitions: cancelled tasks can still be reopened. Should I file this as critical?',
    type: 'escalation',
    taskRef: 'NT-013',
    read: true,
    createdAt: hoursAgo(6),
  },
  {
    id: 'msg-nt-013',
    fromAgentId: AGENT_IDS.techLead,
    toAgentId: AGENT_IDS.qaEngineer,
    content: 'Good catch! Yes, mark it critical. @Forge can you hotfix this today?',
    type: 'task',
    read: true,
    createdAt: hoursAgo(5),
  },
  
  // Go-to-market phase messages
  {
    id: 'msg-nt-014',
    fromAgentId: AGENT_IDS.marketingLead,
    toAgentId: AGENT_IDS.productManager,
    content: 'Working on launch copy. What\'s the one thing that makes v2.0 special? Need the hero headline.',
    type: 'question',
    taskRef: 'NT-014',
    read: true,
    createdAt: hoursAgo(8),
  },
  {
    id: 'msg-nt-015',
    fromAgentId: AGENT_IDS.productManager,
    toAgentId: AGENT_IDS.marketingLead,
    content: '"Command center for your AI agent army" - it\'s the visibility + control combo. Nobody else does this well.',
    type: 'status',
    read: true,
    createdAt: hoursAgo(7),
  },
  {
    id: 'msg-nt-016',
    fromAgentId: AGENT_IDS.salesLead,
    toAgentId: AGENT_IDS.coo,
    content: 'Sales deck in progress. Question: are we doing a launch discount? Need to know for pricing slide.',
    type: 'question',
    taskRef: 'NT-016',
    read: false,
    createdAt: hoursAgo(4),
  },
  {
    id: 'msg-nt-017',
    fromAgentId: AGENT_IDS.contentWriter,
    toAgentId: AGENT_IDS.onboardingSpec,
    content: 'Starting on docs. Can you share the most common questions from current users?',
    type: 'question',
    taskRef: 'NT-017',
    read: false,
    createdAt: hoursAgo(3),
  },
  {
    id: 'msg-nt-018',
    fromAgentId: AGENT_IDS.onboardingSpec,
    toAgentId: AGENT_IDS.contentWriter,
    content: 'Top 3: (1) How do agent levels work? (2) How do I set budgets? (3) What happens when an agent runs out of credits?',
    type: 'report',
    read: false,
    createdAt: hoursAgo(2),
  },
];

// =============================================================================
// CREDIT TRANSACTIONS
// =============================================================================

const credits: DemoCreditTransaction[] = [
  // Initial allocations from COO
  { id: 'cred-nt-001', agentId: AGENT_IDS.productDirector, type: 'CREDIT', amount: 15000, description: 'Q2 Product budget allocation', createdAt: daysAgo(0) },
  { id: 'cred-nt-002', agentId: AGENT_IDS.engDirector, type: 'CREDIT', amount: 20000, description: 'Q2 Engineering budget allocation', createdAt: daysAgo(0) },
  { id: 'cred-nt-003', agentId: AGENT_IDS.designLead, type: 'CREDIT', amount: 10000, description: 'Q2 Design budget allocation', createdAt: daysAgo(0) },
  { id: 'cred-nt-004', agentId: AGENT_IDS.marketingLead, type: 'CREDIT', amount: 12000, description: 'Q2 Marketing budget allocation', createdAt: daysAgo(0) },
  { id: 'cred-nt-005', agentId: AGENT_IDS.salesLead, type: 'CREDIT', amount: 11000, description: 'Q2 Sales budget allocation', createdAt: daysAgo(0) },
  { id: 'cred-nt-006', agentId: AGENT_IDS.csLead, type: 'CREDIT', amount: 9000, description: 'Q2 CS budget allocation', createdAt: daysAgo(0) },
  
  // Task completion rewards
  { id: 'cred-nt-007', agentId: AGENT_IDS.userResearcher, type: 'CREDIT', amount: 150, description: 'Task completion: NT-001', taskId: 'task-nt-001', createdAt: daysAgo(2) },
  { id: 'cred-nt-008', agentId: AGENT_IDS.userResearcher, type: 'CREDIT', amount: 150, description: 'Task completion: NT-002', taskId: 'task-nt-002', createdAt: daysAgo(3) },
  { id: 'cred-nt-009', agentId: AGENT_IDS.productDirector, type: 'CREDIT', amount: 300, description: 'Task completion: NT-003', taskId: 'task-nt-003', createdAt: daysAgo(4) },
  { id: 'cred-nt-010', agentId: AGENT_IDS.backendDev, type: 'CREDIT', amount: 250, description: 'Task completion: NT-008', taskId: 'task-nt-008', createdAt: daysAgo(9) },
  { id: 'cred-nt-011', agentId: AGENT_IDS.backendDev, type: 'CREDIT', amount: 250, description: 'Task completion: NT-009', taskId: 'task-nt-009', createdAt: daysAgo(10) },
  { id: 'cred-nt-012', agentId: AGENT_IDS.frontendDev, type: 'CREDIT', amount: 200, description: 'Task completion: NT-010', taskId: 'task-nt-010', createdAt: daysAgo(11) },
  
  // Model usage spending
  { id: 'cred-nt-013', agentId: AGENT_IDS.userResearcher, type: 'DEBIT', amount: 45, description: 'Model usage: GPT-4o-mini', createdAt: daysAgo(1) },
  { id: 'cred-nt-014', agentId: AGENT_IDS.productManager, type: 'DEBIT', amount: 120, description: 'Model usage: GPT-4o', createdAt: daysAgo(4) },
  { id: 'cred-nt-015', agentId: AGENT_IDS.engDirector, type: 'DEBIT', amount: 180, description: 'Model usage: Claude Sonnet', createdAt: daysAgo(5) },
  { id: 'cred-nt-016', agentId: AGENT_IDS.backendDev, type: 'DEBIT', amount: 95, description: 'Model usage: Claude Sonnet', createdAt: daysAgo(7) },
  { id: 'cred-nt-017', agentId: AGENT_IDS.frontendDev, type: 'DEBIT', amount: 85, description: 'Model usage: GPT-4o', createdAt: daysAgo(9) },
  { id: 'cred-nt-018', agentId: AGENT_IDS.contentWriter, type: 'DEBIT', amount: 65, description: 'Model usage: Claude Sonnet', createdAt: hoursAgo(5) },
  { id: 'cred-nt-019', agentId: AGENT_IDS.qaEngineer, type: 'DEBIT', amount: 35, description: 'Model usage: GPT-4o-mini', createdAt: hoursAgo(3) },
];

// =============================================================================
// EVENTS - Project timeline
// =============================================================================

const events: DemoEvent[] = [
  // Phase transitions
  { id: 'evt-nt-001', type: 'phase.started', severity: 'info', message: '🔍 Discovery phase started', metadata: { phase: 'discovery' }, createdAt: daysAgo(0) },
  { id: 'evt-nt-002', type: 'phase.completed', severity: 'success', message: '✅ Discovery phase completed', metadata: { phase: 'discovery' }, createdAt: daysAgo(4) },
  { id: 'evt-nt-003', type: 'phase.started', severity: 'info', message: '📋 Definition phase started', metadata: { phase: 'definition' }, createdAt: daysAgo(4) },
  { id: 'evt-nt-004', type: 'phase.completed', severity: 'success', message: '✅ Definition phase completed', metadata: { phase: 'definition' }, createdAt: daysAgo(7) },
  { id: 'evt-nt-005', type: 'phase.started', severity: 'info', message: '🔧 Development phase started', metadata: { phase: 'development' }, createdAt: daysAgo(7) },
  
  // Key milestones
  { id: 'evt-nt-006', type: 'milestone.reached', severity: 'success', message: 'PRD approved by leadership', agentId: AGENT_IDS.productDirector, createdAt: daysAgo(6) },
  { id: 'evt-nt-007', type: 'milestone.reached', severity: 'success', message: 'Architecture review passed', agentId: AGENT_IDS.engDirector, createdAt: daysAgo(7) },
  { id: 'evt-nt-008', type: 'milestone.reached', severity: 'success', message: 'Design handoff complete', agentId: AGENT_IDS.designLead, createdAt: daysAgo(8) },
  { id: 'evt-nt-009', type: 'milestone.reached', severity: 'success', message: 'API development complete', agentId: AGENT_IDS.techLead, createdAt: daysAgo(10) },
  
  // Task events
  { id: 'evt-nt-010', type: 'task.completed', severity: 'info', message: 'Competitive analysis complete', agentId: AGENT_IDS.userResearcher, taskId: 'task-nt-001', createdAt: daysAgo(2) },
  { id: 'evt-nt-011', type: 'task.completed', severity: 'info', message: 'Network visualization shipped', agentId: AGENT_IDS.frontendDev, taskId: 'task-nt-010', createdAt: daysAgo(11) },
  
  // Budget events
  { id: 'evt-nt-012', type: 'budget.allocated', severity: 'info', message: 'Q2 budgets allocated to departments', agentId: AGENT_IDS.coo, metadata: { total: 77000 }, createdAt: daysAgo(0) },
  
  // Recent activity
  { id: 'evt-nt-013', type: 'task.started', severity: 'info', message: 'Integration testing in progress', agentId: AGENT_IDS.qaEngineer, taskId: 'task-nt-013', createdAt: hoursAgo(8) },
  { id: 'evt-nt-014', type: 'bug.found', severity: 'warning', message: 'Critical bug found in task transitions', agentId: AGENT_IDS.qaEngineer, createdAt: hoursAgo(6) },
  { id: 'evt-nt-015', type: 'task.started', severity: 'info', message: 'Launch copy in progress', agentId: AGENT_IDS.contentWriter, taskId: 'task-nt-014', createdAt: hoursAgo(4) },
];

// =============================================================================
// EXPORT SCENARIO
// =============================================================================

export const acmetechScenario: DemoScenario = {
  name: 'acmetech',
  description: 'AcmeTech AI: Full product launch lifecycle with 22 agents across 6 departments',
  agents,
  tasks: tasks as DemoTask[], // Cast to remove phase for base type
  credits,
  events,
  messages,
};

// Export phase info for UI
export { tasks as acmetechTasks, AGENT_IDS as ACMETECH_AGENTS };

export default acmetechScenario;
