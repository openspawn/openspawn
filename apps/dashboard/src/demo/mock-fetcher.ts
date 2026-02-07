/**
 * Demo mode fetcher that returns data from SimulationEngine
 * No service worker needed - works on any origin, including production
 */

import type { SimulationEngine } from '@openspawn/demo-data';

// Reference to the simulation engine (set by DemoProvider)
let engineRef: (() => SimulationEngine | null) | null = null;

export function setDemoEngine(getEngine: () => SimulationEngine | null) {
  engineRef = getEngine;
  console.log('[MockFetcher] Engine reference set');
}

// Severity mapping (demo uses lowercase, GraphQL expects uppercase)
const severityMap: Record<string, string> = {
  debug: 'INFO',
  info: 'INFO',
  success: 'INFO',
  warning: 'WARNING',
  error: 'ERROR',
  critical: 'ERROR',
};

// Map demo data to GraphQL response format
function mapAgent(agent: any) {
  return {
    id: agent.id,
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role.toUpperCase(),
    status: agent.status.toUpperCase(),
    level: agent.level,
    model: agent.model,
    currentBalance: agent.currentBalance,
    budgetPeriodLimit: 10000,
    budgetPeriodSpent: Math.floor(agent.lifetimeEarnings * 0.3),
    managementFeePct: agent.level >= 9 ? 5 : 10,
    createdAt: agent.createdAt,
    parentId: agent.parentId || null,
    domain: agent.domain || null,
  };
}

// Map demo task status to GraphQL status
const taskStatusMap: Record<string, string> = {
  backlog: 'BACKLOG',
  pending: 'TODO',
  assigned: 'TODO',
  in_progress: 'IN_PROGRESS',
  review: 'REVIEW',
  done: 'DONE',
  cancelled: 'CANCELLED',
};

function mapTask(task: any, agents: any[]) {
  const assignee = task.assigneeId 
    ? agents.find((a: any) => a.id === task.assigneeId) 
    : null;

  return {
    id: task.id,
    identifier: task.identifier,
    title: task.title,
    description: task.description || null,
    status: taskStatusMap[task.status] || task.status.toUpperCase(),
    priority: task.priority.toUpperCase(),
    assigneeId: task.assigneeId || null,
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    creatorId: task.creatorId,
    approvalRequired: false,
    dueDate: null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt || null,
  };
}

function mapCredit(tx: any, runningBalance: number) {
  return {
    id: tx.id,
    agentId: tx.agentId,
    type: tx.type,
    amount: tx.amount,
    reason: tx.description || 'Transaction',
    balanceAfter: runningBalance,
    createdAt: tx.createdAt,
    sourceTaskId: tx.taskId || null,
    triggerType: tx.type === 'DEBIT' ? 'model_usage' : 'task_completion',
  };
}

function mapEvent(event: any, agents: any[]) {
  const actor = event.agentId ? agents.find((a: any) => a.id === event.agentId) : null;

  return {
    id: event.id,
    type: event.type,
    actorId: event.agentId || null,
    actor: actor ? { id: actor.id, name: actor.name } : null,
    entityType: event.taskId ? 'task' : (event.agentId ? 'agent' : 'system'),
    entityId: event.taskId || event.agentId || 'system',
    severity: severityMap[event.severity] || 'INFO',
    reasoning: event.message,
    createdAt: event.createdAt,
  };
}

// Handle GraphQL operations
function handleOperation(operationName: string, variables: any): any {
  const engine = engineRef?.();
  if (!engine) {
    console.error('[MockFetcher] No engine available');
    return null;
  }

  const agents = engine.getAgents();
  const tasks = engine.getTasks();
  const credits = engine.getCredits();
  const events = engine.getEvents();

  console.log('[MockFetcher]', operationName, '→', {
    agents: agents.length,
    tasks: tasks.length,
    credits: credits.length,
    events: events.length,
  });

  switch (operationName) {
    case 'Agents':
      return { agents: agents.map(mapAgent) };

    case 'Agent':
      const agent = agents.find(a => a.id === variables.id);
      return { agent: agent ? mapAgent(agent) : null };

    case 'Tasks':
      return { tasks: tasks.map(t => mapTask(t, agents)) };

    case 'Task':
      const task = tasks.find(t => t.id === variables.id);
      return { task: task ? mapTask(task, agents) : null };

    case 'Credits':
    case 'CreditHistory':
      const { limit = 50, offset: creditOffset = 0 } = variables || {};
      const sorted = [...credits].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Calculate running balance (start from a base and apply transactions in chronological order)
      const chronological = [...credits].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const balanceMap = new Map<string, number>();
      let runningBalance = 1000;
      chronological.forEach(tx => {
        runningBalance += tx.type === 'CREDIT' ? tx.amount : -tx.amount;
        balanceMap.set(tx.id, runningBalance);
      });
      const withBalances = sorted.map(tx => mapCredit(tx, balanceMap.get(tx.id) || 0));
      return { creditHistory: withBalances.slice(creditOffset, creditOffset + limit) };

    case 'Events':
      const evtLimit = variables?.limit || 50;
      const evtPage = variables?.page || 1;
      const sortedEvents = [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const evtOffset = (evtPage - 1) * evtLimit;
      return { events: sortedEvents.slice(evtOffset, evtOffset + evtLimit).map(e => mapEvent(e, agents)) };

    default:
      console.warn('[MockFetcher] Unknown operation:', operationName);
      return null;
  }
}

// Extract operation name from GraphQL query
function extractOperationName(query: string): string {
  const match = query.match(/(?:query|mutation)\s+(\w+)/);
  return match?.[1] || 'Unknown';
}

/**
 * Demo fetcher - intercepts GraphQL requests and returns mock data
 */
export function demoFetcher<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables
): () => Promise<TData> {
  return async () => {
    const operationName = extractOperationName(query);
    const result = handleOperation(operationName, variables);
    
    if (result === null) {
      throw new Error(`Demo mode: Operation ${operationName} not supported`);
    }
    
    return result as TData;
  };
}
