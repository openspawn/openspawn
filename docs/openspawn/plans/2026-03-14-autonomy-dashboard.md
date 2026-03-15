# Autonomy Dial Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add autonomy slider to task detail and approval queue page to the dashboard — Phase 2 of the autonomy dial feature (#668).

**Architecture:** Create Slider UI component wrapping @base-ui/react/slider. Add REST hooks for approvals + task autonomy PATCH. Add slider to existing task-detail-sidebar. Create new /approvals page with table, tabs, approve/reject actions. Wire route + sidebar nav.

**Tech Stack:** React 19, TanStack Router, TanStack Query, @base-ui/react, Tailwind v4, shadcn/ui patterns

**Prereqs:** API endpoints from Phase 1 must be deployed. OpenAPI spec + codegen must include `/approvals/*` endpoints and `autonomy_level` on task schemas (already done).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `apps/api/app/tasks/router.py` | Add PATCH endpoint for task autonomy_level |
| `apps/api/app/tasks/service.py` | Add update_task_autonomy service function |
| `apps/dashboard/src/components/ui/slider.tsx` | Slider component wrapping @base-ui/react/slider |
| `libs/dashboard-data/src/rest/hooks/use-approvals.ts` | Query + mutation hooks for approvals |
| `libs/dashboard-data/src/rest/hooks/index.ts` | Re-export new hooks |
| `apps/dashboard/src/pages/tasks/task-detail-sidebar.tsx` | Add autonomy slider to task detail |
| `apps/dashboard/src/pages/approvals.tsx` | Approvals queue page |
| `apps/dashboard/src/routes.tsx` | Add /approvals route |
| `apps/dashboard/src/components/sidebar.tsx` | Add Approvals nav item |

---

## Chunk 1: API — Task Autonomy PATCH Endpoint

### Task 1: Add PATCH /tasks/{id}/autonomy endpoint

**Files:**
- Modify: `apps/api/app/tasks/schemas.py`
- Modify: `apps/api/app/tasks/service.py`
- Modify: `apps/api/app/tasks/router.py`

- [ ] **Step 1: Add UpdateAutonomyDto schema**

In `apps/api/app/tasks/schemas.py`, after `TransitionTaskDto`:

```python
class UpdateAutonomyDto(BaseModel):
    autonomy_level: int | None = Field(ge=0, le=10)
```

- [ ] **Step 2: Add service function**

In `apps/api/app/tasks/service.py`, after `approve_task`:

```python
async def update_task_autonomy(
    db: AsyncSession, auth: AuthContext, task_id: uuid.UUID, dto: UpdateAutonomyDto
) -> Task:
    task = await _get_task_or_404(db, task_id, auth.org_id)
    task.autonomy_level = dto.autonomy_level
    await db.commit()
    await db.refresh(task)
    return task
```

Import `UpdateAutonomyDto` from schemas at top of file.

- [ ] **Step 3: Add router endpoint**

In `apps/api/app/tasks/router.py`, after the approve endpoint:

```python
@router.patch("/{task_id}/autonomy")
async def update_autonomy(
    task_id: uuid.UUID,
    dto: UpdateAutonomyDto,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_auth),
) -> DataResponse[TaskResponse]:
    task = await service.update_task_autonomy(db, auth, task_id, dto)
    return DataResponse(data=TaskResponse.model_validate(task))
```

Import `UpdateAutonomyDto` from schemas.

- [ ] **Step 4: Regenerate OpenAPI + codegen**

Run:
```bash
cd apps/api && uv run python -c "import json; from app.main import app; open('openapi.json','w').write(json.dumps(app.openapi(), indent=2))"
cd ../.. && pnpm run codegen
```

- [ ] **Step 5: Run tests**

Run: `cd apps/api && uv run pytest tests/ -v --tb=short -q`

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/tasks/ apps/api/openapi.json libs/dashboard-data/src/rest/generated/
git commit -m "feat(api): add PATCH /tasks/{id}/autonomy endpoint"
```

---

## Chunk 2: Slider Component + Approval Hooks

### Task 2: Create Slider UI component

**Files:**
- Create: `apps/dashboard/src/components/ui/slider.tsx`

- [ ] **Step 1: Write component**

Follow the `Progress` component pattern — wrap `@base-ui/react/slider`:

```tsx
import * as React from "react";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "../../lib/utils";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

