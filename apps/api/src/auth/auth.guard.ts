import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

import type { Request } from "express";

import { IS_PUBLIC_KEY } from "./decorators/public.decorator";
import { AuthService } from "./auth.service";
import { ApiKeysService } from "./api-keys.service";
import "./types"; // Extend Express.Request

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Handle GraphQL vs HTTP context
    let request: Request;
    if (context.getType<GqlContextType>() === "graphql") {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().req;
    } else {
      request = context.switchToHttp().getRequest<Request>();
    }

    // If no request object (e.g., WebSocket subscription), skip auth for now
    if (!request || !request.headers) {
      // For subscriptions and dashboard queries, allow unauthenticated access
      // TODO: Implement proper subscription auth
      return true;
    }

    // Check for API key in Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer osp_")) {
      const key = authHeader.slice(7);
      const result = await this.apiKeysService.validateKey(key);
      if (result) {
        request.apiKeyUser = {
          id: result.userId,
          sub: result.userId,
          orgId: result.orgId,
          scopes: result.scopes,
          isApiKey: true,
        };
        return true;
      }
      throw new UnauthorizedException("Invalid API key");
    }

    // Extract agent auth headers
    const agentId = request.headers["x-agent-id"] as string | undefined;
    const timestamp = request.headers["x-timestamp"] as string | undefined;
    const nonce = request.headers["x-nonce"] as string | undefined;
    const signature = request.headers["x-signature"] as string | undefined;

    // If no auth headers, allow unauthenticated access for dashboard
    // TODO: Implement proper role-based access control for GraphQL
    if (!agentId && !signature) {
      return true;
    }

    if (!agentId || !timestamp || !nonce || !signature) {
      throw new UnauthorizedException("Missing authentication headers");
    }

    // Get request body as string for signature verification
    const body =
      request.method === "GET" || request.method === "DELETE"
        ? ""
        : JSON.stringify(request.body || {});

    // Validate the request
    const agent = await this.authService.validateRequest(
      agentId,
      timestamp,
      nonce,
      signature,
      request.method,
      request.path,
      body,
    );

    // Attach agent to request
    request.agent = agent;

    return true;
  }
}
