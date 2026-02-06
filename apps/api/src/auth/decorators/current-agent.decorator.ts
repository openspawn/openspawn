import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { Request } from "express";

import type { AuthenticatedAgent } from "../auth.service";

export const CurrentAgent = createParamDecorator(
  (data: keyof AuthenticatedAgent | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const agent = request.agent;

    if (!agent) {
      return null;
    }

    return data ? agent[data] : agent;
  },
);
