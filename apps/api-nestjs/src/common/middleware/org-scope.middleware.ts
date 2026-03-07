import { Injectable, NestMiddleware } from "@nestjs/common";

import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      orgId?: string;
    }
  }
}

/**
 * Middleware that attaches the orgId from the authenticated agent to the request.
 * This ensures all downstream services have access to the org context.
 */
@Injectable()
export class OrgScopeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.agent) {
      req.orgId = req.agent.orgId;
    }
    next();
  }
}
