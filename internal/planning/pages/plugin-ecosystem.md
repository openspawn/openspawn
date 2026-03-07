# Plugin Ecosystem

<span class="status status-active">Designing</span>

_Updated: Feb 26, 2026_

## The Idea

The OpenSpawn dashboard shouldn't be a monolith. Every major feature — kanban, org chart, budget meters, live feed — should be a **plugin** that can be swapped, extended, or replaced with existing tools.

## Why Plugins

1. **Don't rebuild what exists.** There are excellent self-hosted kanban tools. Let people use them.
2. **Agent-installable.** An agent should be able to `openspawn plugin add kanban` and get a task board.
3. **Composable dashboards.** Every org is different — let them pick their views.
4. **Community growth.** Third-party plugins = ecosystem = moat.

## Architecture

```mermaid
flowchart TD
  CLI["openspawn plugin add kanban"] -->|installs| REG[Plugin Registry]
  REG -->|downloads| PKG[Plugin Package]
  PKG -->|registers| DASH[Dashboard Shell]

  DASH --> SLOT1[Slot: sidebar]
  DASH --> SLOT2[Slot: main-panel]
  DASH --> SLOT3[Slot: status-bar]

  SLOT2 --> P1[Kanban Plugin]
  SLOT2 --> P2[Org Chart Plugin]
  SLOT2 --> P3[Live Feed Plugin]
  SLOT1 --> P4[Budget Plugin]
  SLOT3 --> P5[Agent Status Plugin]

  P1 -->|reads/writes| DB[(SQLite via MCP)]
  P2 -->|reads| DB
  P3 -->|subscribes| SSE[SSE Events]
```

## Plugin Interface (Draft)

```typescript
interface OpenSpawnPlugin {
  id: string; // "kanban", "org-chart", "budget"
  name: string; // "Kanban Board"
  version: string;
  slot: "sidebar" | "main-panel" | "status-bar" | "overlay";

  // React component to render
  component: React.ComponentType<PluginProps>;

  // MCP tools this plugin needs access to
  requiredTools?: string[]; // ["task_create", "task_claim", "task_list"]

  // Plugin-specific settings
  settings?: PluginSetting[];

  // Optional: plugin provides its own MCP tools
  providedTools?: MCPToolDefinition[];
}

interface PluginProps {
  // SQLite access via MCP
  mcp: MCPClient;
  // SSE event stream
  events: EventSource;
  // Current org config
  org: OrgConfig;
  // Plugin settings
  settings: Record<string, unknown>;
}
```

## Kanban Plugin — The First Plugin

### What It Does

```mermaid
flowchart LR
  subgraph Kanban Board
    COL1[📋 Backlog] --> COL2[🔄 In Progress]
    COL2 --> COL3[👀 Review]
    COL3 --> COL4[✅ Done]
  end

  A1[Agent creates task] -->|task_create| COL1
  A2[Agent claims task] -->|task_claim| COL2
  A3[Agent completes] -->|task_complete| COL4
  ESC[Escalation] -->|escalate| COL3
```

- Cards = tasks from SQLite `tasks` table
- Columns = task statuses (open → claimed → review → done)
- Cards show: assignee avatar, priority, created time, parent task
- Drag-and-drop reassignment (human override)
- Real-time updates via SSE

### Integration with Existing Tools

Rather than building everything from scratch, we should support **bridging** to popular self-hosted kanban tools:

| Tool                      | Stars | Status      | Integration Approach                                            |
| ------------------------- | ----- | ----------- | --------------------------------------------------------------- |
| **Claw-Kanban**           | New   | Active      | Native inspiration — agent-first routing, role-based assignment |
| **Focalboard/Mattermost** | 22k+  | Active      | REST API bridge — sync tasks bidirectionally                    |
| **WeKan**                 | 19k+  | Active      | REST API bridge                                                 |
| **Planka**                | 8k+   | Active      | Clean API, good UI — closest to what we'd want natively         |
| **Kanboard**              | 8k+   | Maintenance | JSON-RPC API — stable but aging                                 |
| **Leantime**              | 5k+   | Active      | REST API, includes project management beyond kanban             |
| **Vikunja**               | 4k+   | Active      | Modern API, task-focused, CalDAV support                        |

### Bridge Architecture

