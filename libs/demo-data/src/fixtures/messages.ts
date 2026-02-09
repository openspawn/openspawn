import type { DemoMessage, MessageType } from '../types.js';

// Message templates by type
const MESSAGE_TEMPLATES: Record<MessageType, string[]> = {
  task: [
    'Working on {taskRef} now. Should have it done by EOD.',
    'Just started {taskRef}. Initial analysis looks straightforward.',
    'Need your input on {taskRef} - can we sync?',
    'Completed the first phase of {taskRef}.',
    '{taskRef} is blocked - waiting on external dependencies.',
  ],
  status: [
    'Making good progress today. 3 tasks completed.',
    'All clear on my end. Ready for new assignments.',
    'Running behind schedule - will need to prioritize.',
    'Just wrapped up the morning batch. Taking a short break.',
    'Systems nominal. All processes running smoothly.',
  ],
  report: [
    'Competitor analysis complete. Key findings: they focus on enterprise.',
    'Weekly metrics: 47 tasks completed, 98% success rate.',
    'Performance report ready for review.',
    'Cost analysis shows 15% efficiency improvement.',
    'Audit complete. No critical issues found.',
  ],
  question: [
    'What priority level should I assign to the new requests?',
    'Can you clarify the requirements for the API integration?',
    'Should I escalate this to the manager?',
    'Is there a deadline for the documentation update?',
    'Who should I coordinate with on the security review?',
  ],
  escalation: [
    'URGENT: Production issue detected. Need immediate attention.',
    'Escalating: Budget threshold exceeded by 20%.',
    'Critical: Agent unresponsive for 2 hours.',
    'Alert: Unusual activity pattern detected.',
    'Priority escalation: Customer-facing issue reported.',
  ],
  general: [
    'Good morning team! Ready for another productive day.',
    'Thanks for the quick turnaround on that request.',
    'Great work on the release yesterday!',
    'Reminder: Team sync in 30 minutes.',
    'FYI - I\'ll be offline for maintenance at 3 PM.',
  ],
};

// Helper to generate UUID
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a random message between two agents
 */
export function generateMessage(
  fromAgentId: string,
  toAgentId: string,
  options?: {
    type?: MessageType;
    taskRef?: string;
    hoursAgo?: number;
  }
): DemoMessage {
  const type = options?.type || randomFrom<MessageType>(['task', 'status', 'general', 'question']);
  const templates = MESSAGE_TEMPLATES[type];
  let content = randomFrom(templates);
  
  // Replace {taskRef} placeholder
  if (content.includes('{taskRef}')) {
    const taskRef = options?.taskRef || `TASK-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    content = content.replace('{taskRef}', taskRef);
  }

  const hoursAgo = options?.hoursAgo ?? Math.random() * 48;
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return {
    id: `msg-${uuid()}`,
    fromAgentId,
    toAgentId,
    content,
    type,
    taskRef: options?.taskRef,
    read: Math.random() > 0.3, // 70% read
    createdAt: createdAt.toISOString(),
  };
}

/**
 * Generate a conversation between two agents (back and forth)
 */
export function generateConversation(
  agent1Id: string,
  agent2Id: string,
  messageCount: number = 4,
  taskRef?: string
): DemoMessage[] {
  const messages: DemoMessage[] = [];
  const types: MessageType[] = ['task', 'status', 'question', 'general'];
  
  for (let i = 0; i < messageCount; i++) {
    const fromAgent = i % 2 === 0 ? agent1Id : agent2Id;
    const toAgent = i % 2 === 0 ? agent2Id : agent1Id;
    const hoursAgo = (messageCount - i) * 0.5; // Most recent last
    
    messages.push(generateMessage(fromAgent, toAgent, {
      type: types[i % types.length],
      taskRef: i === 0 ? taskRef : undefined,
      hoursAgo,
    }));
  }
  
  return messages;
}

/**
 * Generate initial messages for a scenario
 */
export function generateInitialMessages(agentIds: string[], taskIds: string[]): DemoMessage[] {
  const messages: DemoMessage[] = [];
  
  // Generate some conversations between agents
  for (let i = 0; i < agentIds.length; i++) {
    for (let j = i + 1; j < agentIds.length; j++) {
      // ~60% chance of conversation between any two agents
      if (Math.random() < 0.6) {
        const taskRef = taskIds.length > 0 && Math.random() > 0.5
          ? randomFrom(taskIds)
          : undefined;
        messages.push(...generateConversation(agentIds[i], agentIds[j], 2 + Math.floor(Math.random() * 4), taskRef));
      }
    }
  }
  
  return messages;
}
