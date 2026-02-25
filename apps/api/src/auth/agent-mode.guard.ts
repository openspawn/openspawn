import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { Request } from "express";

import { AgentMode, MODE_LABELS } from "@openspawn/shared-types";

import { AGENT_MODES_KEY } from "./decorators/requires-mode.decorator";

/**
 * Guard that enforces agent mode restrictions.
 *
 * Checks if the authenticated agent's mode is one of the required modes
 * specified by the @RequiresMode decorator.
 *
 * If no modes are specified, the endpoint is accessible to all authenticated agents.
 */
@Injectable()
export class AgentModeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModes = this.reflector.getAllAndOverride<AgentMode[]>(AGENT_MODES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No mode restriction = allow all authenticated agents
    if (!requiredModes || requiredModes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const agent = request.agent;

    if (!agent) {
      throw new ForbiddenException("Authentication required");
    }

    // Default to worker mode for backwards compatibility
    const agentMode = agent.mode || AgentMode.WORKER;

    // Check if agent's mode is in the allowed list
    const hasRequiredMode = requiredModes.includes(agentMode);

    if (!hasRequiredMode) {
      const requiredLabels = requiredModes.map((m) => MODE_LABELS[m]).join(" or ");
      const currentLabel = MODE_LABELS[agentMode];
      throw new ForbiddenException(
        `This action requires ${requiredLabels} mode. Your current mode is ${currentLabel}.`,
      );
    }

    return true;
  }
}
