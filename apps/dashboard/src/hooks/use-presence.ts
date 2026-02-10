/**
 * Simulated real-time presence data for demo mode.
 * Assigns a handful of agents as "active" with current tasks,
 * and one or two as "error" state. The rest are idle.
 */

import { useMemo } from 'react';
import { useAgents } from './use-agents';
import { useTasks } from './use-tasks';

export type PresenceStatus = 'active' | 'busy' | 'idle' | 'error';

export interface AgentPresence {
  agentId: string;
  status: PresenceStatus;
  currentTask?: string;
  isComposing?: boolean;
}

/**
 * Returns a map of agentId → presence info.
 * In demo mode this is deterministic based on agent/task data.
 */
export function usePresence(): {
  presenceMap: Map<string, AgentPresence>;
  activeCount: number;
} {
  const { agents } = useAgents();
  const { tasks } = useTasks();

  return useMemo(() => {
    const map = new Map<string, AgentPresence>();

    if (!agents || agents.length === 0) {
      return { presenceMap: map, activeCount: 0 };
    }

    // Find agents with in-progress tasks
    const inProgressTasks = (tasks ?? []).filter(
      (t: any) => t.status === 'in_progress' || t.status === 'assigned'
    );

    const busyAgentIds = new Set<string>();
    const agentTaskMap = new Map<string, string>();

    for (const task of inProgressTasks) {
      if (task.assigneeId) {
        busyAgentIds.add(task.assigneeId);
        if (!agentTaskMap.has(task.assigneeId)) {
          agentTaskMap.set(task.assigneeId, task.title);
        }
      }
    }

    // Pick up to 4 active agents (agents with active status + tasks)
    // Mark 1 as error for visual variety
    const activeAgents = agents.filter((a: any) => a.status === 'active');
    let activeCount = 0;
    let errorSet = false;

    for (const agent of agents) {
      const id = agent.id;

      // Suspended/revoked → error
      if (agent.status === 'suspended' || agent.status === 'revoked') {
        map.set(id, { agentId: id, status: 'error' });
        if (!errorSet) errorSet = true;
        continue;
      }

      // Has in-progress task → active
      if (busyAgentIds.has(id) && agent.status === 'active') {
        activeCount++;
        map.set(id, {
          agentId: id,
          status: 'active',
          currentTask: agentTaskMap.get(id),
          // First 2 active agents are "composing" for typing indicator demo
          isComposing: activeCount <= 2,
        });
        continue;
      }

      // Paused → busy
      if (agent.status === 'paused') {
        map.set(id, { agentId: id, status: 'busy' });
        continue;
      }

      // Default idle
      map.set(id, { agentId: id, status: 'idle' });
    }

    // If no agents are active from tasks, pick first 3 active-status agents as active
    if (activeCount === 0) {
      let forced = 0;
      for (const agent of activeAgents) {
        if (forced >= 3) break;
        forced++;
        activeCount++;
        map.set(agent.id, {
          agentId: agent.id,
          status: 'active',
          currentTask: 'Processing tasks...',
          isComposing: forced <= 2,
        });
      }
    }

    return { presenceMap: map, activeCount };
  }, [agents, tasks]);
}
