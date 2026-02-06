import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { Request } from "express";

import { IS_PUBLIC_KEY } from "./decorators/public.decorator";
import { AuthService, type AuthenticatedAgent } from "./auth.service";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      agent?: AuthenticatedAgent;
    }
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
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

    const request = context.switchToHttp().getRequest<Request>();

    // Extract auth headers
    const agentId = request.headers["x-agent-id"] as string | undefined;
    const timestamp = request.headers["x-timestamp"] as string | undefined;
    const nonce = request.headers["x-nonce"] as string | undefined;
    const signature = request.headers["x-signature"] as string | undefined;

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
