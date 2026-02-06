import { describe, expect, it } from 'vitest';

import {
  Agent,
  AgentCapability,
  Channel,
  CreditRateConfig,
  CreditTransaction,
  Event,
  IdempotencyKey,
  Message,
  Nonce,
  Organization,
  Task,
  TaskComment,
  TaskDependency,
  TaskTag,
} from './index';

describe('Entity exports', () => {
  it('should export all entities', () => {
    expect(Organization).toBeDefined();
    expect(Agent).toBeDefined();
    expect(AgentCapability).toBeDefined();
    expect(Task).toBeDefined();
    expect(TaskDependency).toBeDefined();
    expect(TaskTag).toBeDefined();
    expect(TaskComment).toBeDefined();
    expect(CreditTransaction).toBeDefined();
    expect(CreditRateConfig).toBeDefined();
    expect(Channel).toBeDefined();
    expect(Message).toBeDefined();
    expect(Event).toBeDefined();
    expect(IdempotencyKey).toBeDefined();
    expect(Nonce).toBeDefined();
  });
});