function Slider({ value, onValueChange, min = 0, max = 10, step = 1, disabled, className }: SliderProps) {
  function handleValueChange(newValue: number | number[]) {
    const v = Array.isArray(newValue) ? newValue[0] : newValue;
    onValueChange(v);
  }

  return (
    <BaseSlider.Root
      value={value}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
    >
      <BaseSlider.Control className="relative flex w-full items-center h-5">
        <BaseSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <BaseSlider.Indicator className="absolute h-full bg-primary rounded-full" />
        </BaseSlider.Track>
        <BaseSlider.Thumb
          className={cn(
            "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

export { Slider };
export type { SliderProps };
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/src/components/ui/slider.tsx
git commit -m "feat(dashboard): add Slider UI component wrapping @base-ui/react"
```

### Task 3: Create approval hooks

**Files:**
- Create: `libs/dashboard-data/src/rest/hooks/use-approvals.ts`
- Modify: `libs/dashboard-data/src/rest/hooks/index.ts`

- [ ] **Step 1: Write hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";

export function useApprovals(status?: string, actionType?: string) {
  return useQuery({
    queryKey: ["approvals", status, actionType],
    queryFn: async () => {
      const { data, error } = await api.GET("/approvals", {
        params: { query: { status, action_type: actionType } },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useApproveApproval(approvalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notes?: string) => {
      const { data, error } = await api.POST("/approvals/{approval_id}/approve", {
        params: { path: { approval_id: approvalId } },
        body: notes ? { notes } : undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useRejectApproval(approvalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notes: string) => {
      const { data, error } = await api.POST("/approvals/{approval_id}/reject", {
        params: { path: { approval_id: approvalId } },
        body: { notes },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateTaskAutonomy(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (autonomyLevel: number | null) => {
      const { data, error } = await api.PATCH("/tasks/{task_id}/autonomy", {
        params: { path: { task_id: taskId } },
        body: { autonomy_level: autonomyLevel },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
```

- [ ] **Step 2: Re-export from index**

Add to `libs/dashboard-data/src/rest/hooks/index.ts`:

```typescript
export {
  useApprovals,
  useApproveApproval,
  useRejectApproval,
  useUpdateTaskAutonomy,
} from "./use-approvals";
```

- [ ] **Step 3: Commit**

```bash
git add libs/dashboard-data/src/rest/hooks/use-approvals.ts libs/dashboard-data/src/rest/hooks/index.ts
git commit -m "feat(dashboard): add approval + autonomy REST hooks"
```

---

## Chunk 3: Task Detail Autonomy Slider

### Task 4: Add autonomy slider to task detail sidebar

**Files:**
- Modify: `apps/dashboard/src/pages/tasks/task-detail-sidebar.tsx`

- [ ] **Step 1: Add slider after the details grid**

Import the Slider and hook at top:
```tsx
import { Slider } from "../../components/ui/slider";
import { useUpdateTaskAutonomy } from "@openspawn/dashboard-data";
```

Import `Shield` icon from lucide-react.

After the details grid section (after the closing `</div>` of `grid grid-cols-2 gap-4`), add:

```tsx
          {/* Autonomy Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="w-4 h-4" />
                Autonomy Level
              </div>
              <span className="text-sm font-mono font-medium">
                {task.autonomyLevel ?? "inherited"}
              </span>
            </div>
            <AutonomySlider taskId={task.id} currentLevel={task.autonomyLevel ?? null} />
            <p className="text-xs text-muted-foreground">
              0 = full oversight · 10 = full autonomy
            </p>
          </div>
```

Add the `AutonomySlider` component in the same file (above the main export):

```tsx
function AutonomySlider({ taskId, currentLevel }: { taskId: string; currentLevel: number | null }) {
  const [value, setValue] = useState(currentLevel ?? 5);
  const updateAutonomy = useUpdateTaskAutonomy(taskId);

  function handleValueChange(newValue: number) {
    setValue(newValue);
  }

  function handlePointerUp() {
    updateAutonomy.mutate(value);
  }

  return (
    <div onPointerUp={handlePointerUp}>
      <Slider
        value={value}
        onValueChange={handleValueChange}
        min={0}
        max={10}
        step={1}
      />
    </div>
  );
}
```

Note: saves on pointer up (not on every change) to avoid excessive API calls.

- [ ] **Step 2: Verify task type includes autonomyLevel**

Check that the task hook/type includes `autonomyLevel`. The REST schema already has it from codegen. If the wrapper hook in `libs/dashboard-data/src/hooks/use-tasks.ts` maps fields, ensure `autonomyLevel` is passed through.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/src/pages/tasks/task-detail-sidebar.tsx
git commit -m "feat(dashboard): add autonomy slider to task detail sidebar"
```

---

## Chunk 4: Approvals Page + Route + Nav

### Task 5: Create approvals page

**Files:**
- Create: `apps/dashboard/src/pages/approvals.tsx`

- [ ] **Step 1: Write page**

Follow the Events page pattern — PageHeader, StatCards, Tabs, card list:

```tsx
import { useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EmptyState } from "../components/ui/empty-state";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { useApprovals, useApproveApproval, useRejectApproval } from "@openspawn/dashboard-data";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getRiskColor(risk: number) {
  if (risk >= 7) return "text-red-500";
  if (risk >= 4) return "text-amber-500";
  return "text-emerald-500";
}

function getRiskBadge(risk: number) {
  if (risk >= 7) return "destructive";
  if (risk >= 4) return "warning";
  return "secondary";
}

function ApprovalRow({ approval }: { approval: Record<string, unknown> }) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const approveAction = useApproveApproval(approval.id as string);
  const rejectAction = useRejectApproval(approval.id as string);

  const isPending = approval.status === "pending";

  function handleApprove() {
    approveAction.mutate(undefined);
  }

  function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (rejectNotes.trim()) {
      rejectAction.mutate(rejectNotes.trim());
      setShowRejectInput(false);
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={getRiskBadge(approval.risk_level as number)} className="text-xs">
            risk {approval.risk_level as number}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {approval.action_type as string}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTime(approval.created_at as string)}
          </span>
        </div>
        <p className="text-sm">
          <span className="font-medium">{approval.entity_type as string}</span>
          <span className="text-muted-foreground"> · autonomy {approval.autonomy_level as number}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPending ? (
          <>
            {showRejectInput && (
              <Input
                placeholder="Reason..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-40 h-8 text-xs"
                autoFocus
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={rejectAction.isPending || (showRejectInput && !rejectNotes.trim())}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={approveAction.isPending}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approve
            </Button>
          </>
        ) : (
          <Badge variant={approval.status === "approved" ? "success" : "destructive"}>
            {approval.status as string}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function ApprovalsPage() {
  const [tab, setTab] = useState("pending");
  const statusFilter = tab === "all" ? undefined : tab;
  const { data, isLoading, error } = useApprovals(statusFilter);

  const approvals = (data?.data ?? []) as Record<string, unknown>[];
  const total = (data?.meta as Record<string, number> | undefined)?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading approvals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading approvals</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review and approve gated agent actions"
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" value={total} icon={Clock} />
        <StatCard title="Risk Threshold" value="varies" icon={AlertTriangle} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            {approvals.length === 0 ? (
              <EmptyState
                variant="tasks"
                title="No approvals"
                description={
                  tab === "pending"
                    ? "No actions are waiting for approval. Agents are operating within their autonomy levels."
                    : "No approvals match this filter."
                }
                compact
              />
            ) : (
              approvals.map((approval) => (
                <ApprovalRow key={approval.id as string} approval={approval} />
              ))
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/dashboard/src/pages/approvals.tsx
git commit -m "feat(dashboard): add approvals queue page"
```

### Task 6: Add route + sidebar nav

**Files:**
- Modify: `apps/dashboard/src/routes.tsx`
- Modify: `apps/dashboard/src/components/sidebar.tsx`

- [ ] **Step 1: Add route**

In `routes.tsx`, after `graphRoute`:

```typescript
const approvalsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/approvals",
  component: lazyRouteComponent(() => import("./pages/approvals"), "ApprovalsPage"),
});
```

Add `approvalsRoute` to the `layoutChildren` array.

- [ ] **Step 2: Add sidebar nav entry**

In `sidebar.tsx`, import `ShieldCheck` from lucide-react.

Add to `navigation` array (after Credits, before Events):

```typescript
  { name: "Approvals", href: "/approvals", icon: ShieldCheck, shortcut: "g p" },
```

- [ ] **Step 3: Build check**

Run: `pnpm exec nx build dashboard`

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/src/routes.tsx apps/dashboard/src/components/sidebar.tsx
git commit -m "feat(dashboard): add approvals route + sidebar nav"
```

---

## Chunk 5: Verification

### Task 7: Full verification

- [ ] **Step 1: Python lint + test**

```bash
cd apps/api && uv run ruff format app/ tests/ && uv run ruff check app/ tests/ && uv run pytest tests/ -v --tb=short -q
```

- [ ] **Step 2: Frontend lint + build**

```bash
pnpm exec oxfmt --write .
pnpm exec nx run-many -t lint
pnpm exec nx run-many -t build
```

- [ ] **Step 3: Commit any fixes**

---

## What's NOT in this phase

- Demo mode support for approvals (live-mode only)
- Approval detail side panel (table is sufficient)
- Badge count on nav item for pending approvals
- Autonomy slider on task creation form (only on detail view)
- Agent default_autonomy_level editor (only task-level for now)
