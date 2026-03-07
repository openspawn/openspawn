import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { Request } from "express";

import type { AgentRole } from "@openspawn/shared-types";

import { ROLES_KEY } from "./decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AgentRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required = allow
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const agent = request.agent;

    if (!agent) {
      throw new ForbiddenException("Authentication required");
    }

    const hasRole = requiredRoles.some((role) => agent.role === role);

    if (!hasRole) {
      throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(", ")}`);
    }

    return true;
  }
}
