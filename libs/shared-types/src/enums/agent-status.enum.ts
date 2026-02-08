export enum AgentStatus {
  PENDING = "pending",      // Awaiting activation by parent/L10
  ACTIVE = "active",        // Fully operational
  SUSPENDED = "suspended",  // Temporarily disabled
  REVOKED = "revoked",      // Permanently disabled
}
