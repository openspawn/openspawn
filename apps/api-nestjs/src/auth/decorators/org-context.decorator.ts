import { createParamDecorator, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

import type { Request } from "express";

/**
 * Security Model:
 * Organization access is validated at the gateway level via JWT claims.
 * Direct API access requires agent HMAC authentication which is org-scoped.
 *
 * This decorator extracts the authenticated organization ID from the request context,
 * supporting both JWT-authenticated users and HMAC-authenticated agents.
 */
export const OrgFromContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    let request: Request;

    if (context.getType<GqlContextType>() === "graphql") {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().req as Request;
    } else {
      request = context.switchToHttp().getRequest<Request>();
    }

    if (!request) {
      return undefined;
    }

    // Priority: Agent HMAC auth > API Key > JWT user
    // Agent HMAC authentication already validates org scope
    if (request.agent?.orgId) {
      return request.agent.orgId;
    }

    // API key contains orgId from key registration
    if (request.apiKeyUser?.orgId) {
      return request.apiKeyUser.orgId;
    }

    // JWT contains orgId from authentication claims
    if (request.jwtUser?.orgId) {
      return request.jwtUser.orgId;
    }

    return undefined;
  },
);

/**
 * Validates that the requested orgId matches the authenticated context.
 * Throws ForbiddenException if there's a mismatch.
 *
 * Security Model:
 * - If authenticated: requested orgId MUST match authenticated orgId
 * - If unauthenticated: currently allows access (for demo purposes)
 *   TODO: Enforce authentication for all org-scoped queries
 *
 * @param requestedOrgId - The orgId parameter from the GraphQL query
 * @param authenticatedOrgId - The orgId from authenticated context (or undefined)
 * @throws ForbiddenException if authenticated user requests different org's data
 */
export function validateOrgAccess(
  requestedOrgId: string,
  authenticatedOrgId: string | undefined,
): void {
  // If user is authenticated, they can only access their own org
  if (authenticatedOrgId && requestedOrgId !== authenticatedOrgId) {
    throw new ForbiddenException(
      `Access denied: You do not have permission to access organization ${requestedOrgId}`,
    );
  }

  // TODO: Once auth is fully enforced, reject unauthenticated requests
  // if (!authenticatedOrgId) {
  //   throw new UnauthorizedException('Authentication required');
  // }
}
