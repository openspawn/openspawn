export interface MockAgent {
  id: string;
  name: string;
  status: "active" | "idle" | "error" | "offline";
  level: number;
  model: string;
  tokensUsed: number;
  tasksCompleted: number;
  createdAt: string;
  lastActiveAt: string;
}

/**
 * Create a mock agent with sensible defaults. Override any field.
 */
export function createMockAgent(overrides: Partial<MockAgent> = {}): MockAgent {
  return {
    id: "agent-001",
    name: "Alpha",
    status: "active",
    level: 1,
    model: "gpt-4o",
    tokensUsed: 12500,
    tasksCompleted: 8,
    createdAt: "2026-02-20T10:00:00Z",
    lastActiveAt: "2026-03-01T22:00:00Z",
    ...overrides,
  };
}

/**
 * A set of mock agents with varied statuses for testing lists/tables.
 */
export const mockAgents: MockAgent[] = [
  createMockAgent({ id: "agent-001", name: "Alpha", status: "active", tokensUsed: 12500, tasksCompleted: 8 }),
  createMockAgent({ id: "agent-002", name: "Bravo", status: "idle", level: 2, tokensUsed: 8700, tasksCompleted: 5 }),
  createMockAgent({ id: "agent-003", name: "Charlie", status: "error", level: 1, model: "claude-3.5-sonnet", tokensUsed: 3200, tasksCompleted: 2 }),
  createMockAgent({ id: "agent-004", name: "Delta", status: "offline", level: 3, tokensUsed: 0, tasksCompleted: 0 }),
];
