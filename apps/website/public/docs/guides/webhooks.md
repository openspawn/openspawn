---
source: https://openspawn.ai/docs/guides/webhooks
generated: 2026-03-14
---

OpenSpawn has two complementary webhook directions:

| Direction             | What it does                                            |
| --------------------- | ------------------------------------------------------- |
| **Inbound webhooks**  | External services POST events → OpenSpawn creates tasks |
| **Outbound webhooks** | OpenSpawn POSTs events → your server reacts             |

This guide covers both, plus the built-in Discord and GitHub integrations that ship on top of this infrastructure.

---

## 1. What are OpenSpawn Webhooks?

### Inbound webhooks — push work into OpenSpawn

An inbound webhook is a **secure URL that accepts task creation requests**. You create a _webhook key_, which gives you:

- A unique key string (format: `iwk_<64 hex chars>`) used in the URL path
- A shared secret used to sign (and optionally verify) payloads
- Optional defaults: which agent to assign to, default priority, default tags

Any system that can send an HTTP POST — GitHub Actions, Zapier, your own code, a Discord bot — can push work directly into your OpenSpawn task board.

### Outbound webhooks — OpenSpawn calls your server

An outbound webhook is a **URL you register that OpenSpawn calls** whenever something happens. Two modes:

- **Post-hooks** (`hookType: "post"`) — fire-and-forget after an action completes
- **Pre-hooks** (`hookType: "pre"`) — fire before an action; if `canBlock: true` and your server returns `{ allow: false }`, OpenSpawn will block the action

Pre-hooks time out after `timeoutMs` (1,000–30,000 ms; default 5,000 ms). On timeout or HTTP error, OpenSpawn **fails open** — the action proceeds. After 10 consecutive failures, the hook is automatically disabled.

---

## 2. Creating Inbound Webhook Keys

### Endpoint

```
POST /api/v1/inbound-webhooks
Authorization: Bearer <jwt>
```

### Request body

```json
{
  "name": "GitHub Actions CI",
  "defaultAgentId": "ab985264-ec8f-49de-80d9-ad357e119be9",
  "defaultPriority": "high",
  "defaultTags": ["ci", "automated"]
}
```

| Field             | Type                                    | Required | Description                                                |
| ----------------- | --------------------------------------- | -------- | ---------------------------------------------------------- |
| `name`            | string (≤255)                           | ✅       | Human-readable label for this key                          |
| `defaultAgentId`  | UUID                                    | —        | Agent to assign tasks to when not specified in the payload |
| `defaultPriority` | `urgent` \| `high` \| `normal` \| `low` | —        | Fallback priority                                          |
| `defaultTags`     | string[]                                | —        | Tags always applied to tasks from this key                 |

### curl example

```bash
curl -X POST https://api.openspawn.ai/api/v1/inbound-webhooks \
  -H "Authorization: Bearer $OPENSPAWN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "GitHub Actions CI",
    "defaultPriority": "high",
    "defaultTags": ["ci", "automated"]
  }'
```

### Response

```json
{
  "id": "c1a2b3d4-e5f6-7890-abcd-ef1234567890",
  "orgId": "f3a3fc0c-29e6-4d0d-b489-3c065d9230b6",
  "name": "GitHub Actions CI",
  "key": "iwk_4f9e2a1b3c8d7e6f5a4b9c2d1e8f3a7b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
  "secret": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
  "defaultAgentId": null,
  "defaultPriority": "high",
  "defaultTags": ["ci", "automated"],
  "enabled": true,
  "lastUsedAt": null,
  "createdAt": "2026-03-03T18:00:00.000Z",
  "updatedAt": "2026-03-03T18:00:00.000Z"
}
```

> ⚠️ **Save the `secret` now.** It is stored but not re-displayed in a masked form. If you lose it, rotate the key.

### Other management endpoints

```bash
# List all keys
GET /api/v1/inbound-webhooks

# Get one key
GET /api/v1/inbound-webhooks/:id

# Update name/defaults/enabled
PATCH /api/v1/inbound-webhooks/:id

# Rotate key + secret (generates new values)
POST /api/v1/inbound-webhooks/:id/rotate

# Delete permanently
DELETE /api/v1/inbound-webhooks/:id
```

