# Event Mesh Spike Findings (#666)

## Hypothesis

Can the Artifact Bus (#665) be reimplemented as a projection over coordination events?

## Result: Confirmed

The `artifact_view` projection successfully derives artifact-like objects from coordination events, producing output structurally equivalent to the Artifact Bus:

```
Input:  4 coordination events (2 component.created, 1 test.written, 1 screenshot.captured)
Output: 4 artifacts with type, name, version, content, producer_agent_id, status, timestamps
```

Versioning works — `component.created` + `component.updated` for the same name produces `version: 2` with merged content. The artifact type mapping covers all current Artifact Bus types (component, test_plan, screenshot, api_contract, migration, doc_section).

## What Works

- **Type mapping**: 8 coordination event types map cleanly to 6 artifact types
- **Versioning**: Same-name events increment version and merge content
- **Projections**: All 3 (component_registry, test_coverage, artifact_view) derive correct state from raw events
- **Subscriptions**: Wildcard pattern matching (exact, `prefix.*`, `*`) enables flexible agent coordination
- **Replay**: Agents can join mid-stream and catch up to full state
- **SQLite compat**: `entity_id = task_id` avoids JSONB path queries

## Trade-offs

| Aspect           | Events as substrate           | Direct artifact storage      |
| ---------------- | ----------------------------- | ---------------------------- |
| Auditability     | Full history by default       | Requires separate versioning |
| Query cost       | O(n) per projection rebuild   | O(1) for latest state        |
| Schema evolution | Add new event types freely    | Migration per schema change  |
| Consistency      | Eventual (projection rebuild) | Immediate                    |
| Storage          | Append-only, grows            | Mutable, bounded             |

## Performance Notes

- Projection rebuild scans all events for a task — O(n) where n = events per task
- Fine for <1000 events per task (spike scale)
- At scale: add materialized projections with invalidation on new events
- No caching implemented — on-demand rebuild is adequate for spike validation

## Recommendation

**Events as substrate, artifacts as projection.** The Artifact Bus can be refactored to read from coordination events rather than maintaining its own storage. Benefits:

1. Single source of truth (events table)
2. Artifact Bus becomes a thin projection layer
3. New projections can be added without schema changes
4. Full audit trail comes free

**Migration path**: Keep Artifact Bus API surface unchanged, swap storage layer to read from events + rebuild projections. ArtifactSubscription becomes an EventSubscription with a type filter.

## Discovered Issues

- `Event` model uses `UUID(as_uuid=True)` from PostgreSQL dialect — doesn't round-trip on SQLite with Python 3.14. Need to migrate to `CompatUUID()`.
- OpenAPI spec generation fails due to SSE router's Pydantic type — pre-existing, unrelated to this spike.
