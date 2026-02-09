/**
 * Demo mode fetcher that returns data from SimulationEngine
 * No service worker needed - works on any origin, including production
 */

import type {
  SimulationEngine,
  DemoAgent,
  DemoTask,
  DemoEvent,
  DemoCreditTransaction,
  DemoMessage,
} from '@openspawn/demo-data';

// Reference to the simulation engine (set by DemoProvider)
let engineRef: (() => SimulationEngine | null) | null = null;

export function setDemoEngine(getEngine: () => SimulationEngine | null): void {
  engineRef = getEngine;
  console.log('[MockFetcher] Engine reference set');
}

// ============================================================================
// GraphQL Response Types
// ============================================================================

interface GraphQLAgentRef {
  id: string;
  name: string;
  level?: number;
}

interface GraphQLAgent {
  id: string;
  agentId: string;
  name: string;
  role: string;
  status: string;
  level: number;
  model: string;
  currentBalance: number;
  lifetimeEarnings: number;
  budgetPeriodLimit: number;
  budgetPeriodSpent: number;
  managementFeePct: number;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  domain: string | null;
  trustScore: number;
  reputationLevel: string;
  tasksCompleted: number;
  tasksSuccessful: number;
  lastActivityAt: string;
  lastPromotionAt: string | null;
}

interface PromotionProgress {
  currentLevel: number;
  nextLevel: number;
  trustScoreRequired: number;
  tasksRequired: number;
  trustScoreProgress: number;
  tasksProgress: number;
}

interface GraphQLAgentReputation {
  trustScore: number;
  reputationLevel: string;
  tasksCompleted: number;
  tasksSuccessful: number;
  successRate: number;
  lastActivityAt: string | null;
  promotionProgress: PromotionProgress | null;
}

interface GraphQLTask {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  assignee: GraphQLAgentRef | null;
  creatorId: string;
  approvalRequired: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface GraphQLCredit {
  id: string;
  agentId: string;
  type: string;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
  sourceTaskId: string | null;
  triggerType: string;
}

interface GraphQLEvent {
  id: string;
  type: string;
  actorId: string | null;
  actor: GraphQLAgentRef | null;
  entityType: string;
  entityId: string;
  severity: string;
  reasoning: string;
  createdAt: string;
}

interface GraphQLMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  fromAgent: GraphQLAgentRef | null;
  toAgent: GraphQLAgentRef | null;
  content: string;
  type: string;
  taskRef: string | null;
  read: boolean;
  createdAt: string;
}

interface GraphQLConversation {
  id: string;
  agents: GraphQLAgentRef[];
  messageCount: number;
  unreadCount: number;
  latestMessage: GraphQLMessage;
  createdAt: string;
}

interface GraphQLReputationHistoryEntry {
  id: string;
  eventType: string;
  delta: number;
  previousScore: number;
  newScore: number;
  reason: string;
  createdAt: string;
}

interface GraphQLLeaderboardEntry {
  id: string;
  agentId: string;
  name: string;
  level: number;
  trustScore: number;
  reputationLevel: string;
  tasksCompleted: number;
}

// ============================================================================
// Operation Variables Types
// ============================================================================

interface AgentVariables {
  id: string;
}

interface TaskVariables {
  id: string;
}

interface CreditsVariables {
  limit?: number;
  offset?: number;
}

interface EventsVariables {
  limit?: number;
  page?: number;
}

interface AgentReputationVariables {
  id: string;
}

interface TrustLeaderboardVariables {
  limit?: number;
}

interface ReputationHistoryVariables {
  id: string;
}

interface MessagesVariables {
  limit?: number;
}

interface ConversationMessagesVariables {
  agent1Id: string;
  agent2Id: string;
}

type OperationVariables =
  | AgentVariables
  | TaskVariables
  | CreditsVariables
  | EventsVariables
  | AgentReputationVariables
  | TrustLeaderboardVariables
  | ReputationHistoryVariables
  | MessagesVariables
  | ConversationMessagesVariables
  | Record<string, unknown>
  | undefined;

// ============================================================================
// Operation Result Types
// ============================================================================

interface AgentsResult {
  agents: GraphQLAgent[];
}

interface AgentResult {
  agent: GraphQLAgent | null;
}

interface TasksResult {
  tasks: GraphQLTask[];
}

interface TaskResult {
  task: GraphQLTask | null;
}