All management endpoints require a JWT (`Authorization: Bearer <token>`).

---

## 3. Sending Events to OpenSpawn

### Single task

```
POST /api/v1/webhooks/inbound/:key
Content-Type: application/json
```

No authentication required — the key in the URL path authenticates the request. Optionally include an HMAC signature (see §4).

### Request body

```json
{
  "title": "Build failed on main branch",
  "description": "Workflow: CI / Job: test-unit\n\nExit code 1 — 3 tests failed.",
  "priority": "urgent",
  "tags": ["build-failure", "main"],
  "assigneeId": "ab985264-ec8f-49de-80d9-ad357e119be9",
  "metadata": {
    "repo": "openspawn/openspawn",
    "runId": "7654321",
    "commitSha": "abc1234"
  }
}
```

| Field         | Type                                    | Required | Description                                   |
| ------------- | --------------------------------------- | -------- | --------------------------------------------- |
| `title`       | string (≤500)                           | ✅       | Task title                                    |
| `description` | string                                  | —        | Full details (markdown supported)             |
| `priority`    | `urgent` \| `high` \| `normal` \| `low` | —        | Overrides key default                         |
| `tags`        | string[]                                | —        | Merged with key's `defaultTags`               |
| `assigneeId`  | UUID                                    | —        | Overrides key's `defaultAgentId`              |
| `metadata`    | object                                  | —        | Arbitrary key/value data attached to the task |

### curl example

```bash
curl -X POST \
  "https://api.openspawn.ai/api/v1/webhooks/inbound/iwk_4f9e2a1b..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build failed on main branch",
    "description": "3 unit tests failed",
    "priority": "urgent",
    "tags": ["build-failure"],
    "metadata": { "runId": "7654321" }
  }'
```

### Batch task creation

Send multiple tasks in a single request:

```
POST /api/v1/webhooks/inbound/:key/batch
Content-Type: application/json
```

```json
{
  "tasks": [
    {
      "title": "Update dependency: lodash",
      "priority": "low",
      "tags": ["dependency-update"]
    },
    {
      "title": "Update dependency: axios",
      "priority": "low",
      "tags": ["dependency-update"]
    }
  ]
}
```

```bash
curl -X POST \
  "https://api.openspawn.ai/api/v1/webhooks/inbound/iwk_4f9e2a1b.../batch" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      { "title": "Update lodash", "priority": "low" },
      { "title": "Update axios", "priority": "low" }
    ]
  }'
```

Returns an array of created `Task` objects.

---

## 4. Webhook Payload Signing (HMAC Verification)

### Inbound webhooks — signing requests to OpenSpawn

If you include the `x-openspawn-signature` header, OpenSpawn will verify it. The signature is a **raw HMAC-SHA256 hex digest** (no prefix) of the raw request body using the webhook key's `secret`.

```bash
# Shell example (signing before sending)
SECRET="a1b2c3d4..."
BODY='{"title":"Deploy failed","priority":"urgent"}'

SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

curl -X POST \
  "https://api.openspawn.ai/api/v1/webhooks/inbound/iwk_4f9e2a1b..." \
  -H "Content-Type: application/json" \
  -H "x-openspawn-signature: $SIGNATURE" \
  -d "$BODY"
```

Signing is **optional** by default. If you provide the header and it doesn't match, the request is rejected with `401 Unauthorized`.

### Computing the signature — Node.js

