import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

import type { Request } from "express";

import { IS_PUBLIC_KEY } from "./decorators/public.decorator";
import { AuthService } from "./auth.service";
import { ApiKeysService } from "./api-keys.service";
import { TokensService } from "./tokens.service";
import { UsersService } from "../users";
import "./types"; // Extend Express.Request

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeysService: ApiKeysService,
    private readonly tokensService: TokensService,
    private readonly usersService: UsersService,
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
    // TODO: Implement WebSocket authentication via connection params
    // WebSocket subscriptions should validate auth during the connection handshake,
    // not on each message. This requires changes to the GraphQL subscription setup.
    if (!request || !request.headers) {
      return true;
    }

    // Check for API key in Authorization header (Bearer osp_...)
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

    // If agent headers are present, validate HMAC signature
    if (agentId || signature) {
      if (!agentId || !timestamp || !nonce || !signature) {
        throw new UnauthorizedException("Missing authentication headers: x-agent-id, x-timestamp, x-nonce, and x-signature are all required");
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

    // No agent headers - check for JWT Bearer token (dashboard users)
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = this.tokensService.verifyAccessToken(token);
        
        // Look up user to verify they still exist and get full info
        const user = await this.usersService.findById(payload.sub);
        if (!user) {
          throw new UnauthorizedException("User not found");
        }

        request.jwtUser = {
          id: user.id,
          orgId: user.orgId,
          email: user.email,
          name: user.name,
          role: user.role,
        };
        return true;
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException("Invalid or expired JWT token");
      }
    }

    // No valid authentication provided
    throw new UnauthorizedException(
      "Authentication required. Provide either a valid JWT Bearer token, API key (Bearer osp_...), or agent HMAC signature headers."
    );
  }
}
