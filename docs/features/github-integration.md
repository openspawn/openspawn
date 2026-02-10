# GitHub Bidirectional Sync

## Overview

The GitHub integration enables bidirectional synchronization between GitHub (issues, PRs, comments, check suites) and OpenSpawn tasks/messages. When activity happens on GitHub, OpenSpawn automatically creates and updates tasks. When tasks change in OpenSpawn, GitHub issues are updated accordingly.

## Architecture

```
GitHub ──webhook──► GitHubWebhookController ──► GitHubService ──► IntegrationLinkService
                                                     │                      │
                                                     ▼                      ▼
                                              GitHubConnection        IntegrationLink
                                                (DB entity)            (DB entity)

OpenSpawn Events ──@OnEvent──► GitHubService.syncOutbound ──► GitHub API
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| `GitHubConnection` entity | `libs/database/src/entities/github-connection.entity.ts` | Stores GitHub App installation config |
| `IntegrationLink` entity | `libs/database/src/entities/integration-link.entity.ts` | Polymorphic link between external and internal objects |
| `GitHubService` | `apps/api/src/github/github.service.ts` | Core business logic, inbound/outbound sync |
| `GitHubWebhookController` | `apps/api/src/github/github-webhook.controller.ts` | Receives and verifies GitHub webhooks |
| `GitHubController` | `apps/api/src/github/github.controller.ts` | CRUD for GitHub connections |
| `IntegrationLinkService` | `apps/api/src/github/integration-link.service.ts` | Manages integration links |
| `IntegrationProvider` | `apps/api/src/github/interfaces/integration-provider.interface.ts` | Abstract interface for future providers |

## Setup

### 1. Create a GitHub App

1. Go to your GitHub organization → Settings → Developer settings → GitHub Apps
2. Create a new GitHub App with these permissions:
   - **Issues**: Read & Write
   - **Pull Requests**: Read & Write  
   - **Checks**: Read
3. Subscribe to events: `issues`, `issue_comment`, `pull_request`, `check_suite`
4. Set the webhook URL to: `https://your-domain.com/api/integrations/github/webhook`

### 2. Create a Connection in OpenSpawn

Navigate to **Settings → GitHub** in the dashboard, or use the API:

```bash
POST /api/integrations/github/connections
{
  "name": "my-org/my-repo",
  "installationId": "12345678",
  "accessToken": "ghs_xxxxxxxxxxxx",
  "repoFilter": ["my-org/my-repo"]
}
```

The response includes a `webhookSecret` — configure this in your GitHub App settings.

### 3. Configure Webhook Secret

Copy the `webhookSecret` from the connection and paste it into your GitHub App's webhook secret field. This enables HMAC-SHA256 signature verification.

## Inbound Events (GitHub → OpenSpawn)

| GitHub Event | Action | OpenSpawn Result |
|-------------|--------|-----------------|
| `issues` (opened/labeled with `agent-work`) | Create task | New task linked to issue |
| `issues` (closed) | Update linked task | Task status updated |
| `issue_comment` (created) | Create message | Comment linked to task message |
| `pull_request` (opened) | Create review task | New review task linked to PR |
| `check_suite` (completed, failure) | Create fix task | New task for CI fix |

### Label-Based Filtering

By default, only issues labeled with `agent-work` trigger task creation. This is configurable per connection via `syncConfig.inbound.requiredLabel`.

## Outbound Events (OpenSpawn → GitHub)

| OpenSpawn Event | GitHub Action |
|----------------|---------------|
| `task.completed` | Close linked GitHub issue |
| `task.status_changed` | Update labels, post status comment |
| `message.created` | Post comment on linked issue |

Outbound sync uses `@nestjs/event-emitter` — the `GitHubService` listens for task and message events automatically.

## Security

### Webhook Signature Verification

All inbound webhooks are verified using HMAC-SHA256:

1. GitHub sends `X-Hub-Signature-256` header
2. Controller extracts the raw body and computes HMAC with stored secret
3. Uses `crypto.timingSafeEqual()` to prevent timing attacks
4. Rejects requests with invalid or missing signatures

### Access Token Storage

GitHub access tokens are stored in the `access_token` column. In production, these should be encrypted at rest using your database encryption or application-level encryption.

## GraphQL API

```graphql
# List connections
query {
  githubConnections(orgId: "org-id") {
    id
    name
    installationId
    enabled
    syncConfig { inbound { createTaskOnIssue } outbound { closeIssueOnComplete } }
  }
}

# Create connection
mutation {
  createGitHubConnection(orgId: "org-id", input: {
    name: "my-org/repo"
    installationId: "12345"
    createTaskOnIssue: true
    closeIssueOnComplete: true
  }) { id webhookSecret }
}

# List integration links
query {
  integrationLinks(orgId: "org-id", provider: "github") {
    id sourceType sourceId targetType targetId metadata
  }
}
```

## Provider Abstraction

The `IntegrationProvider` interface (`interfaces/integration-provider.interface.ts`) defines a contract that both GitHub and future providers (e.g., Linear #134) implement:

```typescript
interface IntegrationProvider {
  readonly providerName: string;
  handleWebhookEvent(orgId: string, event: string, payload: unknown): Promise<void>;
  syncOutbound(orgId: string, event: string, data: Record<string, unknown>): Promise<void>;
  testConnection(connectionId: string): Promise<{ ok: boolean; message: string }>;
}
```

The `IntegrationLink` entity uses a `provider` column to support multiple providers sharing the same linking infrastructure.

## Database Schema

### `github_connections`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `org_id` | UUID (FK) | Organization reference |
| `installation_id` | BIGINT (unique) | GitHub App installation ID |
| `name` | VARCHAR(255) | Display name |
| `webhook_secret` | VARCHAR(255) | HMAC secret for webhook verification |
| `access_token` | VARCHAR(500) | GitHub access token (nullable) |
| `repo_filter` | JSONB | Array of repo full names to filter |
| `sync_config` | JSONB | Inbound/outbound sync settings |
| `enabled` | BOOLEAN | Whether sync is active |

### `integration_links`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `org_id` | UUID (FK) | Organization reference |
| `provider` | VARCHAR(50) | Provider name (github, linear, etc.) |
| `source_type` | VARCHAR(50) | External type (github_issue, github_pr, etc.) |
| `source_id` | VARCHAR(255) | External ID |
| `target_type` | VARCHAR(50) | Internal type (task, message) |
| `target_id` | UUID | Internal entity ID |
| `metadata` | JSONB | Additional context (title, URL, etc.) |
