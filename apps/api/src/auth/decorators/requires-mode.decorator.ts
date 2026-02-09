import { SetMetadata } from "@nestjs/common";

import type { AgentMode } from "@openspawn/shared-types";

export const AGENT_MODES_KEY = "agent_modes";

/**
 * Decorator to restrict endpoint access to agents with specific modes.
 *
 * @example
 * // Only workers can execute tasks
 * @RequiresMode(AgentMode.WORKER)
 * @Post('execute')
 * async executeTask() { ... }
 *
 * // Workers and orchestrators can spawn agents
 * @RequiresMode(AgentMode.WORKER, AgentMode.ORCHESTRATOR)
 * @Post('spawn')
 * async spawnAgent() { ... }
 */
export const RequiresMode = (...modes: AgentMode[]) => SetMetadata(AGENT_MODES_KEY, modes);
