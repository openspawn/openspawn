import { graphql, HttpResponse } from 'msw';
import type { SimulationEngine, DemoAgent, DemoTask, DemoCreditTransaction, DemoEvent } from '@openspawn/demo-data';

/**
 * Stateless MSW handlers that query SimulationEngine directly.
 * Single source of truth - no local state, no sync issues.
 */
export function createHandlers(getEngine: () => SimulationEngine | null) {
  
  // Helper to safely get engine
  const engine = () => {
    const e = getEngine();
    if (!e) throw new Error('SimulationEngine not initialized');
    return e;
  };

  // ─────────────────────────────────────────────────────────────
  // Agent Mappers
  // ─────────────────────────────────────────────────────────────
  
  function mapAgent(agent: DemoAgent) {
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

  // ─────────────────────────────────────────────────────────────
  // Task Mappers
  // ─────────────────────────────────────────────────────────────
  
  function mapTask(task: DemoTask) {
    const agents = engine().getAgents();
    const assignee = task.assigneeId 
      ? agents.find(a => a.id === task.assigneeId) 
      : null;

    return {
      id: task.id,
      identifier: task.identifier,
      title: task.title,
      description: task.description || null,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId || null,
      assignee: assignee ? {
        id: assignee.id,
        name: assignee.name,
      } : null,
      creatorId: task.creatorId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt || null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Credit Mappers
  // ─────────────────────────────────────────────────────────────
  
  function mapCredit(tx: DemoCreditTransaction, runningBalance: number) {
    return {
      id: tx.id,
      agentId: tx.agentId,
      type: tx.type,
      amount: tx.amount,
      reason: tx.description,
      balanceAfter: runningBalance,
      createdAt: tx.createdAt,
      taskId: tx.taskId || null,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Event Mappers
  // ─────────────────────────────────────────────────────────────
  
  function mapEvent(event: DemoEvent) {
    const agents = engine().getAgents();
    const actor = event.agentId ? agents.find(a => a.id === event.agentId) : null;

    // Map severity to uppercase (GraphQL enum format)
    const severityMap: Record<string, string> = {
      debug: 'INFO',
      info: 'INFO',
      success: 'INFO',
      warning: 'WARNING',
      error: 'ERROR',
      critical: 'ERROR',
    };

    return {
      id: event.id,
      type: event.type,
      actorId: event.agentId || null,
      actor: actor ? {
        id: actor.id,
        name: actor.name,
      } : null,
      entityType: event.taskId ? 'task' : (event.agentId ? 'agent' : 'system'),
      entityId: event.taskId || event.agentId || 'system',
      severity: severityMap[event.severity] || 'INFO',
      reasoning: event.message,
      createdAt: event.createdAt,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // GraphQL Handlers (Stateless - query engine on each request)
  // ─────────────────────────────────────────────────────────────
  
  return [
    // ─────────────── Agents ───────────────
    graphql.query('Agents', () => {
      const e = engine();
      const agents = e.getAgents();
      const state = e.getState();
      console.log('[MSW] Agents query → tick:', state.currentTick, 'agents:', agents.length, 
        'names:', agents.slice(0, 3).map(a => a.name));
      return HttpResponse.json({
        data: {
          agents: agents.map(mapAgent),
        },
      });
    }),

    graphql.query('Agent', ({ variables }) => {
      const agents = engine().getAgents();
      const agent = agents.find(a => a.id === variables.id);
      return HttpResponse.json({
        data: {
          agent: agent ? mapAgent(agent) : null,
        },
      });
    }),

    // ─────────────── Tasks ───────────────
    graphql.query('Tasks', () => {
      const tasks = engine().getTasks();
      console.log('[MSW] Tasks query → returning', tasks.length, 'tasks');
      return HttpResponse.json({
        data: {
          tasks: tasks.map(mapTask),
        },
      });
    }),

    graphql.query('Task', ({ variables }) => {
      const tasks = engine().getTasks();
      const task = tasks.find(t => t.id === variables.id);
      return HttpResponse.json({
        data: {
          task: task ? mapTask(task) : null,
        },
      });
    }),

    // ─────────────── Credits ───────────────
    graphql.query('Credits', ({ variables }) => {
      const { limit = 50, page = 1 } = variables || {};
      const credits = engine().getCredits();
      
      // Sort by createdAt descending
      const sorted = [...credits].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Calculate running balances (simplified - per agent would be more accurate)
      let balance = 1000; // Starting balance
      const withBalances = sorted.map(tx => {
        if (tx.type === 'CREDIT') {
          balance += tx.amount;
        } else {
          balance -= tx.amount;
        }
        return mapCredit(tx, balance);
      });
      
      const offset = (page - 1) * limit;
      const paginated = withBalances.slice(offset, offset + limit);
      
      console.log('[MSW] Credits query → returning', paginated.length, 'transactions');
      return HttpResponse.json({
        data: {
          credits: paginated,
        },
      });
    }),

    // ─────────────── Events ───────────────
    graphql.query('Events', ({ variables }) => {
      const { limit = 50, page = 1 } = variables || {};
      const e = engine();
      const events = e.getEvents();
      const state = e.getState();
      
      console.log('[MSW] Events query:', {
        totalEvents: events.length,
        tick: state.currentTick,
        isPlaying: state.isPlaying,
        scenarioEvents: state.scenario.events.length,
      });
      
      // Sort by createdAt descending (newest first)
      const sorted = [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const offset = (page - 1) * limit;
      const paginated = sorted.slice(offset, offset + limit);
      
      if (paginated.length > 0) {
        console.log('[MSW] First event:', paginated[0]);
      }
      
      return HttpResponse.json({
        data: {
          events: paginated.map(mapEvent),
        },
      });
    }),
  ];
}

// Legacy exports for backwards compatibility during migration
// TODO: Remove after DemoProvider refactor
export const handlers: never[] = [];
export function setAgents() {}
export function setTasks() {}
export function setCredits() {}
export function setEvents() {}
export function addAgent() {}
export function addTask() {}
export function addCredit() {}
export function addEvent() {}
export function updateAgent() {}
export function updateTask() {}
export function getAgents() { return []; }
export function getTasks() { return []; }
export function getCredits() { return []; }
export function getEvents() { return []; }
