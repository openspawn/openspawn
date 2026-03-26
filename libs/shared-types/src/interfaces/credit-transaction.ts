import type { CreditType } from "../enums";

export interface CreditTransactionFields {
  id: string;
  agentId: string;
  amount: number;
  type: CreditType;
  description?: string | null;
  reason?: string | null;
  balanceAfter?: number | null;
  createdAt: string;
}
