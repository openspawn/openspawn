/**
 * Status of a consensus request
 */
export enum ConsensusStatus {
  /** Voting in progress */
  PENDING = "PENDING",
  /** Quorum reached, approved */
  APPROVED = "APPROVED",
  /** Quorum reached, rejected */
  REJECTED = "REJECTED",
  /** Voting period expired without quorum */
  EXPIRED = "EXPIRED",
  /** Cancelled by requester */
  CANCELLED = "CANCELLED",
}

/**
 * Individual vote values
 */
export enum VoteValue {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  ABSTAIN = "ABSTAIN",
}

/**
 * Types of decisions requiring consensus
 */
export enum ConsensusType {
  /** Promote an agent */
  AGENT_PROMOTION = "AGENT_PROMOTION",
  /** Demote an agent */
  AGENT_DEMOTION = "AGENT_DEMOTION",
  /** Revoke an agent */
  AGENT_REVOCATION = "AGENT_REVOCATION",
  /** Large credit transfer */
  CREDIT_TRANSFER = "CREDIT_TRANSFER",
  /** High-priority task approval */
  TASK_APPROVAL = "TASK_APPROVAL",
  /** Policy change */
  POLICY_CHANGE = "POLICY_CHANGE",
  /** Custom decision */
  CUSTOM = "CUSTOM",
}
