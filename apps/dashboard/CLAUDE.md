# Dashboard rules

## Animation

- No Framer Motion `layout` on absolutely-positioned elements (layout thrashing)
- Respect `prefers-reduced-motion` via `useReducedMotion`
- Keep interactions under 300ms, use `spring` transitions

## Production builds

- No hardcoded `localhost` URLs — use `getSandboxUrl()` from `src/lib/sandbox-url.ts`
- `VITE_SANDBOX_URL` env var overrides auto-detected URL
- In production (port 80/443), `getSandboxUrl()` returns `''` (same-origin)
