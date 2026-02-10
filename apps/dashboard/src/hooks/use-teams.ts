import { useMemo } from 'react';
import {
  teams,
  type Team,
  getParentTeams,
  getSubTeams,
  getTeamById,
  getTeamColor,
} from '../demo/teams';
import { useAgents, type Agent } from './use-agents';

export type { Team } from '../demo/teams';

/** Returns all teams. */
export function useTeams() {
  return useMemo(
    () => ({
      teams,
      parentTeams: getParentTeams(),
      getSubTeams,
      getTeamById,
      getTeamColor,
    }),
    [],
  );
}

/** Returns agents belonging to a specific team. */
export function useTeamAgents(teamId: string | undefined) {
  const { agents } = useAgents();

  return useMemo(() => {
    if (!teamId) return [];
    // The mock-fetcher exposes `teamId` as an extra field on the mapped agent.
    // The GraphQL type doesn't know about it, so we cast through `any`.
    return agents.filter(
      (a) => (a as Agent & { teamId?: string }).teamId === teamId,
    );
  }, [agents, teamId]);
}

export interface TeamStats {
  agentCount: number;
  activeCount: number;
  totalCredits: number;
  taskCompletionRate: number; // 0-100
}

/** Aggregate stats for a team (including sub-teams when requested). */
export function useTeamStats(teamId: string | undefined): TeamStats {
  const { agents } = useAgents();

  return useMemo(() => {
    if (!teamId) {
      return { agentCount: 0, activeCount: 0, totalCredits: 0, taskCompletionRate: 0 };
    }

    // Collect all team IDs that should be included (this team + sub-teams)
    const teamIds = new Set<string>([teamId]);
    getSubTeams(teamId).forEach((sub) => teamIds.add(sub.id));

    const teamAgents = agents.filter((a) =>
      teamIds.has((a as Agent & { teamId?: string }).teamId ?? ''),
    );

    const agentCount = teamAgents.length;
    const activeCount = teamAgents.filter(
      (a) => a.status?.toString().toUpperCase() === 'ACTIVE',
    ).length;
    const totalCredits = teamAgents.reduce(
      (sum, a) => sum + (a.currentBalance ?? 0),
      0,
    );

    const totalCompleted = teamAgents.reduce(
      (sum, a) => sum + (a.tasksCompleted ?? 0),
      0,
    );
    const totalSuccessful = teamAgents.reduce(
      (sum, a) => sum + (a.tasksSuccessful ?? 0),
      0,
    );
    const taskCompletionRate =
      totalCompleted > 0
        ? Math.round((totalSuccessful / totalCompleted) * 100)
        : 0;

    return { agentCount, activeCount, totalCredits, taskCompletionRate };
  }, [agents, teamId]);
}
