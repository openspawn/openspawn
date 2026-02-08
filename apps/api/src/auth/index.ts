// Module
export { AuthModule } from "./auth.module";

// Agent auth (HMAC-based)
export { AuthService, type AuthenticatedAgent } from "./auth.service";
export { AuthGuard } from "./auth.guard";
export { RolesGuard } from "./roles.guard";

// User auth (JWT-based)
export { TokensService, type AccessTokenPayload, type TokenPair } from "./tokens.service";
export { TotpService, type TotpSetupResult } from "./totp.service";
export { JwtAuthGuard } from "./jwt-auth.guard";
export { JwtStrategy, type JwtUser } from "./jwt.strategy";
export { GoogleStrategy, type GoogleProfile } from "./google.strategy";

// Decorators
export * from "./decorators";
