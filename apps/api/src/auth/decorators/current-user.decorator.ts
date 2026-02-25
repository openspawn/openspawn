import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

import type { Request } from "express";

import type { JwtUser } from "../jwt.strategy";
import type { ApiKeyUser } from "../types";
import "../types"; // Extend Express.Request

export type AuthUser = JwtUser | ApiKeyUser;

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => {
    if (context.getType<GqlContextType>() === "graphql") {
      const gqlContext = GqlExecutionContext.create(context);
      const req = gqlContext.getContext().req as Request | undefined;
      // Check JWT user, API key user, or Passport user
      return req?.jwtUser ?? req?.apiKeyUser ?? (req?.user as JwtUser | undefined);
    }

    const request = context.switchToHttp().getRequest<Request>();
    // Check JWT user, API key user, or Passport user
    return request.jwtUser ?? request.apiKeyUser ?? (request.user as JwtUser | undefined);
  },
);
