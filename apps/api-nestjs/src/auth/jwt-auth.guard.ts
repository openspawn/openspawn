import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

import type { Request } from "express";

import { IS_PUBLIC_KEY } from "./decorators/public.decorator";
import type { JwtUser } from "./jwt.strategy";
import "./types"; // Extend Express.Request

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  getRequest(context: ExecutionContext): Request {
    // Handle GraphQL vs HTTP context
    if (context.getType<GqlContextType>() === "graphql") {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext().req;
    }
    return context.switchToHttp().getRequest<Request>();
  }

  handleRequest<TUser = JwtUser>(
    err: Error | null,
    user: TUser | false,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    // Check if route is marked as public (allow unauthenticated)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // Attach user to request if available
      if (user) {
        const request = this.getRequest(context);
        request.jwtUser = user as unknown as JwtUser;
      }
      return user as TUser;
    }

    if (err || !user) {
      throw err || new UnauthorizedException("Authentication required");
    }

    // Attach user to jwtUser property
    const request = this.getRequest(context);
    request.jwtUser = user as unknown as JwtUser;

    return user;
  }
}
