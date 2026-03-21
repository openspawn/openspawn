# Completion Status Protocol

> Every task completion must report its status with evidence. No silent finishes.

---

## The Three Statuses

### ✅ DONE

All steps completed successfully. Evidence provided for each claim.

```
STATUS: DONE

Evidence:
- Tests passing: 47/47 ✓
- Build successful: dist/main.js (142KB)
- Lint clean: 0 errors, 0 warnings
```

### ⚠️ DONE_WITH_CONCERNS

Completed, but with issues the requester should know about. List each concern with severity.

```
STATUS: DONE_WITH_CONCERNS

Completed:
- Feature implemented and tested
- All 12 tests passing

Concerns:
- [MEDIUM] Rate limiting not implemented — works for current scale but will need attention at 100+ agents
- [LOW] TypeScript `any` used in 2 places — type definitions pending from upstream
```

### 🚫 BLOCKED

Cannot proceed. State what is blocking, what was tried, and what is needed to unblock.

```
STATUS: BLOCKED

Blocked by: API endpoint returns 403 — authentication token may be expired
Tried:
- Refreshing token via /auth/refresh → same 403
- Using demo mode → works, suggesting auth-specific issue
Need: Valid API token or access to auth configuration
```

## Why This Matters

In a multi-agent org, silent completion is the enemy of coordination. When Agent A finishes a task and Agent B is waiting on the result, the handoff needs to be explicit:

1. **Did it work?** (DONE / DONE_WITH_CONCERNS / BLOCKED)
2. **What's the evidence?** (Not "I think it works" — show the receipts)
3. **What should the next agent know?** (Concerns, edge cases, assumptions)

## How to Add to Your ORG.md

```yaml
policies:
  completion_status: "All task completions must report DONE, DONE_WITH_CONCERNS, or BLOCKED with evidence."
```

## Severity Levels for Concerns

| Level | Meaning | Action Required |
|-------|---------|-----------------|
| HIGH | Could cause failures in production | Must address before deploy |
| MEDIUM | Works now, will cause issues at scale | Track for next sprint |
| LOW | Cosmetic or minor technical debt | Nice to fix, not urgent |

## Integration with Agent Dashboard

The completion protocol maps directly to task status in the OpenSpawn dashboard:

| Protocol Status | Dashboard State | Color |
|----------------|-----------------|-------|
| DONE | Completed | Green |
| DONE_WITH_CONCERNS | Completed (flagged) | Yellow |
| BLOCKED | Blocked | Red |

---

*Inspired by [gstack](https://github.com/garrytan/gstack)'s completion status protocol (MIT License).*
