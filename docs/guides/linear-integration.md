# Linear.app Integration

Two-way sync between Linear issues and OpenSpawn tasks.

## Overview

The Linear integration provides bidirectional synchronization:

- **Linear → OpenSpawn:** Webhook-driven. Linear issues, status changes, comments, and assignee changes are automatically reflected in OpenSpawn tasks.
- **OpenSpawn → Linear:** Push-based. Task creation, status transitions, comments, and assignments are pushed to Linear when sync is enabled.

## Setup

### 1. Get a Linear API Key

1. Go to **Linear → Settings → API → Personal API keys**
2. Create a new key with appropriate scopes (issues, comments, teams)
3. Copy the key

### 2. Find Your Team ID

Your team ID is visible in the Linear URL when viewing a team: `https://linear.app/<workspace>/team/<team-id>/...`

Or use the Linear API:
```graphql
query { teams { nodes { id name } } }
```

### 3. Connect via CLI

```bash
openspawn linear connect --api-key lin_api_xxxxx --team <team-id>
```

Options:
| Flag | Description | Default |
|------|-------------|---------|
| `--api-key` | Linear API key (required) | — |
| `--team` | Linear team ID (required) | — |
| `--name` | Connection name | `"Linear"` |
| `--direction` | Sync direction | `"both"` |
| `--webhook-secret` | Custom webhook secret | Auto-generated |

### 4. Configure the Webhook in Linear

After connecting, you'll receive a webhook URL and secret. Configure it in Linear:

1. Go to **Linear → Settings → API → Webhooks**
2. Click **New webhook**
3. Set the URL to: `https://<your-api>/integrations/linear/webhook`
4. Set the secret to the value shown by the CLI
5. Enable events: **Issues**, **Comments**
6. Save

## Sync Modes

| Mode | Description |
|------|-------------|
| `both` | Full two-way sync (default) |
| `from-linear` | Linear → OpenSpawn only (read-only mirror) |
| `to-linear` | OpenSpawn → Linear only (push changes out) |

Change the sync direction:
```bash
openspawn linear sync --connection <id> --direction from-linear
```

## Status Mapping

### OpenSpawn → Linear

| OpenSpawn Status | Linear State |
|-----------------|--------------|
| `backlog` | Backlog |
| `todo` | Todo |
| `pending` | Todo |
| `assigned` | Todo |
| `in_progress` | In Progress |
| `review` | In Review |
| `done` | Done |
| `cancelled` | Cancelled |
| `blocked` | Blocked |
| `rejected` | Cancelled |

### Linear → OpenSpawn

| Linear State | OpenSpawn Status |
|-------------|-----------------|
| Backlog | `backlog` |
| Triage | `backlog` |
| Unstarted | `todo` |
| Todo | `todo` |
| Started | `in_progress` |
| In Progress | `in_progress` |
| In Review | `review` |
| Done | `done` |
| Completed | `done` |
| Cancelled / Canceled | `cancelled` |
| Blocked | `blocked` |

### Custom Status Mapping

Override the default mapping via `sync_config.status_map` on your connection:

```json
{
  "sync_config": {
    "status_map": {
      "in_progress": "Working On It",
      "review": "QA"
    }
  }
}
```

## Event Handling

### Linear → OpenSpawn (Webhooks)

| Linear Event | OpenSpawn Action |
|-------------|-----------------|
| `Issue.created` | Create task |
| `Issue.updated` | Update task (title, description, status, assignee) |
| `Issue.removed` | Cancel task (soft cancel, not delete) |
| `Comment.created` | Add comment to linked task |

### OpenSpawn → Linear (Push)

| OpenSpawn Action | Linear Action |
|-----------------|--------------|
| Task created | Create issue (if sync enabled) |
| Task status changed | Update issue state |
| Task commented | Add comment to issue |
| Task assigned | Update issue assignee |

## Idempotency

All sync operations are idempotent:

- Re-processing the same webhook payload is safe — duplicate creates are detected via integration links
- Comments are tracked by their Linear ID to prevent duplicates
- Status updates only apply if the value actually changed

## Integration Links

The system tracks all Linear ↔ OpenSpawn mappings in the `integration_links` table:

- `source_type: linear_issue` → `target_type: task`
- `source_type: linear_comment` → `target_type: task_comment`
- `source_type: linear_user` → `target_type: agent` (for assignee mapping)

View links for a connection:
```
GET /integrations/linear/connections/{id}/links
```

## User / Agent Mapping

To map Linear users to OpenSpawn agents:

1. Set `linear_user_id` in the agent's metadata:
   ```json
   { "metadata": { "linear_user_id": "lin_user_xxx" } }
   ```

2. Or create an integration link:
   ```
   source_type: linear_user
   source_id: <linear-user-id>
   target_type: agent
   target_id: <agent-uuid>
   ```

Unmapped users will not trigger assignee changes.

## CLI Reference

```bash
# Connect a team
openspawn linear connect --api-key <key> --team <team-id>

# Check status
openspawn linear status

# Change sync direction
openspawn linear sync --connection <id> --direction from-linear

# Remove connection
openspawn linear disconnect --connection <id> [--force]
```

## Troubleshooting

### Webhooks not received
- Verify the webhook URL is publicly accessible
- Check the webhook secret matches exactly
- Ensure the webhook is enabled in Linear settings
- Check API logs for signature verification failures

### Status not syncing
- Verify your Linear team uses standard state names (Backlog, Todo, In Progress, Done, etc.)
- Custom state names may need a custom `status_map` in `sync_config`
- Check if the connection is enabled: `openspawn linear status`

### Comments duplicated
- Comments from Linear are prefixed with `[Linear]` and skipped on push-back
- Comments from OpenSpawn are prefixed with `[OpenSpawn]` and skipped on webhook processing
- If you see duplicates, check if both directions are enabled when they shouldn't be

### Assignee not syncing
- Ensure the agent has `linear_user_id` in its metadata
- Linear user IDs can be found via the Linear API or webhook payloads

### Connection test fails
- Verify the API key is valid and has appropriate scopes
- Check if the team ID exists and is accessible with the API key