interface CreditHistoryResult {
  creditHistory: GraphQLCredit[];
}

interface EventsResult {
  events: GraphQLEvent[];
}

interface AgentReputationResult {
  agentReputation: GraphQLAgentReputation | null;
}

interface TrustLeaderboardResult {
  trustLeaderboard: GraphQLLeaderboardEntry[];
}

interface ReputationHistoryResult {
  reputationHistory: GraphQLReputationHistoryEntry[];
}

interface MessagesResult {
  messages: GraphQLMessage[];
}

interface ConversationsResult {
  conversations: GraphQLConversation[];
}

interface ConversationMessagesResult {
  conversationMessages: GraphQLMessage[];
}

type OperationResult =
  | AgentsResult
  | AgentResult
  | TasksResult
  | TaskResult
  | CreditHistoryResult
  | EventsResult
  | AgentReputationResult
  | TrustLeaderboardResult
  | ReputationHistoryResult
  | MessagesResult
  | ConversationsResult
  | ConversationMessagesResult
  | null;

// ============================================================================
// Severity Mapping
// ============================================================================

// Severity mapping (demo uses lowercase, GraphQL expects uppercase)
const severityMap: Record<string, string> = {
  debug: 'INFO',
  info: 'INFO',
  success: 'INFO',
  warning: 'WARNING',
  error: 'ERROR',
  critical: 'ERROR',
};

// ============================================================================
// Mapping Functions
// ============================================================================

// Map demo data to GraphQL response format
function mapAgent(agent: DemoAgent): GraphQLAgent {
  return {
    id: agent.id,
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role.toUpperCase(),
    status: agent.status.toUpperCase(),
    level: agent.level,
    model: agent.model,
    currentBalance: agent.currentBalance,
    lifetimeEarnings: agent.lifetimeEarnings || agent.currentBalance * 2, // Demo field
    budgetPeriodLimit: 10000,
    budgetPeriodSpent: Math.floor((agent.lifetimeEarnings || 0) * 0.3),
    managementFeePct: agent.level >= 9 ? 5 : 10,
    createdAt: agent.createdAt,
    updatedAt: agent.createdAt, // Required field
    parentId: agent.parentId || null,
    domain: agent.domain || null,
    // Trust & Reputation fields
    trustScore: agent.trustScore ?? 50,
    reputationLevel: agent.reputationLevel || 'TRUSTED',
    tasksCompleted: agent.tasksCompleted ?? 0,
    tasksSuccessful: agent.tasksSuccessful ?? 0,
    lastActivityAt: agent.lastActivityAt || agent.createdAt,
    lastPromotionAt: agent.lastPromotionAt || null,
  };
}

// Calculate promotion progress
function getPromotionProgress(agent: DemoAgent): PromotionProgress | null {
  const thresholds: Record<number, { trustScore: number; tasks: number }> = {
    1: { trustScore: 55, tasks: 3 },
    2: { trustScore: 60, tasks: 10 },
    3: { trustScore: 65, tasks: 25 },
    4: { trustScore: 70, tasks: 50 },
    5: { trustScore: 75, tasks: 100 },
    6: { trustScore: 80, tasks: 200 },
    7: { trustScore: 85, tasks: 500 },
    8: { trustScore: 90, tasks: 1000 },
    9: { trustScore: 95, tasks: 1500 },
  };

  const nextLevel = agent.level + 1;
  if (nextLevel > 9) return null;

  const threshold = thresholds[agent.level];
  if (!threshold) return null;

  const trustScore = agent.trustScore ?? 50;
  const tasksCompleted = agent.tasksCompleted ?? 0;

  return {
    currentLevel: agent.level,
    nextLevel,
    trustScoreRequired: threshold.trustScore,
    tasksRequired: threshold.tasks,
    trustScoreProgress: Math.min(100, (trustScore / threshold.trustScore) * 100),
    tasksProgress: Math.min(100, (tasksCompleted / threshold.tasks) * 100),
  };
}

