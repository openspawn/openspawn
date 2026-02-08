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

// API key auth
export { ApiKeysService, type CreateApiKeyDto, type ApiKeyWithSecret, type ApiKeyResponse } from "./api-keys.service";
export { ApiKeyGuard, JwtOrApiKeyGuard, RequireScope, API_KEY_SCOPE } from "./api-key.guard";

// User RBAC
export {
  UserRolesGuard,
  PermissionsGuard,
  UserRoles,
  USER_ROLES_KEY,
  RequirePermissions,
  PERMISSIONS_KEY,
  Permission,
  PERMISSION_ROLES,
  hasMinimumRole,
} from "./user-roles.guard";

// Types
export type { ApiKeyUser } from "./types";

// Decorators
export * from "./decorators";