```javascript
function signWebhookPayload(secret, bodyString) {
  return crypto.createHmac("sha256", secret).update(bodyString).digest("hex");
}

// Usage
const body = JSON.stringify({ title: "Deploy failed", priority: "urgent" });
const signature = signWebhookPayload(process.env.WEBHOOK_SECRET, body);

await fetch(`https://api.openspawn.ai/api/v1/webhooks/inbound/${key}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-openspawn-signature": signature,
  },
  body,
});
```

### Outbound webhooks — verifying OpenSpawn's signature

When OpenSpawn calls your server it sends:

| Header                     | Value                                   |
| -------------------------- | --------------------------------------- |
| `X-BikiniBottom-Signature` | `sha256=<hmac-sha256-hex>`              |
| `X-BikiniBottom-Event`     | Event type string (e.g. `task.created`) |
| `X-BikiniBottom-Delivery`  | Unique delivery UUID                    |
| `X-BikiniBottom-Hook-Type` | `pre` or `post`                         |

Verify in Node.js:

```javascript
function verifyOutboundSignature(secret, rawBody, signatureHeader) {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}

// Express example
app.post("/openspawn-hook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-bikinibbottom-signature"];
  if (!verifyOutboundSignature(process.env.HOOK_SECRET, req.body, sig)) {
    return res.status(401).send("Invalid signature");
  }
  const payload = JSON.parse(req.body.toString());
  // handle payload.event, payload.data ...
  res.sendStatus(200);
});
```

---

## 5. Registering Outbound Webhooks

```
POST /api/v1/webhooks
Authorization: Bearer <jwt>
```

```json
{
  "name": "Notify Slack on task creation",
  "url": "https://hooks.slack.com/services/T.../B.../...",
  "secret": "my-shared-secret",
  "events": ["task.created", "task.updated"],
  "hookType": "post"
}
```

| Field       | Type                 | Required | Description                                                             |
| ----------- | -------------------- | -------- | ----------------------------------------------------------------------- |
| `name`      | string               | ✅       | Label                                                                   |
| `url`       | string (https)       | ✅       | Must resolve to a public IP — localhost and RFC-1918 ranges are blocked |
| `secret`    | string               | —        | If set, OpenSpawn signs requests with `X-BikiniBottom-Signature`        |
| `events`    | string[]             | ✅       | Event types to subscribe to; `["*"]` subscribes to all                  |
| `hookType`  | `pre` \| `post`      | —        | Default: `post`                                                         |
| `canBlock`  | boolean              | —        | Pre-hooks only: whether a `{ allow: false }` response blocks the action |
| `timeoutMs` | integer (1000–30000) | —        | Request timeout; default 5000                                           |

### curl example

```bash
curl -X POST https://api.openspawn.ai/api/v1/webhooks \
  -H "Authorization: Bearer $OPENSPAWN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack notifications",
    "url": "https://hooks.slack.com/services/T.../B.../..",
    "secret": "my-shared-secret",
    "events": ["task.created", "task.done"],
    "hookType": "post"
  }'
```

### Test a webhook

```bash
curl -X POST \
  "https://api.openspawn.ai/api/v1/webhooks/<id>/test" \
  -H "Authorization: Bearer $OPENSPAWN_TOKEN"
```

OpenSpawn sends a `test` event with `{ message: "This is a test webhook from OpenSpawn" }` to your URL.

### Outbound payload shape

```json
{
  "event": "task.created",
  "timestamp": "2026-03-03T18:00:00.000Z",
  "data": {
    "id": "...",
    "actorId": "...",
    "entityType": "task",
    "entityId": "...",
    "severity": "info",
    "data": { ... },
    "createdAt": "..."
  }
}
```

---

## 6. Discord Integration

OpenSpawn ships a purpose-built Discord webhook endpoint that translates Discord messages into tasks. This is the integration Dennis merged — it allows agents chatting in Discord to drive the task board without any code.

### Endpoint

```
POST /api/v1/webhooks/discord
```

This endpoint is **public** (no authentication) and expects a Discord message payload. Wire it up via a Discord bot or a forwarding relay.

### Message patterns recognized

| Pattern                                                         | Action                   |
| --------------------------------------------------------------- | ------------------------ |
| Message contains `✅ Task: <title>`                             | Creates a new task       |
| Message contains `Created task: <title>`                        | Creates a new task       |
| Message contains `Task created: <title>`                        | Creates a new task       |
| Message contains `Completed: <hint>` + `complete/finished/done` | Marks matching task done |

Priority keywords are also parsed from the full message body:

| Keyword                      | Priority |
| ---------------------------- | -------- |
| `critical`, `urgent`, `asap` | `urgent` |
| `high priority`, `important` | `high`   |
| `low priority`               | `low`    |
| _(none)_                     | `normal` |

### Sending a Discord message via curl (simulating the Discord payload)

```bash
curl -X POST https://api.openspawn.ai/api/v1/webhooks/discord \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1234567890123456789",
    "channel_id": "9876543210987654321",
    "author": {
      "id": "1476208320607027220",
      "username": "Dennis",
      "discriminator": "0001"
    },
    "content": "✅ Task: Fix the login page broken layout — this is critical",
    "timestamp": "2026-03-03T18:00:00.000Z"
  }'
