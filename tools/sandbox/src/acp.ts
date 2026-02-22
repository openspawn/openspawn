// ── Shared ACP Helpers ───────────────────────────────────────────────────────
// Extracted from deterministic.ts and decision-executor.ts to eliminate duplication.
// Used by all simulation engines for creating and routing ACP messages.

import type { SandboxAgent, ACPMessage } from './types.js';

let acpCounter = 0;

/** Generate a unique ACP message ID (deterministic counter, no Math.random) */
export function acpId(): string {
  return `acp-${++acpCounter}`;
}

/** Reset the ACP counter (for tests) */
export function resetAcpCounter(): void {
  acpCounter = 0;
}

/** Create an ACP message */
export function createACPMessage(
  type: ACPMessage['type'],
  from: string,
  to: string,
  taskId: string,
  extra?: Partial<ACPMessage>,
): ACPMessage {
  return { id: acpId(), type, from, to, taskId, timestamp: Date.now(), ...extra };
}

/** Route a message to sender/receiver recentMessages and event-driven inboxes */
export function pushMessage(agents: SandboxAgent[], msg: ACPMessage): void {
  for (const agent of agents) {
    if (agent.id === msg.from || agent.id === msg.to) {
      agent.recentMessages.push(msg);
      if (agent.recentMessages.length > 10) {
        agent.recentMessages = agent.recentMessages.slice(-10);
      }
    }
    if (agent.id === msg.to && agent.trigger === 'event-driven') {
      if (!agent.triggerOn || agent.triggerOn.includes(msg.type)) {
        agent.inbox.push(msg);
      }
    }
  }
}
