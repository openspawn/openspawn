import { CreditType } from "@openspawn/shared-types";
import type { DemoCreditTransaction } from "../types";
import { AGENT_IDS } from "./agents";
import { TASK_IDS } from "./tasks";

// Helper to generate UUIDs
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Base timestamp
const BASE_TIME = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

function daysAgo(days: number): string {
  return new Date(BASE_TIME.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const creditTransactions: DemoCreditTransaction[] = [
  // ========== INITIAL ALLOCATIONS ==========
  {
    id: uuid(),
    agentId: AGENT_IDS.agentDennis,
    type: CreditType.CREDIT,
    amount: 100000,
    description: "Initial COO budget allocation",
    createdAt: daysAgo(0),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.techTalent,
    type: CreditType.CREDIT,
    amount: 25000,
    description: "Initial department budget",
    createdAt: daysAgo(2),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.financeTalent,
    type: CreditType.CREDIT,
    amount: 20000,
    description: "Initial department budget",
    createdAt: daysAgo(3),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.marketingTalent,
    type: CreditType.CREDIT,
    amount: 18000,
    description: "Initial department budget",
    createdAt: daysAgo(5),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.salesTalent,
    type: CreditType.CREDIT,
    amount: 15000,
    description: "Initial department budget",
    createdAt: daysAgo(7),
  },

  // ========== TASK COMPLETIONS (EARNINGS) ==========
  {
    id: uuid(),
    agentId: AGENT_IDS.codeReviewer,
    type: CreditType.CREDIT,
    amount: 150,
    description: "Task completion: Setup CI pipeline",
    taskId: TASK_IDS.setupCI,
    createdAt: daysAgo(7),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.copywriter,
    type: CreditType.CREDIT,
    amount: 120,
    description: "Task completion: Landing page hero",
    taskId: TASK_IDS.landingPage,
    createdAt: daysAgo(10),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.analyst,
    type: CreditType.CREDIT,
    amount: 200,
    description: "Task completion: Q4 financial report",
    taskId: TASK_IDS.quarterlyReport,
    createdAt: daysAgo(15),
  },

  // ========== MODEL USAGE (DEBITS) ==========
  {
    id: uuid(),
    agentId: AGENT_IDS.codeReviewer,
    type: CreditType.DEBIT,
    amount: 45,
    description: "Model usage: claude-sonnet-4 (2.3k tokens)",
    createdAt: hoursAgo(2),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.bugHunter,
    type: CreditType.DEBIT,
    amount: 12,
    description: "Model usage: gpt-4o-mini (1.5k tokens)",
    createdAt: hoursAgo(4),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.copywriter,
    type: CreditType.DEBIT,
    amount: 38,
    description: "Model usage: claude-sonnet-4 (1.8k tokens)",
    createdAt: hoursAgo(6),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.seoBot,
    type: CreditType.DEBIT,
    amount: 8,
    description: "Model usage: gpt-4o-mini (900 tokens)",
    createdAt: hoursAgo(1),
  },

  // ========== TRANSFERS ==========
  {
    id: uuid(),
    agentId: AGENT_IDS.agentDennis,
    type: CreditType.DEBIT,
    amount: 5000,
    description: "Budget transfer to Tech Talent",
    createdAt: daysAgo(10),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.techTalent,
    type: CreditType.CREDIT,
    amount: 5000,
    description: "Budget transfer from COO",
    createdAt: daysAgo(10),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.techTalent,
    type: CreditType.DEBIT,
    amount: 2000,
    description: "Budget allocation to Code Reviewer",
    createdAt: daysAgo(8),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.codeReviewer,
    type: CreditType.CREDIT,
    amount: 2000,
    description: "Budget allocation from Tech Talent",
    createdAt: daysAgo(8),
  },

  // ========== BONUSES ==========
  {
    id: uuid(),
    agentId: AGENT_IDS.analyst,
    type: CreditType.CREDIT,
    amount: 500,
    description: "Performance bonus: Exceeded Q4 targets",
    createdAt: daysAgo(14),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.codeReviewer,
    type: CreditType.CREDIT,
    amount: 300,
    description: "Level up bonus: Promoted to L6",
    createdAt: daysAgo(12),
  },

  // ========== RECENT ACTIVITY ==========
  {
    id: uuid(),
    agentId: AGENT_IDS.prospector,
    type: CreditType.CREDIT,
    amount: 50,
    description: "Lead generation: 5 qualified leads",
    createdAt: hoursAgo(8),
  },
  {
    id: uuid(),
    agentId: AGENT_IDS.newIntern,
    type: CreditType.CREDIT,
    amount: 25,
    description: "Onboarding completion bonus",
    createdAt: hoursAgo(12),
  },
];

// Export helper functions
export function getTransactionsByAgent(agentId: string): DemoCreditTransaction[] {
  return creditTransactions.filter((t) => t.agentId === agentId);
}

export function getCredits(): DemoCreditTransaction[] {
  return creditTransactions.filter((t) => t.type === CreditType.CREDIT);
}

export function getDebits(): DemoCreditTransaction[] {
  return creditTransactions.filter((t) => t.type === CreditType.DEBIT);
}

export function getTotalCredits(agentId: string): number {
  return creditTransactions
    .filter((t) => t.agentId === agentId)
    .reduce((sum, t) => sum + (t.type === CreditType.CREDIT ? t.amount : -t.amount), 0);
}

export function generateCreditTransaction(
  agentId: string,
  type: CreditType,
  amount: number,
  description: string,
): DemoCreditTransaction {
  return {
    id: uuid(),
    agentId,
    type,
    amount,
    description,
    createdAt: new Date().toISOString(),
  };
}
