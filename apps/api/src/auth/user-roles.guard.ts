import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { UserRole } from "@openspawn/database";

export const USER_ROLES_KEY = "user_roles";

/**
 * Decorator to require specific user roles
 * @example @UserRoles(UserRole.ADMIN, UserRole.OPERATOR)
 */
export const UserRoles = (...roles: UserRole[]) => SetMetadata(USER_ROLES_KEY, roles);

/**
 * Role hierarchy: ADMIN > OPERATOR > VIEWER
 * Higher roles include lower role permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.OPERATOR]: 2,
  [UserRole.VIEWER]: 1,
};

/**
 * Check if user's role meets the minimum required role
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Guard that checks user roles from JWT or API key authentication
 * Works with both JwtAuthGuard and ApiKeyGuard
 */
@Injectable()
export class UserRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      USER_ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // No roles required = allow
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    
    // Get user from JWT auth (jwtUser) or check for API key user
    const jwtUser = request.jwtUser;
    const apiKeyUser = (request as any).apiKeyUser;

    if (!jwtUser && !apiKeyUser) {
      throw new ForbiddenException("Authentication required");
    }

    // Get user role
    let userRole: UserRole | undefined;
    
    if (jwtUser) {
      userRole = jwtUser.role as UserRole;
    } else if (apiKeyUser) {
      // For API keys, we need to look up the user's role
      // This is handled by the API key having scope-based access
      // API key with ADMIN scope = ADMIN role equivalent
      const scopes = apiKeyUser.scopes as string[];
      if (scopes.includes("admin")) {
        userRole = UserRole.ADMIN;
      } else if (scopes.includes("write")) {
        userRole = UserRole.OPERATOR;
      } else {
        userRole = UserRole.VIEWER;
      }
    }

    if (!userRole) {
      throw new ForbiddenException("User role not found");
    }

    // Check if user has any of the required roles (or higher)
    const hasRole = requiredRoles.some((required) => 
      hasMinimumRole(userRole as UserRole, required)
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of roles: ${requiredRoles.join(", ")}`
      );
    }

    return true;
  }
}

/**
 * Permission-based access control
 * Maps permissions to minimum required roles
 */
export enum Permission {
  // Agent permissions
  AGENTS_READ = "agents:read",
  AGENTS_WRITE = "agents:write",
  AGENTS_DELETE = "agents:delete",
  
  // Task permissions
  TASKS_READ = "tasks:read",
  TASKS_WRITE = "tasks:write",
  TASKS_DELETE = "tasks:delete",
  
  // Credit permissions
  CREDITS_READ = "credits:read",
  CREDITS_ADJUST = "credits:adjust",
  
  // User/org management
  USERS_READ = "users:read",
  USERS_MANAGE = "users:manage",
  ORG_SETTINGS = "org:settings",
  
  // API key management
  API_KEYS_READ = "api_keys:read",
  API_KEYS_MANAGE = "api_keys:manage",
}

/**
 * Permission to minimum role mapping
 */
export const PERMISSION_ROLES: Record<Permission, UserRole> = {
  // Viewer can read
  [Permission.AGENTS_READ]: UserRole.VIEWER,
  [Permission.TASKS_READ]: UserRole.VIEWER,
  [Permission.CREDITS_READ]: UserRole.VIEWER,
  [Permission.USERS_READ]: UserRole.VIEWER,
  [Permission.API_KEYS_READ]: UserRole.VIEWER,
  
  // Operator can write
  [Permission.AGENTS_WRITE]: UserRole.OPERATOR,
  [Permission.TASKS_WRITE]: UserRole.OPERATOR,
  [Permission.CREDITS_ADJUST]: UserRole.OPERATOR,
  
  // Admin only
  [Permission.AGENTS_DELETE]: UserRole.ADMIN,
  [Permission.TASKS_DELETE]: UserRole.ADMIN,
  [Permission.USERS_MANAGE]: UserRole.ADMIN,
  [Permission.ORG_SETTINGS]: UserRole.ADMIN,
  [Permission.API_KEYS_MANAGE]: UserRole.ADMIN,
};

export const PERMISSIONS_KEY = "permissions";

/**
 * Decorator to require specific permissions
 * @example @RequirePermissions(Permission.AGENTS_WRITE)
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Guard that checks permissions based on role
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const jwtUser = request.jwtUser;
    const apiKeyUser = (request as any).apiKeyUser;

    if (!jwtUser && !apiKeyUser) {
      throw new ForbiddenException("Authentication required");
    }

    let userRole: UserRole;
    
    if (jwtUser) {
      userRole = jwtUser.role as UserRole;
    } else if (apiKeyUser) {
      const scopes = apiKeyUser.scopes as string[];
      if (scopes.includes("admin")) {
        userRole = UserRole.ADMIN;
      } else if (scopes.includes("write")) {
        userRole = UserRole.OPERATOR;
      } else {
        userRole = UserRole.VIEWER;
      }
    } else {
      throw new ForbiddenException("User role not found");
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const requiredRole = PERMISSION_ROLES[permission];
      if (!hasMinimumRole(userRole, requiredRole)) {
        throw new ForbiddenException(
          `Missing permission: ${permission} (requires ${requiredRole} or higher)`
        );
      }
    }

    return true;
  }
}
