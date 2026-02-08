import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeyScope } from "@openspawn/database";

export const API_KEY_SCOPE = "api_key_scope";
export const RequireScope = (scope: ApiKeyScope) => SetMetadata(API_KEY_SCOPE, scope);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract API key from header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException("Missing authorization header");
    }

    // Support both "Bearer osp_..." and "ApiKey osp_..."
    const [scheme, key] = authHeader.split(" ");
    if (!key || (scheme !== "Bearer" && scheme !== "ApiKey")) {
      throw new UnauthorizedException("Invalid authorization format");
    }

    // Only handle API keys (osp_ prefix), let JWT guard handle JWTs
    if (!key.startsWith("osp_")) {
      throw new UnauthorizedException("Invalid API key format");
    }

    const result = await this.apiKeysService.validateKey(key);
    if (!result) {
      throw new UnauthorizedException("Invalid or expired API key");
    }

    // Check required scope
    const requiredScope = this.reflector.get<ApiKeyScope>(
      API_KEY_SCOPE,
      context.getHandler()
    );

    if (requiredScope && !this.apiKeysService.hasScope(result.scopes, requiredScope)) {
      throw new UnauthorizedException(
        `API key missing required scope: ${requiredScope}`
      );
    }

    // Attach user info to request
    (request as any).apiKeyUser = {
      id: result.userId,
      sub: result.userId,
      orgId: result.orgId,
      scopes: result.scopes,
      isApiKey: true,
    };

    return true;
  }
}

/**
 * Combined guard that accepts either JWT or API key
 */
@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const [scheme, token] = authHeader.split(" ");
    if (!token) {
      throw new UnauthorizedException("Invalid authorization format");
    }

    // API key authentication
    if (token.startsWith("osp_")) {
      const result = await this.apiKeysService.validateKey(token);
      if (!result) {
        throw new UnauthorizedException("Invalid or expired API key");
      }

      // Check required scope
      const requiredScope = this.reflector.get<ApiKeyScope>(
        API_KEY_SCOPE,
        context.getHandler()
      );

      if (requiredScope && !this.apiKeysService.hasScope(result.scopes, requiredScope)) {
        throw new UnauthorizedException(
          `API key missing required scope: ${requiredScope}`
        );
      }

      (request as any).apiKeyUser = {
        id: result.userId,
        sub: result.userId,
        orgId: result.orgId,
        scopes: result.scopes,
        isApiKey: true,
      };

      return true;
    }

    // For JWT, let the JwtAuthGuard handle it
    // This guard should be used in combination with JwtAuthGuard
    // or the route should check request.jwtUser
    return true;
  }
}
