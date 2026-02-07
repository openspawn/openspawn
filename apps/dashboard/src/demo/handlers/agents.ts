import { graphql, HttpResponse } from 'msw';
import type { DemoAgent } from '@openspawn/demo-data';

let agents: DemoAgent[] = [];

export function setAgents(newAgents: DemoAgent[]) {
  agents = [...newAgents];
}

export function getAgents() {
  return agents;
}

export function updateAgent(id: string, updates: Partial<DemoAgent>) {
  const index = agents.findIndex(a => a.id === id);
  if (index >= 0) {
    agents[index] = { ...agents[index], ...updates };
  }
}

export function addAgent(agent: DemoAgent) {
  agents.push(agent);
}

// GraphQL type mapping - must match Agents query fields
function mapAgent(agent: DemoAgent) {
  return {
    id: agent.id,
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role.toUpperCase(), // GraphQL expects uppercase
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

export const agentHandlers = [
  // Agents query
  graphql.query('Agents', () => {
    console.log('[MSW] Agents query intercepted, returning', agents.length, 'agents');
    return HttpResponse.json({
      data: {
        agents: agents.map(mapAgent),
      },
    });
  }),

  // Agent query (single)
  graphql.query('Agent', ({ variables }) => {
    const agent = agents.find(a => a.id === variables.id);
    return HttpResponse.json({
      data: {
        agent: agent ? mapAgent(agent) : null,
      },
    });
  }),
];
