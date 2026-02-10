# Phase 1: Authentication & Settings Foundation

**Status:** Planning  
**Target:** 4 PRs over ~2 weeks  
**Owner:** Agent Dennis  
**Created:** 2026-02-07

---

## Overview

Before adding more coordination features, we need to secure BikiniBottom properly. This phase establishes:

1. **Human Authentication** — JWT-based auth for dashboard users
2. **API Key Management** — Long-lived keys for external integrations
3. **Role-Based Access Control** — Proper permission enforcement
4. **Settings UI** — Visual configuration for orgs and agents

---

## Current State

### What Exists
- ✅ Agent HMAC authentication (for agent-to-API calls)
- ✅ Nonce replay prevention
- ✅ Timestamp validation (±5 min window)
- ✅ RolesGuard skeleton (not enforced)
- ✅ Multi-tenant org_id scoping in schema

### What's Missing
- ❌ Human/admin authentication (dashboard is open)
- ❌ JWT issuance and validation
- ❌ API key CRUD
- ❌ Role enforcement on endpoints
- ❌ Settings UI
- ❌ Org-scoped queries (middleware)

---

## PR Breakdown

### PR #8: Human Authentication (JWT)

**Goal:** Secure the dashboard with login/logout and JWT sessions.

#### Schema Changes

```sql
-- New table: users (human operators)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',  -- admin, operator, viewer
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, email)
);

-- New table: refresh_tokens
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,  -- sha256 of token
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(token_hash)
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

#### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | Email/password → access + refresh tokens |
| POST | `/auth/refresh` | Refresh token | Exchange refresh → new access token |
| POST | `/auth/logout` | Access token | Revoke refresh token |
| GET | `/auth/me` | Access token | Get current user info |
| POST | `/auth/register` | Admin | Create new user (admin only) |
| PATCH | `/auth/password` | Access token | Change own password |

#### JWT Structure

```typescript
interface AccessTokenPayload {
  sub: string;      // user.id
  org: string;      // org.id
  role: string;     // admin | operator | viewer
  type: 'access';
  iat: number;
  exp: number;      // 15 minutes
}

interface RefreshTokenPayload {
  sub: string;      // user.id
  jti: string;      // refresh_token.id
  type: 'refresh';
  iat: number;
  exp: number;      // 7 days
}
```

#### Dashboard Changes

- Add `/login` page with email/password form
- Add auth context provider with token storage
- Protected routes redirect to login
- Add logout button to header
- Display current user name/email

#### Files to Create/Modify

```
apps/api/src/auth/
├── auth.controller.ts      # Login/logout/refresh endpoints
├── auth.service.ts         # Add JWT methods
├── jwt.strategy.ts         # Passport JWT strategy
├── jwt-auth.guard.ts       # JWT validation guard
├── decorators/
│   └── current-user.ts     # @CurrentUser() decorator

libs/database/src/entities/
├── user.entity.ts          # New
├── refresh-token.entity.ts # New

apps/dashboard/src/
├── contexts/auth-context.tsx
├── pages/login.tsx
├── components/protected-route.tsx
```

#### Acceptance Criteria

- [ ] User can log in with email/password
- [ ] Access token expires in 15 minutes
- [ ] Refresh token auto-renews access token
- [ ] Logout revokes refresh token
- [ ] Dashboard shows login page when unauthenticated
- [ ] GraphQL queries require valid JWT
- [ ] Tests for login/logout/refresh flows

---

### PR #9: API Key Management

**Goal:** Allow external systems to authenticate with long-lived API keys.

#### Schema Changes

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),  -- who created it
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(8) NOT NULL,    -- First 8 chars for identification
  key_hash VARCHAR(255) NOT NULL,    -- sha256 of full key
  scopes JSONB NOT NULL DEFAULT '["read"]',  -- read, write, admin
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,            -- NULL = never expires
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(key_hash)
);
CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
```

#### API Key Format

```
osk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
│   │    └── 32 random hex chars
│   └── environment (live/test)
└── prefix (openspawn key)
```

#### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api-keys` | JWT (admin/operator) | List keys for org |
| POST | `/api-keys` | JWT (admin/operator) | Create new key |
| DELETE | `/api-keys/:id` | JWT (admin/operator) | Revoke key |

#### Auth Flow

1. Client sends `Authorization: Bearer osk_live_xxx...`
2. Guard extracts prefix, looks up key by prefix
3. Hash full key, compare to stored hash
4. Attach org_id + scopes to request context

#### Files to Create/Modify

```
apps/api/src/api-keys/
├── api-keys.controller.ts
├── api-keys.service.ts
├── api-keys.module.ts
├── api-key.guard.ts

libs/database/src/entities/
├── api-key.entity.ts

apps/dashboard/src/
├── pages/settings/api-keys.tsx
├── components/api-key-form.tsx
```

#### Acceptance Criteria

- [ ] Admin/operator can create API keys
- [ ] Key shown only once on creation
- [ ] Keys can be revoked
- [ ] API key auth works on all endpoints
- [ ] Scopes limit what keys can do
- [ ] Dashboard shows API key management UI

---

### PR #10: Role-Based Access Control

**Goal:** Enforce permissions across all endpoints.

#### Roles & Permissions

| Role | Dashboard | Create Tasks | Manage Agents | Adjust Credits | Manage Users | Settings |
|------|-----------|--------------|---------------|----------------|--------------|----------|
| viewer | Read-only | ❌ | ❌ | ❌ | ❌ | ❌ |
| operator | Full | ✅ | ✅ | View only | ❌ | ❌ |
| admin | Full | ✅ | ✅ | ✅ | ✅ | ✅ |

