# Tailwind Color Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded hex/rgba colors with Tailwind token classes + CVA variants in 8 worst-offender dashboard files.

**Architecture:** Extend `tailwind-preset.ts` with missing tokens + semantic status aliases, create 3 CVA components (StatusBadge, ActionButton, ModalContainer), then convert each file bottom-up.

**Tech Stack:** Tailwind CSS v4, class-variance-authority (CVA), React, TypeScript

---

### Task 1: Extend Tailwind Preset with Missing Tokens

**Files:**
- Modify: `libs/design-tokens/src/tailwind-preset.ts`

**Step 1: Add ocean-abyss and semantic status tokens**

In `tailwind-preset.ts`, extend the `colors` object inside `theme.extend`:

```ts
colors: {
  "bb-sandy": bbColors.sandy,
  "bb-ocean": bbColors.ocean,
  "bb-coral": bbColors.coral,
  "bb-kelp": bbColors.kelp,
  "bb-krabby": bbColors.character.krabby,
  "bb-pineapple": bbColors.character.pineapple,
  "bb-bubble": bbColors.ocean[50],
  "bb-squid": bbColors.character.squid,
  "bb-pearl": bbColors.character.pearl,
  "bb-dutchman": bbColors.character.dutchman,
  // --- NEW ---
  "bb-ocean-abyss": bbColors.ocean.abyss,
  "bb-status": {
    idle: bbColors.ocean[400],
    working: bbColors.sandy[400],
    busy: bbColors.coral[400],
    overwhelmed: bbColors.coral[500],
  },
},
```

Note: `bb-ocean-abyss` is a flat color string, not a scale. `bb-status` is a scale keyed by status name. Paused uses `slate-400` directly in components.

**Step 2: Verify build**

Run: `pnpm exec nx build design-tokens`
Expected: PASS

**Step 3: Commit**

```bash
git add libs/design-tokens/src/tailwind-preset.ts
git commit -m "feat(design-tokens): add ocean-abyss + semantic status tokens to tailwind preset"
```

---

### Task 2: Create StatusBadge CVA Component

**Files:**
- Create: `apps/demo/src/components/ui/status-badge.tsx`

**Step 1: Create the component**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold font-body uppercase tracking-wide border",
  {
    variants: {
      status: {
        idle: "bg-bb-status-idle/10 text-bb-status-idle border-bb-status-idle/30",
        working: "bg-bb-status-working/15 text-bb-status-working border-bb-status-working/40",
        busy: "bg-bb-status-busy/15 text-bb-status-busy border-bb-status-busy/40",
        overwhelmed: "bg-bb-status-overwhelmed/20 text-bb-status-overwhelmed border-bb-status-overwhelmed/50",
        paused: "bg-slate-400/15 text-slate-400 border-slate-400/30",
      },
    },
    defaultVariants: {
      status: "idle",
    },
  },
);

const statusDotVariants = cva("w-2 h-2 rounded-full shrink-0", {
  variants: {
    status: {
      idle: "bg-bb-status-idle",
      working: "bg-bb-status-working animate-[status-pulse_2s_ease-in-out_infinite]",
      busy: "bg-bb-status-busy",
      overwhelmed: "bg-bb-status-overwhelmed animate-[status-pulse_1s_ease-in-out_infinite]",
      paused: "bg-slate-400",
    },
  },
  defaultVariants: {
    status: "idle",
  },
});

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  label: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showDot && <span className={statusDotVariants({ status })} />}
      {label}
    </span>
  );
}

export { statusBadgeVariants, statusDotVariants };
```

**Step 2: Verify it compiles**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add apps/demo/src/components/ui/status-badge.tsx
git commit -m "feat(demo): add StatusBadge CVA component with bb-status tokens"
```

---

### Task 3: Create ActionButton CVA Component

**Files:**
- Create: `apps/demo/src/components/ui/action-button.tsx`

