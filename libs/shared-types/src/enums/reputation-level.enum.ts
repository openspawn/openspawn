/**
 * Agent reputation levels based on trust score
 */
export enum ReputationLevel {
  /** 0-30: New agent, limited trust */
  NEW = "NEW",
  /** 31-40: Under review, trust issues */
  PROBATION = "PROBATION",
  /** 41-70: Standard trust level */
  TRUSTED = "TRUSTED",
  /** 71-85: High trust, proven track record */
  VETERAN = "VETERAN",
  /** 86-100: Maximum trust, elite performer */
  ELITE = "ELITE",
}

/**
 * Get reputation level from trust score
 */
export function getReputationLevel(trustScore: number): ReputationLevel {
  if (trustScore <= 30) return ReputationLevel.NEW;
  if (trustScore <= 40) return ReputationLevel.PROBATION;
  if (trustScore <= 70) return ReputationLevel.TRUSTED;
  if (trustScore <= 85) return ReputationLevel.VETERAN;
  return ReputationLevel.ELITE;
}