```

This creates a task titled **"Fix the login page broken layout"** with priority `urgent`, authored by the mapped agent.

### Discord user → agent mapping

The Discord integration maps Discord user IDs to internal OpenSpawn agent IDs. This is currently configured in the controller source. To add or change the mapping, update `DISCORD_AGENT_MAP` in `apps/api/src/webhooks/discord-webhook.controller.ts`.

Bot messages are ignored unless the bot's Discord ID is in the map.

### Setting up the Discord bot

1. Create a Discord bot with **Message Content Intent** enabled
2. Add a message listener that forwards new messages to `POST /api/v1/webhooks/discord`
3. Ensure the payload matches the `DiscordMessage` shape (id, channel_id, author, content, timestamp)

A minimal Node.js forwarder:

```javascript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("messageCreate", async (message) => {
  await fetch("https://api.openspawn.ai/api/v1/webhooks/discord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: message.id,
      channel_id: message.channelId,
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator,
        bot: message.author.bot,
      },
      content: message.content,
      timestamp: message.createdAt.toISOString(),
    }),
  });
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

---

## 7. GitHub Integration

The GitHub integration is a first-class webhook endpoint that creates and updates OpenSpawn tasks from GitHub issues and pull requests.

### Endpoint

```
POST /api/v1/integrations/github/webhook
```

This endpoint is **public**. GitHub sends all events here. Signature verification is required — GitHub always sends `X-Hub-Signature-256`.

### Required headers (sent automatically by GitHub)

| Header                | Description                                                     |
| --------------------- | --------------------------------------------------------------- |
| `X-Hub-Signature-256` | `sha256=<hmac>` — HMAC of the payload using your webhook secret |
| `X-GitHub-Event`      | Event type (e.g. `issues`, `pull_request`)                      |
| `X-GitHub-Delivery`   | Unique delivery UUID                                            |

### Events handled

| GitHub event                  | What OpenSpawn does                        |
| ----------------------------- | ------------------------------------------ |
| `issues` (opened/closed/etc.) | Creates or updates a task                  |
| `issue_comment`               | Adds a comment or updates task description |
| `pull_request`                | Creates or updates a task                  |
| `check_suite`                 | Updates task status based on CI result     |

### Setting up in GitHub

1. Go to your repository → **Settings → Webhooks → Add webhook**
2. **Payload URL:** `https://api.openspawn.ai/api/v1/integrations/github/webhook`
3. **Content type:** `application/json`
4. **Secret:** Your webhook secret (must match the secret stored in the GitHub connection record)
5. **Events:** Select _Issues_, _Pull requests_, _Check suites_ (or "Send me everything")

The GitHub connection must exist in OpenSpawn (via the GitHub integration setup) with a matching `installationId` derived from the payload's `installation.id` or `repository.owner.id`.

### Testing via curl

```bash
# Simulate a GitHub issue opened event
curl -X POST https://api.openspawn.ai/api/v1/integrations/github/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issues" \
  -H "X-GitHub-Delivery: $(uuidgen)" \
  -H "X-Hub-Signature-256: sha256=<computed-signature>" \
  -d '{
    "action": "opened",
    "issue": {
      "number": 42,
      "title": "Login page is broken on mobile",
      "body": "Reproducible on iOS Safari 17.",
      "state": "open",
      "user": { "login": "reporter" }
    },
    "installation": { "id": 12345678 },
    "repository": { "full_name": "myorg/myrepo" }
  }'
```