**Step 1: Create the component**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const actionButtonVariants = cva(
  "inline-flex items-center gap-2.5 rounded-xl text-sm font-semibold font-body transition-all duration-200 border",
  {
    variants: {
      intent: {
        ocean: "bg-bb-ocean-400/10 border-bb-ocean-400/20 text-bb-ocean-200 hover:bg-bb-ocean-400/15",
        kelp: "bg-bb-kelp-400/12 border-bb-kelp-400/25 text-bb-kelp-400 hover:bg-bb-kelp-400/18",
        sandy: "bg-bb-sandy-400/12 border-bb-sandy-400/25 text-bb-sandy-400 hover:bg-bb-sandy-400/18",
        coral: "bg-bb-coral-500/8 border-bb-coral-500/20 text-bb-coral-500 hover:bg-bb-coral-500/15",
        indigo: "bg-indigo-400/10 border-indigo-400/20 text-indigo-400 hover:bg-indigo-400/15",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-xs",
        lg: "px-4 py-3 text-sm",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      intent: "ocean",
      size: "md",
      fullWidth: false,
    },
  },
);

interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {}

export function ActionButton({
  intent,
  size,
  fullWidth,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={cn(actionButtonVariants({ intent, size, fullWidth }), className)}
      {...props}
    />
  );
}

export { actionButtonVariants };
```

**Step 2: Verify it compiles**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add apps/demo/src/components/ui/action-button.tsx
git commit -m "feat(demo): add ActionButton CVA component with bb-* intent variants"
```

---

### Task 4: Create ModalContainer Component

**Files:**
- Create: `apps/demo/src/components/ui/modal-container.tsx`

**Step 1: Create the component**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const modalPanelVariants = cva(
  "relative w-full rounded-2xl bg-gradient-to-b from-bb-ocean-900/[0.98] to-bb-ocean-abyss/[0.99] backdrop-blur-2xl shadow-[0_0_40px]",
  {
    variants: {
      intent: {
        default: "border border-bb-ocean-400/25 shadow-bb-ocean-400/10",
        destructive: "border border-bb-coral-500/25 shadow-bb-coral-500/10",
      },
      size: {
        sm: "max-w-sm p-6",
        md: "max-w-md p-6",
        lg: "max-w-lg p-0",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "sm",
    },
  },
);

interface ModalContainerProps extends VariantProps<typeof modalPanelVariants> {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function ModalContainer({
  intent,
  size,
  onClose,
  children,
  className,
}: ModalContainerProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-[fade-in_0.15s_ease-out]"
    >
      <div
        className="absolute inset-0 bg-bb-ocean-abyss/60"
        onClick={onClose}
      />
      <div
        className={cn(
          modalPanelVariants({ intent, size }),
          "animate-[scale-in_0.2s_ease-out]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export { modalPanelVariants };
```

**Step 2: Verify it compiles**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add apps/demo/src/components/ui/modal-container.tsx
git commit -m "feat(demo): add ModalContainer CVA component with default/destructive intents"
```

---

### Task 5: Convert AgentControlPanel

**Files:**
- Modify: `apps/demo/src/components/controls/AgentControlPanel.tsx`

**Step 1: Replace STATUS_COLORS with StatusBadge import**

Remove the `STATUS_COLORS` constant (lines 17-23). Import `StatusBadge` and `ActionButton`.

Replace the status badge JSX (lines 102-121) with:
```tsx
<StatusBadge
  status={agent.status === "paused" ? "paused" : agent.status}
  label={agent.status.toUpperCase()}
/>
```

**Step 2: Convert the panel container**

Replace the outer `div` inline styles (line 52-56) with Tailwind classes:
```tsx
className="fixed inset-y-0 right-0 w-80 max-w-[90vw] z-50 flex flex-col
  bg-gradient-to-b from-bb-ocean-900/[0.97] to-bb-ocean-abyss/[0.98]
  border-l border-bb-ocean-400/20 backdrop-blur-2xl
  animate-[slide-in-right_0.25s_ease-out]"
```
Remove the `style` prop entirely.

**Step 3: Convert the header section**

- Avatar ring: `border-2` with dynamic status color → use `border-bb-status-{status}` by mapping, or keep the dynamic `style` for the border color since it depends on runtime status. Use: `bg-gradient-to-br from-bb-ocean-800 to-bb-ocean-900` for avatar bg.
- Name text: `style={{ color: "#B8E4F7" }}` → `className="text-bb-ocean-200 font-display"`
- Department text: `style={{ color: "rgba(184,228,247,0.5)" }}` → `className="text-bb-ocean-200/50 font-body"`
- Close button: already uses Tailwind brackets, swap: `text-[rgba(184,228,247,0.4)]` → `text-bb-ocean-200/40`, `hover:text-[#B8E4F7]` → `hover:text-bb-ocean-200`, `hover:bg-[rgba(74,174,217,0.1)]` → `hover:bg-bb-ocean-400/10`
- Header border: `border-[rgba(74,174,217,0.12)]` → `border-bb-ocean-400/[0.12]`

**Step 4: Convert control buttons to ActionButton**

- Pause/Resume button: `<ActionButton intent={isPaused ? "kelp" : undefined} size="lg" fullWidth ...>` where undefined defaults to ocean. Map the paused styling: `intent="kelp"` when paused, create a new `slate` intent or just use conditional classes. Simplest: add conditional className override for the paused case using `cn()`.
- Reassign button: `<ActionButton intent="ocean" size="lg" fullWidth>`
- Fire button: `<ActionButton intent="coral" size="lg" fullWidth>`

**Step 5: Convert the reassign dropdown**

- Dropdown container: `bg-bb-ocean-900/95 border border-bb-ocean-400/15`
- Each option: `text-bb-ocean-200 font-body`, disabled: `text-bb-ocean-200/30`
- Border bottom: `border-b border-bb-ocean-400/[0.06]`
- Remove `onMouseEnter`/`onMouseLeave` handlers, replace with `hover:bg-bb-ocean-400/[0.08]`

**Step 6: Convert model tier section**

- Container: `bg-indigo-400/[0.08] border border-indigo-400/20`
- Label: `text-bb-ocean-200/50 font-body`
- Active button: `bg-indigo-400/25 border-indigo-400/50 text-indigo-400`
- Inactive button: `border-indigo-400/15 text-bb-ocean-200/40`

**Step 7: Convert backdrop**

- `bg-[rgba(3,14,26,0.4)]` → `bg-bb-ocean-abyss/40`

**Step 8: Remove all remaining `fontFamily` inline styles**

- `"Baloo 2", cursive` → `font-display`
- `"Nunito, sans-serif"` → `font-body`

**Step 9: Verify**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: No TypeScript errors. Visual check: colors identical.

**Step 10: Commit**

```bash
git add apps/demo/src/components/controls/AgentControlPanel.tsx
git commit -m "refactor(demo): convert AgentControlPanel to tailwind tokens + CVA components"
```

---

### Task 6: Convert TaskControlBar

**Files:**
- Modify: `apps/demo/src/components/controls/TaskControlBar.tsx`

**Step 1: Convert HireModal to use ModalContainer + ActionButton**

- Wrap content with `<ModalContainer intent="default" size="sm" onClose={onClose}>`
- Remove the outer backdrop div and panel styling
- Title: `text-bb-ocean-400 font-display`
- Labels: `text-bb-ocean-200/50 font-body`
- Input/select: `bg-bb-ocean-400/[0.08] border border-bb-ocean-400/20 text-bb-ocean-200 font-body`
- Model tier buttons: same pattern as AgentControlPanel (indigo)
- Cancel button: `<ActionButton intent="ocean" size="lg" fullWidth>`
- Hire button: `<ActionButton intent="kelp" size="lg" fullWidth className="font-bold">`

**Step 2: Convert PlanModal to use ModalContainer**

- `<ModalContainer intent="default" size="lg" onClose={onClose}>`
- Header border: `border-bb-ocean-400/[0.12]`
- Title: `text-bb-sandy-400 font-display`
- Close button: `text-bb-ocean-200/40 hover:text-bb-ocean-200`
- Pre text: `text-bb-ocean-200 font-body`

**Step 3: Convert floating TaskControlBar**

- Container: `bg-bb-ocean-900/90 border border-bb-ocean-400/20 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_16px] shadow-bb-ocean-400/[0.08]`
- Hire button: `<ActionButton intent="kelp" size="md">`
- Escalate button: `<ActionButton intent="sandy" size="md">`
- View Plan button: `<ActionButton intent="ocean" size="md">`
- Remove all `fontFamily` styles → `font-body` in ActionButton base already

**Step 4: Verify and commit**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: PASS

```bash
git add apps/demo/src/components/controls/TaskControlBar.tsx
git commit -m "refactor(demo): convert TaskControlBar to tailwind tokens + CVA components"
```

---

### Task 7: Convert ConfirmModal

**Files:**
- Modify: `apps/demo/src/components/controls/ConfirmModal.tsx`

**Step 1: Rewrite using ModalContainer + ActionButton**

```tsx
import { ModalContainer } from "../ui/modal-container";
import { ActionButton } from "../ui/action-button";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <ModalContainer intent="destructive" size="sm" onClose={onCancel}>
      <div className="text-base font-bold font-display text-bb-coral-500 mb-2">
        ⚠️ {title}
      </div>
      <p className="text-sm font-body text-bb-ocean-200/60 leading-relaxed mb-6">
        {message}
      </p>
      <div className="flex gap-3">
        <ActionButton intent="ocean" size="lg" fullWidth onClick={onCancel}>
          Cancel
        </ActionButton>
        <ActionButton intent="coral" size="lg" fullWidth onClick={onConfirm} className="font-bold">
          {confirmLabel}
        </ActionButton>
      </div>
    </ModalContainer>
  );
}
```

**Step 2: Verify and commit**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: PASS

```bash
git add apps/demo/src/components/controls/ConfirmModal.tsx
git commit -m "refactor(demo): convert ConfirmModal to ModalContainer + ActionButton"
```

---

### Task 8: Convert CharacterCard

**Files:**
- Modify: `apps/demo/src/components/bb/CharacterCard.tsx`

**Step 1: Convert STATUS_STYLE map**

Replace hex brackets with `bb-status-*` tokens:
```ts
const STATUS_STYLE: Record<CharacterStatus, string> = {
  [CharacterStatus.Idle]: "bg-bb-status-idle/10 text-bb-status-idle border border-bb-status-idle/30",
  [CharacterStatus.Working]: "bg-bb-status-working/15 text-bb-status-working border border-bb-status-working/40",
  [CharacterStatus.Busy]: "bg-bb-status-busy/15 text-bb-status-busy border border-bb-status-busy/40",
  [CharacterStatus.Overwhelmed]: "bg-bb-status-overwhelmed/20 text-bb-status-overwhelmed border border-bb-status-overwhelmed/50",
};
```

**Step 2: Convert STATUS_RING map**

```ts
const STATUS_RING: Record<CharacterStatus, string> = {
  [CharacterStatus.Idle]: "border-bb-ocean-400/30",
  [CharacterStatus.Working]: "border-bb-sandy-400 shadow-[0_0_16px] shadow-bb-sandy-400/50",
  [CharacterStatus.Busy]: "border-bb-coral-400 shadow-[0_0_12px] shadow-bb-coral-400/40",
  [CharacterStatus.Overwhelmed]: "border-bb-coral-500 shadow-[0_0_20px] shadow-bb-coral-500/60",
};
```

**Step 3: Convert card body classes**

- Card bg: `bg-[rgba(11,61,96,0.6)]` → `bg-bb-ocean-800/60`
- Card border: `border-[rgba(74,174,217,0.2)]` → `border-bb-ocean-400/20`
- Card shadow inline style: move to `shadow-[var(--bb-shadow-card)]` or use the token classes
- Crisis overlay: `bg-[#FF4757]/5` → `bg-bb-coral-500/5`
- Avatar gradient: `from-[#0B3D60] to-[#062A45]` → `from-bb-ocean-800 to-bb-ocean-900`

**Step 4: Convert text classes**

- Name: `text-[#E8F8FF]` → `text-bb-ocean-50` + `font-display`
- Job title: `text-[#4AAED9]` → `text-bb-ocean-400` + `font-body`
- Team: `text-[#B8E4F7]/50` → `text-bb-ocean-200/50` + `font-body`
- Queue: `text-[#FF6B6B]` → `text-bb-coral-400` + `font-body`
- Last message: `text-[#B8E4F7]/60` → `text-bb-ocean-200/60` + `font-body`
- Border: `border-[rgba(74,174,217,0.1)]` → `border-bb-ocean-400/10`

**Step 5: Convert CharacterCardGrid**

- Toggle button: `text-[#4AAED9]` → `text-bb-ocean-400`, `hover:text-[#F4C542]` → `hover:text-bb-sandy-400` + `font-body`

**Step 6: Verify and commit**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: PASS

```bash
git add apps/demo/src/components/bb/CharacterCard.tsx
git commit -m "refactor(demo): convert CharacterCard to bb-* tailwind tokens"
```

---

### Task 9: Convert LiveTickerFeed

**Files:**
- Modify: `apps/demo/src/components/bb/LiveTickerFeed.tsx`

**Step 1: Convert TYPE_STYLE and BORDER_STYLE maps**

```ts
const TYPE_STYLE: Record<TickerMessage["type"], string> = {
  message: "text-bb-ocean-200",
  escalation: "text-bb-coral-400",
  completion: "text-bb-kelp-400",
  delegation: "text-bb-sandy-400",
};

const BORDER_STYLE: Record<TickerMessage["type"], string> = {
  message: "",
  escalation: "border-l-2 border-l-bb-coral-400 !pl-3",
  completion: "border-l-2 border-l-bb-kelp-400 !pl-3",
  delegation: "border-l-2 border-l-bb-sandy-400 !pl-3",
};
```

**Step 2: Convert container and header**

- Container: `bg-[rgba(6,42,69,0.85)]` → `bg-bb-ocean-900/85`, `border-[rgba(74,174,217,0.2)]` → `border-bb-ocean-400/20`
- Header border: `border-[rgba(74,174,217,0.15)]` → `border-bb-ocean-400/15`
- Live dot: `bg-[#FF4757]` → `bg-bb-coral-500`
- LIVE FEED text: `text-[#B8E4F7]` → `text-bb-ocean-200` + `font-display`
- Watch Live button: `text-[#F4C542]` → `text-bb-sandy-400`, `hover:text-[#FDE68A]` → `hover:text-bb-sandy-200` + `font-body`

**Step 3: Convert message items**

- Message border: `border-[rgba(74,174,217,0.06)]` → `border-bb-ocean-400/[0.06]`
- Agent name: `text-[#4AAED9]` → `text-bb-ocean-400` + `font-body`
- Empty state: `text-[#4AAED9]/50` → `text-bb-ocean-400/50` + `font-body`

**Step 4: Verify and commit**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: PASS

```bash
git add apps/demo/src/components/bb/LiveTickerFeed.tsx
git commit -m "refactor(demo): convert LiveTickerFeed to bb-* tailwind tokens"
```

---

### Task 10: Convert Presence Component

**Files:**
- Modify: `apps/demo/src/components/presence.tsx`

**Step 1: Convert glowColors to use CSS vars or Tailwind**

The `glowColors` map uses rgba values in inline `boxShadow` styles. Since Tailwind can't express `boxShadow` with full control, keep the inline style but reference CSS vars:

```ts
const glowColors: Record<PresenceStatus, string> = {
  active: "var(--bb-kelp-400)",
  busy: "var(--bb-sandy-400)",
  error: "var(--bb-coral-500)",
  idle: "var(--bb-ocean-400)",
};
```

Then in the style: `boxShadow: \`0 0 12px color-mix(in srgb, ${glowColors[status]} 45%, transparent)\``

Alternative (simpler): keep the rgba but swap to token-derived values. Since `presence.tsx` only has 4 hardcoded rgba values and uses Framer Motion (which requires inline styles for animation), this is the lightest-touch conversion. Map each rgba to its nearest token comment for documentation.

Decision: use `shadow-[0_0_12px]` + `shadow-bb-kelp-400/45` etc. on the motion.div `className` instead of inline `boxShadow`. This eliminates the inline style entirely.

```ts
const glowShadow: Record<PresenceStatus, string> = {
  active: "shadow-[0_0_12px] shadow-bb-kelp-400/45",
  busy: "shadow-[0_0_12px] shadow-bb-sandy-400/35",
  error: "shadow-[0_0_12px] shadow-bb-coral-500/45",
  idle: "shadow-[0_0_12px] shadow-bb-ocean-400/18",
};
```

Remove the `style={{ boxShadow }}` prop, add `glowShadow[status]` to className.

**Step 2: Verify and commit**

Run: `pnpm exec nx build demo --skip-nx-cache 2>&1 | head -20`
Expected: PASS

```bash
git add apps/demo/src/components/presence.tsx
git commit -m "refactor(demo): convert presence glow colors to bb-* tailwind tokens"
```

---

### Task 11: Lint, Format, Final Verification

**Step 1: Format**

Run: `pnpm exec oxfmt --write .`

**Step 2: Lint**

Run: `pnpm exec nx run-many -t lint`
Expected: 0 errors

**Step 3: Build**

Run: `pnpm exec nx run-many -t build --exclude=dashboard`
Expected: PASS

**Step 4: Test**

Run: `pnpm exec nx run-many -t test --exclude=dashboard --exclude=openspawn`
Expected: PASS

**Step 5: Commit any format/lint fixes**

```bash
git add -A
git commit -m "chore(demo): format + lint fixes after tailwind color migration"
```
