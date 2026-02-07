import { graphql, HttpResponse } from 'msw';
import type { DemoCreditTransaction, DemoAgent } from '@openspawn/demo-data';
import { getAgents } from './agents';

let credits: DemoCreditTransaction[] = [];

export function setCredits(newCredits: DemoCreditTransaction[]) {
  credits = [...newCredits];
}

export function getCredits() {
  return credits;
}

export function addCredit(credit: DemoCreditTransaction) {
  credits.push(credit);
}

// GraphQL type mapping
function mapCredit(credit: DemoCreditTransaction) {
  const agents = getAgents();
  const agent = agents.find(a => a.id === credit.agentId);

  return {
    id: credit.id,
    type: credit.type,
    amount: credit.amount,
    description: credit.description,
    createdAt: credit.createdAt,
    agent: agent ? {
      id: agent.id,
      name: agent.name,
      agentId: agent.agentId,
    } : null,
    task: credit.taskId ? { id: credit.taskId } : null,
  };
}

export const creditHandlers = [
  // GetCreditTransactions query
  graphql.query('GetCreditTransactions', () => {
    // Sort by date descending
    const sorted = [...credits].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return HttpResponse.json({
      data: {
        creditTransactions: sorted.map(mapCredit),
      },
    });
  }),
];