---

## 8. Building Custom Integrations

Any system that speaks HTTP can push work into OpenSpawn. Common patterns:

### GitHub Actions — create a task on build failure

```yaml
# .github/workflows/ci.yml
- name: Notify OpenSpawn on failure
  if: failure()
  run: |
    BODY=$(jq -n \
      --arg title "Build failed: ${{ github.workflow }} on ${{ github.ref_name }}" \
      --arg desc "Run: ${{ github.run_id }}\nCommit: ${{ github.sha }}" \
      '{title: $title, description: $desc, priority: "urgent", tags: ["ci", "build-failure"]}')

    SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "${{ secrets.OPENSPAWN_WEBHOOK_SECRET }}" | awk '{print $2}')

    curl -X POST "${{ secrets.OPENSPAWN_WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -H "x-openspawn-signature: $SIGNATURE" \
      -d "$BODY"
```

### Zapier / Make (no-code)

1. Add an HTTP action step
2. Method: **POST**
3. URL: `https://api.openspawn.ai/api/v1/webhooks/inbound/<your-key>`
4. Body (JSON):
   ```json
   {
     "title": "{{trigger.subject}}",
     "description": "{{trigger.body}}",
     "priority": "normal"
   }
   ```
5. No `Authorization` header needed — the key in the URL is the credential

### Pre-hook: approvals / policy enforcement

Register a pre-hook to intercept task state transitions:

```bash
curl -X POST https://api.openspawn.ai/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Compliance check before task close",
    "url": "https://yourserver.example.com/hooks/compliance",
    "secret": "super-secret",
    "events": ["task.close"],
    "hookType": "pre",
    "canBlock": true,
    "timeoutMs": 3000
  }'
```

Your server must respond within `timeoutMs` with:

```json
{ "allow": true }
// or
{ "allow": false, "reason": "Missing required sign-off from compliance team" }
```

If your server times out or returns an error, OpenSpawn **fails open** and the action proceeds.

---

## 9. Troubleshooting

### `404 Not Found` — "Webhook key not found or disabled"

- The key in the URL path is wrong or has been rotated. Double-check the `iwk_...` value.
- The key may be disabled. Re-enable it via `PATCH /api/v1/inbound-webhooks/:id` with `{ "enabled": true }`.

### `401 Unauthorized` — "Invalid webhook signature"

- The signature you computed doesn't match. Common causes:
  - Body was re-serialized after signing (whitespace/key ordering changed)
  - Using the wrong secret (check it against the value returned on key creation)
  - Adding the `sha256=` prefix — inbound signatures are **raw hex, no prefix**
- Test without a signature header first, then add signing once the basic flow works.

### `400 Bad Request` — missing GitHub headers

- The GitHub endpoint requires both `X-Hub-Signature-256` and `X-GitHub-Event`. These are sent automatically by GitHub; if you're testing manually, include both headers.

### `400 Bad Request` — "Webhook URL cannot target internal/private IP addresses"

- Outbound webhook URLs must resolve to a public IP. Localhost, 10.x, 172.16–31.x, and 192.168.x addresses are blocked to prevent SSRF.
- Use a tunnel (ngrok, cloudflared) for local development.

### Outbound hook auto-disabled

- A hook is automatically disabled after **10 consecutive delivery failures**. Re-enable it with `PATCH /api/v1/webhooks/:id` (`{ "enabled": true }`) and check `lastError` to understand the failure.

### Discord messages not creating tasks

- Verify the message `content` matches one of the recognized patterns (e.g. starts with `✅ Task:`).
- Check that the Discord user's `author.id` is present in the `DISCORD_AGENT_MAP` in the controller, or that `author.bot` is `false`.
- Bot messages are silently dropped unless the bot ID is in the map.

### Tasks created via webhook have no assignee

- The webhook key has no `defaultAgentId` and the payload omitted `assigneeId`.
- Update the key: `PATCH /api/v1/inbound-webhooks/:id` with `{ "defaultAgentId": "<agent-uuid>" }`.
