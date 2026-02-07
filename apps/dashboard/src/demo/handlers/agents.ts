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

// GraphQL type mapping
function mapAgent(agent: DemoAgent) {
  return {
    id: agent.id,
    agentId: agent.agentId,
    name: agent.name,
    role: agent.role,
    level: agent.level,
    status: agent.status,
    model: agent.model,
    currentBalance: agent.currentBalance,
    lifetimeEarnings: agent.lifetimeEarnings,
    createdAt: agent.createdAt,
  };
}

export const agentHandlers = [
  // GetAgents query
  graphql.query('GetAgents', () => {
    return HttpResponse.json({
      data: {
        agents: agents.map(mapAgent),
      },
    });
  }),

  // GetAgent query
  graphql.query('GetAgent', ({ variables }) => {
    const agent = agents.find(a => a.id === variables.id);
    return HttpResponse.json({
      data: {
        agent: agent ? mapAgent(agent) : null,
      },
    });
  }),
];
