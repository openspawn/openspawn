# Bundle Optimization Design

## Problem

Both `apps/dashboard/` and `apps/demo/` produce ~5MB single-chunk JS bundles. No code splitting, no lazy routes, no vendor chunking.

## Changes

### 1. Lazy Route Loading (TanStack Router `lazy()`)

All pages except DashboardPage (`/`) converted to lazy routes via `.lazy.ts` companion files. TanStack Router resolves these automatically — no `React.lazy()` or `Suspense` needed.

Lazy pages: `/tasks`, `/agents`, `/credits`, `/events`, `/messages`, `/network`, `/router`, `/settings`, `/kanban`, `/task-board`, `/status`, `/intro`, `/live`, `/login`, `/auth/callback`

### 2. Vendor Chunk Splitting

`manualChunks` in vite `rollupOptions`:
- `vendor-react`: react, react-dom, @tanstack/react-router, @tanstack/react-query
- `vendor-motion`: motion/react
- `vendor-xyflow`: @xyflow/react, elkjs

### 3. Remove recharts Type Import

`chart-tooltip.tsx` imports `Payload` type from recharts, pulling entire library. Replace with inline type definition.

## Expected Result

- Initial load: ~2-2.5 MB (dashboard + vendor-react + vendor-motion)
- Network page navigation: +~500 KB (xyflow/elkjs chunk)
- Other page navigations: ~50-100 KB each
- Vendor chunks cached independently across deploys

## Scope

Both `apps/dashboard/` and `apps/demo/` get the same treatment.
