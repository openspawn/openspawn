import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

import type { Request } from "express";

import type { JwtUser } from "../jwt.strategy";
import "../types"; // Extend Express.Request

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtUser | undefined => {
    if (context.getType<GqlContextType>() === "graphql") {
      const gqlContext = GqlExecutionContext.create(context);
      const req = gqlContext.getContext().req as Request | undefined;
      // Passport attaches user to req.user, our guard copies it to jwtUser
      return req?.jwtUser ?? (req?.user as JwtUser | undefined);
    }

    const request = context.switchToHttp().getRequest<Request>();
    // Passport attaches user to req.user, our guard copies it to jwtUser
    return request.jwtUser ?? (request.user as JwtUser | undefined);
  },
);