```mermaid
sequenceDiagram
  participant Agent
  participant MCP as OpenSpawn MCP
  participant DB as SQLite
  participant Bridge as Kanban Bridge
  participant Ext as External Kanban (Planka/WeKan)

  Agent->>MCP: task_create("Build auth API")
  MCP->>DB: INSERT INTO tasks
  MCP->>Bridge: sync_create event
  Bridge->>Ext: POST /api/cards

  Note over Ext: Human drags card to "Done"
  Ext-->>Bridge: webhook: card moved
  Bridge->>DB: UPDATE tasks SET status='done'
  Bridge->>MCP: task_completed event
  MCP-->>Agent: [SSE notification]
```

**Key principle:** SQLite is always the source of truth. External tools are views/mirrors.

## Built-in vs Bridge vs External

```mermaid
flowchart TD
  Q{Does the plugin need\nagent-native behavior?}
  Q -->|Yes| BUILT[Built-in Plugin\nReact component + MCP tools]
  Q -->|No| Q2{Does it need\nbidirectional sync?}
  Q2 -->|Yes| BRIDGE[Bridge Plugin\nSync adapter + webhooks]
  Q2 -->|No| EMBED[Embed Plugin\niframe + postMessage]
```

**Built-in:** Kanban, org chart, live feed, budget — things agents interact with directly
**Bridge:** Planka, WeKan, Jira — tools humans already use, synced to SQLite
**Embed:** Grafana, custom dashboards — read-only views in an iframe

## Plugin Lifecycle

```mermaid
stateDiagram-v2
  [*] --> discovered: openspawn plugin search
  discovered --> installed: openspawn plugin add
  installed --> configured: plugin settings set
  configured --> active: dashboard loads
  active --> disabled: openspawn plugin disable
  disabled --> active: openspawn plugin enable
  active --> removed: openspawn plugin remove
  removed --> [*]
```

## CLI Commands

```bash
openspawn plugin search kanban          # search registry
openspawn plugin add kanban             # install
openspawn plugin add planka-bridge      # install bridge
openspawn plugin list                   # show installed
openspawn plugin config kanban          # edit settings
openspawn plugin disable kanban         # disable without removing
openspawn plugin remove kanban          # uninstall
```

## Plugin Registry

Two options:

**Option A: npm-based** — plugins are npm packages with a naming convention (`openspawn-plugin-*`)

- Pro: existing infrastructure, versioning, publishing
- Con: requires npm account, not agent-discoverable

**Option B: Git-based** — plugins are GitHub repos with a `plugin.json` manifest

- Pro: agents can discover via GitHub search, fork and modify easily
- Con: no versioning/deduplication built in

**Option C: Custom registry (like ClawHub)** — JSON registry file listing available plugins

- Pro: curated, agent-discoverable via `llms.txt`
- Con: requires maintenance

**Recommendation: Start with npm, add to llms.txt for agent discovery.**

## First Plugins Roadmap

| Plugin          | Type     | Priority | Description                           |
| --------------- | -------- | -------- | ------------------------------------- |
| `kanban`        | Built-in | P0       | Task board from SQLite tasks table    |
| `org-chart`     | Built-in | P0       | Interactive org hierarchy from ORG.md |
| `live-feed`     | Built-in | P1       | Real-time agent message stream        |
| `budget`        | Built-in | P1       | Per-agent token/cost tracking         |
| `planka-bridge` | Bridge   | P2       | Bidirectional sync with Planka        |
| `github-bridge` | Bridge   | P2       | Sync tasks ↔ GitHub Issues            |
| `metrics`       | Built-in | P3       | Agent performance dashboard           |

## Inspiration from Claw-Kanban

What Claw-Kanban gets right:

- **Agent-first design** — tasks route to agents by role, not manually
- **Role-based auto-assignment** — matches our ORG.md level/role system
- **Real-time monitoring** — agents report status as they work
- **Multi-agent support** — Claude, Codex, Gemini all supported

What we'd add:

- **Hierarchy** — Claw-Kanban is flat. OpenSpawn has departments, reporting chains, escalation.
- **Persistence** — tasks survive agent crashes. SQLite, not in-memory.
- **Budget enforcement** — agents can't burn unlimited tokens.
- **Plugin architecture** — kanban is one view of the data, not the whole product.
