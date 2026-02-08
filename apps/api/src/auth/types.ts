import type { AuthenticatedAgent } from "./auth.service";
import type { JwtUser } from "./jwt.strategy";
import type { ApiKeyScope } from "@openspawn/database";

export interface ApiKeyUser {
  id: string; // User ID (same as sub for compatibility)
  sub: string; // User ID
  orgId: string;
  scopes: ApiKeyScope[];
  isApiKey: true;
}

// Extend Express Request to include our auth info
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      agent?: AuthenticatedAgent; // HMAC-authenticated agent
      jwtUser?: JwtUser; // JWT-authenticated human user
      apiKeyUser?: ApiKeyUser; // API key authenticated user
    }
  }
}

export {};