#### Implementation

```typescript
// Decorator usage
@Roles('admin', 'operator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('tasks')
createTask() { ... }

// Permission checks
@RequirePermission('credits:adjust')
adjustCredits() { ... }
```

#### GraphQL Authorization

```typescript
// Field-level auth
@ResolveField()
@RequireRole('admin')
hmacSecretEnc(): string { ... }

// Query-level auth
@Query()
@RequireRole('operator', 'admin')
agents(): Agent[] { ... }
```

#### Org Scoping Middleware

```typescript
// Automatically scope all queries to user's org
@Injectable()
export class OrgScopeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      // Inject org_id into all repository queries
      req.orgId = req.user.org;
    }
    next();
  }
}
```

#### Files to Modify

```
apps/api/src/auth/
├── roles.guard.ts          # Enforce role checks
├── permissions.decorator.ts
├── org-scope.middleware.ts

apps/api/src/graphql/resolvers/
├── *.resolver.ts           # Add auth decorators
```

#### Acceptance Criteria

- [ ] Viewers cannot modify anything
- [ ] Operators can manage agents/tasks
- [ ] Only admins can adjust credits
- [ ] Only admins can manage users
- [ ] All queries scoped to user's org
- [ ] Tests for role-based access

---

### PR #11: Settings UI

**Goal:** Visual configuration for org and agent settings.

#### Settings Pages

1. **Organization Settings** (`/settings/org`)
   - Org name, slug
   - Default model
   - Credit rate table
   - Budget period (weekly/monthly)

2. **Agent Settings** (`/settings/agents/:id`)
   - Model selection
   - Budget limit
   - Management fee %
   - Capabilities

3. **User Management** (`/settings/users`) — Admin only
   - Invite users
   - Change roles
   - Revoke access

4. **API Keys** (`/settings/api-keys`)
   - List/create/revoke (from PR #9)

#### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/settings/org` | JWT | Get org settings |
| PATCH | `/settings/org` | JWT (admin) | Update org settings |
| GET | `/settings/credit-rates` | JWT | Get rate configs |
| PATCH | `/settings/credit-rates/:id` | JWT (admin) | Update rate |
| GET | `/users` | JWT (admin) | List org users |
| POST | `/users/invite` | JWT (admin) | Send invite email |
| PATCH | `/users/:id/role` | JWT (admin) | Change user role |
| DELETE | `/users/:id` | JWT (admin) | Remove user |

#### Dashboard Components

```
apps/dashboard/src/
├── pages/settings/
│   ├── index.tsx           # Settings layout with tabs
│   ├── organization.tsx    # Org settings form
│   ├── credit-rates.tsx    # Rate table editor
│   ├── users.tsx           # User management
│   └── api-keys.tsx        # From PR #9
├── components/
│   ├── settings-form.tsx   # Reusable form component
│   └── rate-table.tsx      # Editable rate table
```

#### Acceptance Criteria

- [ ] Settings accessible from sidebar
- [ ] Org name/settings editable by admin
- [ ] Credit rates configurable
- [ ] User list shows all org members
- [ ] Can invite new users (email)
- [ ] Can change user roles
- [ ] Responsive layout

---

## Technical Decisions

### JWT vs Session Cookies
**Decision:** JWT in localStorage + httpOnly refresh cookie

- Access token in memory/localStorage (short-lived, 15min)
- Refresh token in httpOnly cookie (7 days)
- Best balance of security and DX

### Password Hashing
**Decision:** bcrypt with cost factor 12

- Industry standard
- Cost factor 12 = ~250ms per hash (good balance)

### API Key Security
**Decision:** Store only hash, show key once

- Key generated: `osk_live_` + 32 random hex
- Store: sha256(key), prefix for lookup
- Show full key only on creation

### Org Scoping
**Decision:** Middleware injects org_id

- All queries automatically filtered
- Prevents cross-org data access
- TypeORM subscriber for extra safety

---

## Migration Path

### Existing Deployments

1. Run migration to create users table
2. Create first admin user via CLI: `pnpm seed:admin`
3. Existing agent auth continues to work
4. Dashboard requires login after upgrade

### Demo Mode

- Demo mode bypasses auth (mock user context)
- `?demo=true` sets mock admin user
- No changes to demo simulation logic

---

## Timeline Estimate

| PR | Description | Estimate |
|----|-------------|----------|
| #8 | Human Authentication (JWT) | 3-4 days |
| #9 | API Key Management | 2 days |
| #10 | Role-Based Access Control | 2-3 days |
| #11 | Settings UI | 3-4 days |

**Total:** ~10-13 days

---

## Dependencies

- `@nestjs/jwt` — JWT utilities
- `@nestjs/passport` — Auth strategies
- `bcrypt` — Password hashing
- `passport-jwt` — JWT passport strategy

---

## Open Questions

1. **OAuth/SSO?** — Defer to Phase 2? Or include Google OAuth in PR #8?
2. **Email service?** — Need for password reset + invites. Use Resend? Postmark?
3. **2FA?** — Defer to later? Or include TOTP in PR #8?

---

## Success Metrics

- [ ] Dashboard cannot be accessed without login
- [ ] API calls require valid JWT or API key
- [ ] Different roles have different capabilities
- [ ] Settings changes persist and take effect
- [ ] No regression in agent HMAC auth
- [ ] Demo mode still works
