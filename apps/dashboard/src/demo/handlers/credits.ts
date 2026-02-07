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

// GraphQL type mapping - matches CreditHistory query
function mapCredit(credit: DemoCreditTransaction) {
  const agents = getAgents();
  const agent = agents.find(a => a.id === credit.agentId);

  return {
    id: credit.id,
    agentId: credit.agentId,
    type: credit.type,
    amount: credit.amount,
    balanceAfter: agent?.currentBalance ?? 0,
    reason: credit.description,
    triggerType: credit.taskId ? 'task_completion' : 'manual',
    sourceTaskId: credit.taskId || null,
    createdAt: credit.createdAt,
  };
}

export const creditHandlers = [
  // CreditHistory query
  graphql.query('CreditHistory', ({ variables }) => {
    const { agentId, limit = 50, offset = 0 } = variables;
    
    let filtered = credits;
    if (agentId) {
      filtered = credits.filter(c => c.agentId === agentId);
    }
    
    // Sort by createdAt descending
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const paginated = sorted.slice(offset, offset + limit);
    
    return HttpResponse.json({
      data: {
        creditHistory: paginated.map(mapCredit),
      },
    });
  }),
];
