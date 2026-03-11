# Tailwind Color Migration Design

Replace hardcoded hex/rgba colors with Tailwind token classes + CVA variants in worst-offender dashboard components.

## Problem

~400 inline hex/rgba colors and ~100 arbitrary Tailwind brackets (`bg-[rgba(...)]`) bypass the existing `bb-*` design token system. The tokens exist in `bb-tokens.css` and `tailwind-preset.ts` but aren't consumed.

## Scope

Worst offenders first (8 files). `pages/live-view.tsx`, `toast.ts`, and `bb-tokens.css` are out of scope for this PR.

## Decisions

- **Approach**: Tokens-first — extend preset, then convert files
- **BikiniBottom colors**: Use existing `bb-*` primitives + new semantic status aliases
- **Indigo/slate**: Use Tailwind's built-in `indigo-400`/`slate-400` directly (no `bb-` alias)
- **Inline styles**: Convert to Tailwind classes, not CSS var references
- **Complex gradients**: Define as Tailwind utilities in CSS when no class equivalent exists

## Token Extensions

### New in `tailwind-preset.ts`

```ts
"bb-ocean-abyss": bbColors.ocean.abyss,  // #030E1A (already in CSS, missing from preset)

// Semantic status aliases
"bb-status-idle": bbColors.ocean[400],       // #4AAED9
"bb-status-working": bbColors.sandy[400],    // #F4C542
"bb-status-busy": bbColors.coral[400],       // #FF6B6B
"bb-status-overwhelmed": bbColors.coral[500] // #FF4757
// paused uses slate-400 directly
```

### Hex-to-Tailwind Rosetta Stone

| Hardcoded                         | Tailwind class   |
| --------------------------------- | ---------------- |
| `#4AAED9` / `rgba(74,174,217,*)`  | `bb-ocean-400`   |
| `#B8E4F7` / `rgba(184,228,247,*)` | `bb-ocean-200`   |
| `#E8F8FF`                         | `bb-ocean-50`    |
| `#0B3D60` / `rgba(11,61,96,*)`    | `bb-ocean-800`   |
| `#062A45` / `rgba(6,42,69,*)`     | `bb-ocean-900`   |
| `#030E1A` / `rgba(3,14,26,*)`     | `bb-ocean-abyss` |
| `#F4C542` / `rgba(244,197,66,*)`  | `bb-sandy-400`   |
| `#FF4757` / `rgba(255,71,87,*)`   | `bb-coral-500`   |
| `#FF6B6B` / `rgba(255,107,107,*)` | `bb-coral-400`   |
| `#4AE88A` / `rgba(74,232,138,*)`  | `bb-kelp-400`    |
| `#818CF8` / `rgba(99,102,241,*)`  | `indigo-400`     |
| `#94A3B8` / `rgba(148,163,184,*)` | `slate-400`      |

## CVA Components

### StatusBadge

Variants: `idle | working | busy | overwhelmed | paused`
Maps status to bg/text/border using `bb-status-*` tokens.
Replaces `STATUS_COLORS` and `STATUS_STYLE` objects in multiple files.

### ActionButton

Intent variants: `ocean | kelp | sandy | coral | indigo`
Each intent: tinted bg, matching border, matching text color.
Replaces repeated inline-styled buttons across control panels and modals.

### ModalContainer

Intent variants: `default | destructive`
Consistent backdrop (`bg-bb-ocean-abyss/60`), gradient panel, border, shadow, blur.
Replaces duplicated modal chrome in `ConfirmModal`, `HireModal`, `PlanModal`.

## File Conversion Order

1. `libs/design-tokens/src/tailwind-preset.ts` — token extensions
2. `apps/demo/src/components/ui/` — new CVA components (status-badge, action-button, modal-container)
3. `apps/demo/src/components/controls/AgentControlPanel.tsx` — 40 inline colors
4. `apps/demo/src/components/controls/TaskControlBar.tsx` — 35 inline colors
5. `apps/demo/src/components/controls/ConfirmModal.tsx` — 15 inline colors
6. `apps/demo/src/components/bb/CharacterCard.tsx` — 25 inline colors
7. `apps/demo/src/components/bb/LiveTickerFeed.tsx` — 15 inline colors
8. `apps/demo/src/components/presence.tsx` — 4 inline colors

## Out of Scope

- `pages/live-view.tsx` (80+ colors, follow-up PR)
- `libs/dashboard-data/src/lib/toast.ts` (intentional theme presets)
- `styles/bb-tokens.css` (token definitions, not consumers)
- `presence.tsx` motion/react alignment (separate concern)
