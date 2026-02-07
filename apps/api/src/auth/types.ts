import type { AuthenticatedAgent } from "./auth.service";
import type { JwtUser } from "./jwt.strategy";

// Extend Express Request to include our auth info
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      agent?: AuthenticatedAgent; // HMAC-authenticated agent
      jwtUser?: JwtUser; // JWT-authenticated human user
    }
  }
}

export {};
