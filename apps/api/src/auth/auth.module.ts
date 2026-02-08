import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { Agent, Nonce, RefreshToken, User, ApiKey } from "@openspawn/database";

import { UsersModule } from "../users";

// Agent auth (HMAC-based)
import { AuthGuard as AgentAuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { RolesGuard } from "./roles.guard";

// User auth (JWT-based)
import { AuthController } from "./auth.controller";
import { TokensService } from "./tokens.service";
import { TotpService } from "./totp.service";
import { JwtStrategy } from "./jwt.strategy";
import { GoogleStrategy } from "./google.strategy";
import { JwtAuthGuard } from "./jwt-auth.guard";

// API key auth
import { ApiKeysService } from "./api-keys.service";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeyGuard, JwtOrApiKeyGuard } from "./api-key.guard";

// User RBAC
import { UserRolesGuard, PermissionsGuard } from "./user-roles.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, Nonce, User, RefreshToken, ApiKey]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env["JWT_SECRET"];
        if (!secret) {
          throw new Error("JWT_SECRET environment variable is required");
        }
        return {
          secret,
          signOptions: { expiresIn: "15m" },
        };
      },
    }),
    UsersModule,
  ],
  controllers: [AuthController, ApiKeysController],
  providers: [
    // Agent auth
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AgentAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // User auth
    TokensService,
    TotpService,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    // API key auth
    ApiKeysService,
    ApiKeyGuard,
    JwtOrApiKeyGuard,
    // User RBAC
    UserRolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    TokensService,
    TotpService,
    JwtAuthGuard,
    ApiKeysService,
    ApiKeyGuard,
    JwtOrApiKeyGuard,
    UserRolesGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
