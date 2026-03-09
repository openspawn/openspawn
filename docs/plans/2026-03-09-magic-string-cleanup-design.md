# Magic String Cleanup Design

Eliminate duplicated string literals across the codebase by centralizing them as enum values from `libs/shared-types/src/enums/`.

## Problem

1000+ hardcoded string literals across 60+ files for task statuses, priorities, agent statuses, roles, event types, etc. Enums exist in `libs/shared-types` but aren't consumed — two shadow type systems in `libs/demo-data/src/types.ts` and `tools/sandbox/src/types.ts` define their own string unions.

## Scope

All TypeScript source files. Python API enums stay in sync but are already clean (enum-based). Test files updated only where they use raw strings for non-assertion values.

## Decisions

### 1. Extend shared-types enums to be superset

Add missing values that sandbox/demo use:

- `TaskStatus` += `PENDING`, `ASSIGNED`, `REJECTED` (sandbox workflow stages)
- `AgentStatus` += `IDLE`, `BUSY`, `PAUSED` (UI/simulation states)
- `AgentRole` += `COO`, `TALENT`, `LEAD`, `SENIOR`, `INTERN` (sandbox hierarchy)
- `TaskPriority` += `CRITICAL` (sandbox uses it, maps to `URGENT` semantically — keep both)

### 2. Create missing enums

| New Enum                  | Values                                                                    | Used By                                          |
| ------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| `SimulationEventType`     | 15 event types (agent_created, task_assigned, etc.)                       | demo-data simulation engine                      |
| `DemoMessageCategory`     | task, status, report, question, escalation, general                       | demo-data messages                               |
| `MemoryType`              | episodic, semantic, graph                                                 | demo-data memory fixtures                        |
| `MemoryVisibility`        | shared, private, targeted                                                 | demo-data memory fixtures                        |
| `MemorySource`            | task_completion, code_change, observation, inference, unknown             | demo-data memory fixtures                        |
| `ACPMessageType`          | ack, progress, escalation, completion, delegation, status_request         | sandbox ACP protocol                             |
| `SandboxEscalationReason` | BLOCKED, OUT_OF_DOMAIN, OVER_BUDGET, LOW_CONFIDENCE, TIMEOUT, DEPENDENCY  | sandbox-specific (different from API escalation) |
| `AgentActionType`         | delegate, work, message, escalate, create_task, review, spawn_agent, idle | sandbox agent actions                            |
| `TriggerMode`             | polling, event_driven                                                     | sandbox agent config                             |
| `ReviewVerdict`           | approve, reject                                                           | sandbox task review                              |
| `WebhookHookType`         | pre, post                                                                 | demo webhook config                              |

### 3. Replace shadow types with enum imports

- `libs/demo-data/src/types.ts` — delete local type aliases, import from `@openspawn/shared-types`
- `tools/sandbox/src/types.ts` — replace string unions with enum types

### 4. Replace magic strings in logic

All `if (x === "string")` / `switch/case "string"` / `.filter(x => x.status === "string")` → enum references.

### 5. Fixture data

Replace string literals in fixture/scenario data objects with enum references for consistency. This is the highest-volume change but prevents typos.

### 6. Fix ESCALATION_THRESHOLDS

Change from `Record<string, number>` with uppercase keys to `Record<TaskPriority, number>` with enum keys.

## File Conversion Order

### Phase 1: Extend + create enums (libs/shared-types)

1. Extend `TaskStatus`, `AgentStatus`, `AgentRole`, `EventSeverity`
2. Create new enum files
3. Export from index
4. Update enum tests

### Phase 2: Fix type definitions

5. `libs/demo-data/src/types.ts` — import enums, remove local aliases
6. `tools/sandbox/src/types.ts` — import enums, replace string unions

### Phase 3: Fix implementation files (by domain)

7. `tools/sandbox/src/` — deterministic, scenario-engine, simulation, server, etc.
8. `libs/demo-data/src/` — simulation engine, fixtures, scenarios
9. `apps/demo/src/` — components, pages
10. `libs/dashboard-data/src/` — hooks
11. `packages/coordinator/src/` — coordinator logic

### Phase 4: Sync Python enums

12. `apps/api/app/models/enums.py` — add new values to match shared-types

## Out of Scope

- `apps/dashboard/` — deprecated
- Auto-generated files (`rest/generated/schema.d.ts`)
- MCP tool name strings (those are API contract strings, not magic strings)
