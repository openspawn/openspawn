import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType<GqlContextType>() === "graphql") {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      const req = ctx.req;
      // Ensure req exists with ip for throttler
      if (req && !req.ip) {
        req.ip = req.headers?.["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
      }
      return { req, res: ctx.res ?? req?.res ?? {} };
    }
    return super.getRequestResponse(context);
  }
}
