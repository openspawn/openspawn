import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { Request } from "express";

import type { AuthenticatedAgent } from "../auth.service";

export const CurrentAgent = createParamDecorator(
  (data: keyof AuthenticatedAgent | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    
    // First check for agent HMAC auth
    let agent = request.agent;

    // Fall back to API key or JWT user (for admin/dashboard access)
    if (!agent && (request.apiKeyUser || request.jwtUser)) {
      const user = request.apiKeyUser || request.jwtUser;
      if (user) {
        // Create a pseudo-agent context from user auth
        agent = {
          id: user.id,
          orgId: user.orgId,
          agentId: "api-user",
          name: "API User",
          role: "HR" as const, // API key users get HR-level access
          level: 10,
        } as AuthenticatedAgent;
      }
    }

    if (!agent) {
      return null;
    }

    return data ? agent[data] : agent;
  },
);