function mapAgentReputation(agent: DemoAgent): GraphQLAgentReputation {
  const trustScore = agent.trustScore ?? 50;
  const tasksCompleted = agent.tasksCompleted ?? 0;
  const tasksSuccessful = agent.tasksSuccessful ?? 0;
  const successRate = tasksCompleted > 0 ? Math.round((tasksSuccessful / tasksCompleted) * 100) : 0;

  return {
    trustScore,
    reputationLevel: agent.reputationLevel || 'TRUSTED',
    tasksCompleted,
    tasksSuccessful,
    successRate,
    lastActivityAt: agent.lastActivityAt || null,
    promotionProgress: getPromotionProgress(agent),
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

function mapTask(task: DemoTask, agents: DemoAgent[]): GraphQLTask {
  const assignee = task.assigneeId ? agents.find((a) => a.id === task.assigneeId) : null;

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

function mapCredit(tx: DemoCreditTransaction, runningBalance: number): GraphQLCredit {
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

function mapEvent(event: DemoEvent, agents: DemoAgent[]): GraphQLEvent {
  const actor = event.agentId ? agents.find((a) => a.id === event.agentId) : null;

  return {
    id: event.id,
    type: event.type,
    actorId: event.agentId || null,
    actor: actor ? { id: actor.id, name: actor.name } : null,
    entityType: event.taskId ? 'task' : event.agentId ? 'agent' : 'system',
    entityId: event.taskId || event.agentId || 'system',
    severity: severityMap[event.severity] || 'INFO',
    reasoning: event.message,
    createdAt: event.createdAt,
  };
}

// Map demo message to GraphQL format
function mapMessage(msg: DemoMessage, agents: DemoAgent[]): GraphQLMessage {
  const fromAgent = agents.find((a) => a.id === msg.fromAgentId);
  const toAgent = agents.find((a) => a.id === msg.toAgentId);

  return {
    id: msg.id,
    fromAgentId: msg.fromAgentId,
    toAgentId: msg.toAgentId,
    fromAgent: fromAgent
      ? { id: fromAgent.id, name: fromAgent.name, level: fromAgent.level }
      : null,
    toAgent: toAgent ? { id: toAgent.id, name: toAgent.name, level: toAgent.level } : null,
    content: msg.content,
    type: msg.type.toUpperCase(),
    taskRef: msg.taskRef || null,
    read: msg.read,
    createdAt: msg.createdAt,
  };
}

// ============================================================================
// Operation Handler
// ============================================================================

// Handle GraphQL operations
function handleOperation(operationName: string, variables: OperationVariables): OperationResult {
  const engine = engineRef?.();
  if (!engine) {
    console.error('[MockFetcher] No engine available');
    return null;
  }

  const agents = engine.getAgents();
  const tasks = engine.getTasks();
  const credits = engine.getCredits();
  const events = engine.getEvents();
  const messages = engine.getMessages();

  console.log('[MockFetcher]', operationName, '→', {
    agents: agents.length,
    tasks: tasks.length,
    credits: credits.length,
    events: events.length,
    messages: messages.length,
  });

  switch (operationName) {
    case 'Agents':
      return { agents: agents.map(mapAgent) };

    case 'Agent': {
      const vars = variables as AgentVariables;
      const agent = agents.find((a) => a.id === vars.id);
      return { agent: agent ? mapAgent(agent) : null };
    }

    case 'Tasks':
      return { tasks: tasks.map((t) => mapTask(t, agents)) };

    case 'Task': {
      const vars = variables as TaskVariables;
      const task = tasks.find((t) => t.id === vars.id);
      return { task: task ? mapTask(task, agents) : null };
    }

    case 'Credits':
    case 'CreditHistory': {
      const vars = variables as CreditsVariables | undefined;
      const limit = vars?.limit ?? 50;
      const creditOffset = vars?.offset ?? 0;
      const sorted = [...credits].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Calculate running balance (start from a base and apply transactions in chronological order)
      const chronological = [...credits].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const balanceMap = new Map<string, number>();
      let runningBalance = 1000;
      chronological.forEach((tx) => {
        runningBalance += tx.type === 'CREDIT' ? tx.amount : -tx.amount;
        balanceMap.set(tx.id, runningBalance);
      });
      const withBalances = sorted.map((tx) => mapCredit(tx, balanceMap.get(tx.id) || 0));
      return { creditHistory: withBalances.slice(creditOffset, creditOffset + limit) };
    }

    case 'Events': {
      const vars = variables as EventsVariables | undefined;
      const evtLimit = vars?.limit ?? 50;
      const evtPage = vars?.page ?? 1;
      const sortedEvents = [...events].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const evtOffset = (evtPage - 1) * evtLimit;
      return {
        events: sortedEvents.slice(evtOffset, evtOffset + evtLimit).map((e) => mapEvent(e, agents)),
      };
    }

    case 'AgentReputation': {
      const vars = variables as AgentReputationVariables | undefined;
      const repAgent = agents.find((a) => a.id === vars?.id);
      return { agentReputation: repAgent ? mapAgentReputation(repAgent) : null };
    }

    case 'TrustLeaderboard': {
      const vars = variables as TrustLeaderboardVariables | undefined;
      const leaderboardLimit = vars?.limit ?? 10;
      const sortedByTrust = [...agents]
        .filter((a) => a.status === 'active')
        .sort((a, b) => (b.trustScore ?? 50) - (a.trustScore ?? 50))
        .slice(0, leaderboardLimit);
      return {
        trustLeaderboard: sortedByTrust.map((a) => ({
          id: a.id,
          agentId: a.agentId,
          name: a.name,
          level: a.level,
          trustScore: a.trustScore ?? 50,
          reputationLevel: a.reputationLevel || 'TRUSTED',
          tasksCompleted: a.tasksCompleted ?? 0,
        })),
      };
    }

    case 'ReputationHistory': {
      const vars = variables as ReputationHistoryVariables | undefined;
      // Generate some mock history events
      const histAgent = agents.find((a) => a.id === vars?.id);
      if (!histAgent) return { reputationHistory: [] };

      const mockHistory: GraphQLReputationHistoryEntry[] = [
        {
          id: `rep-${histAgent.id}-1`,
          eventType: 'TASK_COMPLETED',
          delta: 2,
          previousScore: (histAgent.trustScore ?? 50) - 2,
          newScore: histAgent.trustScore ?? 50,
          reason: 'Completed task on time',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: `rep-${histAgent.id}-2`,
          eventType: 'TASK_COMPLETED',
          delta: 1,
          previousScore: (histAgent.trustScore ?? 50) - 3,
          newScore: (histAgent.trustScore ?? 50) - 2,
          reason: 'Task completed late',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: `rep-${histAgent.id}-3`,
          eventType: 'BONUS',
          delta: 5,
          previousScore: (histAgent.trustScore ?? 50) - 8,
          newScore: (histAgent.trustScore ?? 50) - 3,
          reason: 'Outstanding performance bonus',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      return { reputationHistory: mockHistory };
    }

    case 'Messages': {
      const vars = variables as MessagesVariables | undefined;
      const msgLimit = vars?.limit ?? 50;
      const sortedMessages = [...messages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return { messages: sortedMessages.slice(0, msgLimit).map((m) => mapMessage(m, agents)) };
    }

    case 'Conversations': {
      // Group messages by conversation (pair of agents)
      const conversationMap = new Map<string, DemoMessage[]>();
      messages.forEach((msg) => {
        const key = [msg.fromAgentId, msg.toAgentId].sort().join('-');
        if (!conversationMap.has(key)) conversationMap.set(key, []);
        conversationMap.get(key)!.push(msg);
      });

      const conversations: GraphQLConversation[] = Array.from(conversationMap.entries())
        .map(([key, msgs]) => {
          const [agent1Id, agent2Id] = key.split('-');
          const agent1 = agents.find((a) => a.id === agent1Id);
          const agent2 = agents.find((a) => a.id === agent2Id);
          const latestMsg = msgs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          return {
            id: key,
            agents: [
              agent1 ? { id: agent1.id, name: agent1.name, level: agent1.level } : null,
              agent2 ? { id: agent2.id, name: agent2.name, level: agent2.level } : null,
            ].filter((a): a is GraphQLAgentRef => a !== null),
            messageCount: msgs.length,
            unreadCount: msgs.filter((m) => !m.read).length,
            latestMessage: mapMessage(latestMsg, agents),
            createdAt: latestMsg.createdAt,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return { conversations };
    }

    case 'ConversationMessages': {
      const vars = variables as ConversationMessagesVariables | undefined;
      const a1 = vars?.agent1Id;
      const a2 = vars?.agent2Id;
      if (!a1 || !a2) return { conversationMessages: [] };

      const convoMessages = messages
        .filter(
          (m) =>
            (m.fromAgentId === a1 && m.toAgentId === a2) ||
            (m.fromAgentId === a2 && m.toAgentId === a1)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((m) => mapMessage(m, agents));

      return { conversationMessages: convoMessages };
    }

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
