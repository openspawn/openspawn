import type { DemoTask, TaskStatus, TaskPriority } from '../types';
import { AGENT_IDS } from './agents';

// Helper to generate UUIDs
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Pre-generated IDs
export const TASK_IDS = {
  // Backlog
  implementAuth: 't0000000-0000-0000-0000-000000000001',
  designSystem: 't0000000-0000-0000-0000-000000000002',
  
  // Pending
  writeTests: 't0000000-0000-0000-0000-000000000010',
  budgetReport: 't0000000-0000-0000-0000-000000000011',
  
  // Assigned
  fixBug123: 't0000000-0000-0000-0000-000000000020',
  blogPost: 't0000000-0000-0000-0000-000000000021',
  
  // In Progress
  apiRefactor: 't0000000-0000-0000-0000-000000000030',
  seoAudit: 't0000000-0000-0000-0000-000000000031',
  
  // Review
  prReview: 't0000000-0000-0000-0000-000000000040',
  invoiceCheck: 't0000000-0000-0000-0000-000000000041',
  
  // Done
  setupCI: 't0000000-0000-0000-0000-000000000050',
  landingPage: 't0000000-0000-0000-0000-000000000051',
  quarterlyReport: 't0000000-0000-0000-0000-000000000052',
} as const;

// Base timestamp
const BASE_TIME = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function daysAgo(days: number): string {
  return new Date(BASE_TIME.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

let taskCounter = 1;
function nextIdentifier(): string {
  return `TASK-${String(taskCounter++).padStart(4, '0')}`;
}

export const tasks: DemoTask[] = [
  // ========== BACKLOG ==========
  {
    id: TASK_IDS.implementAuth,
    identifier: 'TASK-0001',
    title: 'Implement OAuth2 authentication',
    description: 'Add Google and GitHub OAuth providers to the auth system',
    status: 'backlog',
    priority: 'high',
    creatorId: AGENT_IDS.agentDennis,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: TASK_IDS.designSystem,
    identifier: 'TASK-0002',
    title: 'Create design system documentation',
    description: 'Document all UI components, colors, and patterns',
    status: 'backlog',
    priority: 'normal',
    creatorId: AGENT_IDS.marketingTalent,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  
  // ========== PENDING ==========
  {
    id: TASK_IDS.writeTests,
    identifier: 'TASK-0003',
    title: 'Write E2E tests for agent registration',
    description: 'Cover happy path and error cases',
    status: 'pending',
    priority: 'high',
    creatorId: AGENT_IDS.techTalent,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: TASK_IDS.budgetReport,
    identifier: 'TASK-0004',
    title: 'Prepare monthly budget report',
    description: 'Compile credit usage across all agents',
    status: 'pending',
    priority: 'normal',
    creatorId: AGENT_IDS.financeTalent,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  
  // ========== ASSIGNED ==========
  {
    id: TASK_IDS.fixBug123,
    identifier: 'TASK-0005',
    title: 'Fix memory leak in task queue',
    description: 'Tasks are not being cleaned up after completion',
    status: 'assigned',
    priority: 'critical',
    assigneeId: AGENT_IDS.bugHunter,
    creatorId: AGENT_IDS.codeReviewer,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(12),
  },
  {
    id: TASK_IDS.blogPost,
    identifier: 'TASK-0006',
    title: 'Write blog post about AI agents',
    description: 'Focus on multi-agent coordination benefits',
    status: 'assigned',
    priority: 'normal',
    assigneeId: AGENT_IDS.copywriter,
    creatorId: AGENT_IDS.marketingTalent,
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(6),
  },
  
  // ========== IN PROGRESS ==========
  {
    id: TASK_IDS.apiRefactor,
    identifier: 'TASK-0007',
    title: 'Refactor GraphQL resolvers',
    description: 'Improve error handling and add DataLoader',
    status: 'in_progress',
    priority: 'high',
    assigneeId: AGENT_IDS.codeReviewer,
    creatorId: AGENT_IDS.techTalent,
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(2),
  },
  {
    id: TASK_IDS.seoAudit,
    identifier: 'TASK-0008',
    title: 'Run SEO audit on marketing site',
    description: 'Identify and fix SEO issues',
    status: 'in_progress',
    priority: 'normal',
    assigneeId: AGENT_IDS.seoBot,
    creatorId: AGENT_IDS.marketingTalent,
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(1),
  },
  
  // ========== REVIEW ==========
  {
    id: TASK_IDS.prReview,
    identifier: 'TASK-0009',
    title: 'Review PR #42: Add caching layer',
    description: 'Check implementation and suggest improvements',
    status: 'review',
    priority: 'high',
    assigneeId: AGENT_IDS.codeReviewer,
    creatorId: AGENT_IDS.techTalent,
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(4),
  },
  {
    id: TASK_IDS.invoiceCheck,
    identifier: 'TASK-0010',
    title: 'Verify invoice calculations',
    description: 'Double-check credit deductions for accuracy',
    status: 'review',
    priority: 'normal',
    assigneeId: AGENT_IDS.analyst,
    creatorId: AGENT_IDS.financeTalent,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(3),
  },
  
  // ========== DONE ==========
  {
    id: TASK_IDS.setupCI,
    identifier: 'TASK-0011',
    title: 'Set up GitHub Actions CI pipeline',
    description: 'Configure build, test, and deploy workflows',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.codeReviewer,
    creatorId: AGENT_IDS.techTalent,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(7),
    completedAt: daysAgo(7),
  },
  {
    id: TASK_IDS.landingPage,
    identifier: 'TASK-0012',
    title: 'Design landing page hero section',
    description: 'Create compelling above-the-fold content',
    status: 'done',
    priority: 'high',
    assigneeId: AGENT_IDS.copywriter,
    creatorId: AGENT_IDS.marketingTalent,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
    completedAt: daysAgo(10),
  },
  {
    id: TASK_IDS.quarterlyReport,
    identifier: 'TASK-0013',
    title: 'Generate Q4 financial report',
    description: 'Summarize all credit transactions and ROI',
    status: 'done',
    priority: 'critical',
    assigneeId: AGENT_IDS.analyst,
    creatorId: AGENT_IDS.financeTalent,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(15),
    completedAt: daysAgo(15),
  },
];

// Export helper functions
export function getTaskById(id: string): DemoTask | undefined {
  return tasks.find(t => t.id === id);
}

export function getTasksByStatus(status: TaskStatus): DemoTask[] {
  return tasks.filter(t => t.status === status);
}

export function getTasksByAssignee(assigneeId: string): DemoTask[] {
  return tasks.filter(t => t.assigneeId === assigneeId);
}

export function getTasksByPriority(priority: TaskPriority): DemoTask[] {
  return tasks.filter(t => t.priority === priority);
}

export function generateRandomTask(overrides?: Partial<DemoTask>): DemoTask {
  const titles = [
    'Fix bug in module',
    'Write documentation',
    'Review pull request',
    'Optimize performance',
    'Add new feature',
    'Update dependencies',
    'Refactor code',
    'Create tests',
  ];
  const priorities: TaskPriority[] = ['low', 'normal', 'high', 'critical'];
  const statuses: TaskStatus[] = ['backlog', 'pending', 'assigned', 'in_progress', 'review', 'done'];
  
  return {
    id: uuid(),
    identifier: nextIdentifier(),
    title: titles[Math.floor(Math.random() * titles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    creatorId: AGENT_IDS.agentDennis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
