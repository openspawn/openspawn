import { useRef, useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type LineKind = "cmd" | "output" | "blank";

interface ScriptLine {
  kind: LineKind;
  text: string;
  color: string;
  step: number;
  charCount?: number; // cmd lines only
}

interface VisibleLine extends ScriptLine {
  id: number;
}

// ─── Script ───────────────────────────────────────────────────────────────────
const CHAR_MS = 50; // ms per character typed
const OUT_GAP = 220; // ms between output lines
const CMD_GAP = 750; // extra pause before each new command (after outputs/blank)
const INIT_DELAY = 500;

const SCRIPT: ScriptLine[] = [
  {
    kind: "cmd",
    text: "$ npx openspawn init my-startup",
    color: "text-slate-200",
    step: 1,
    charCount: 31,
  },
  { kind: "output", text: "  Creating project structure...", color: "text-slate-400", step: 1 },
  { kind: "output", text: "  ✓ ORG.md", color: "text-emerald-400", step: 1 },
  { kind: "output", text: "  ✓ openspawn.config.ts", color: "text-emerald-400", step: 1 },
  { kind: "output", text: "  ✓ .env.example", color: "text-emerald-400", step: 1 },
  { kind: "output", text: "  🚀 my-startup is ready!", color: "text-cyan-400", step: 1 },
  { kind: "blank", text: "", color: "", step: 1 },
  { kind: "cmd", text: "$ openspawn org", color: "text-slate-200", step: 2, charCount: 15 },
  { kind: "output", text: "  my-startup", color: "text-slate-300", step: 2 },
  { kind: "output", text: "  ├── 🎯 CEO (claude-opus)", color: "text-violet-400", step: 2 },
  {
    kind: "output",
    text: "  │   ├── 🎨 Designer (claude-sonnet)",
    color: "text-cyan-400",
    step: 2,
  },
  {
    kind: "output",
    text: "  │   └── 💻 Engineer (claude-sonnet)",
    color: "text-cyan-400",
    step: 2,
  },
  { kind: "blank", text: "", color: "", step: 2 },
  {
    kind: "cmd",
    text: '$ openspawn task create "Build landing page"',
    color: "text-slate-200",
    step: 3,
    charCount: 45,
  },
  {
    kind: "output",
    text: '  ✓ Task #42: "Build landing page"',
    color: "text-emerald-400",
    step: 3,
  },
  { kind: "output", text: "  → Status: queued · Priority: high", color: "text-slate-400", step: 3 },
  { kind: "blank", text: "", color: "", step: 3 },
  {
    kind: "cmd",
    text: "$ openspawn delegate --to designer --task 42",
    color: "text-slate-200",
    step: 4,
    charCount: 45,
  },
  {
    kind: "output",
    text: "  ✓ Delegated task #42 to Designer",
    color: "text-emerald-400",
    step: 4,
  },
  {
    kind: "output",
    text: '  💬 Designer: "Starting on landing page..."',
    color: "text-violet-400",
    step: 4,
  },
  { kind: "output", text: "  ● Task #42: in-progress", color: "text-cyan-400", step: 4 },
];

// ─── Build timing schedule ────────────────────────────────────────────────────
interface ScheduledLine {
  line: ScriptLine;
  appearsAt: number;
}

function buildSchedule(): ScheduledLine[] {
  const schedule: ScheduledLine[] = [];
  let cursor = INIT_DELAY;
  let prevKind: LineKind | null = null;

  for (let i = 0; i < SCRIPT.length; i++) {
    const line = SCRIPT[i];

    // Extra pause before a new command (comes after outputs/blanks)
    if (line.kind === "cmd" && i > 0) {
      cursor += CMD_GAP;
    }

    schedule.push({ line, appearsAt: cursor });

    if (line.kind === "cmd" && line.charCount) {
      cursor += line.charCount * CHAR_MS + 280; // typing duration + short pause
    } else if (line.kind === "output") {
      cursor += OUT_GAP;
    } else if (line.kind === "blank") {
      cursor += 80;
    }

    prevKind = line.kind;
  }

  void prevKind; // suppress unused warning
  return schedule;
}

const SCHEDULE = buildSchedule();
const TOTAL_DURATION = SCHEDULE[SCHEDULE.length - 1].appearsAt + 2500;

// Step highlight times — when each command line first appears
const STEP_START_TIMES = (() => {
  const times: Record<number, number> = {};
  for (const { line, appearsAt } of SCHEDULE) {
    if (line.kind === "cmd" && !(line.step in times)) {
      times[line.step] = appearsAt;
    }
  }
  return times;
})();

// ─── Explanation steps ────────────────────────────────────────────────────────
const STEPS = [
  {
    step: 1,
    label: "Initialize",
    badge: "$ init",
    color: "cyan" as const,
    description:
      "One command scaffolds a complete agent organization: ORG.md, config, and environment. Running in under 30 seconds.",
  },
  {
    step: 2,
    label: "View Org Tree",
    badge: "$ org",
    color: "violet" as const,
    description:
      "Inspect your agent hierarchy at a glance. Each agent has a defined role, model, and org level. Hierarchy enables delegation and escalation.",
  },
  {
    step: 3,
    label: "Create Task",
    badge: "$ task",
    color: "amber" as const,
    description:
      "Tasks are first-class citizens — tracked, prioritized, and visible in the live dashboard. Agents pick up tasks based on their defined scope.",
  },
  {
    step: 4,
    label: "Delegate",
    badge: "$ delegate",
    color: "emerald" as const,
    description:
      "Route work to the right agent in one command. The Designer picks up the task and starts executing — no manual wiring required.",
  },
];

const BADGE_STYLES = {
  cyan: { active: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", inactive: "" },
  violet: { active: "bg-violet-500/10 text-violet-400 border-violet-500/20", inactive: "" },
  amber: { active: "bg-amber-500/10 text-amber-400 border-amber-500/20", inactive: "" },
  emerald: { active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", inactive: "" },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────
export function InteractiveCliDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [visibleLines, setVisibleLines] = useState<VisibleLine[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0); // 0 = not started
  const [isDone, setIsDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const startAnimation = useCallback(() => {
    clearTimers();
    setVisibleLines([]);
    setActiveStep(1);
    setIsDone(false);

    // Schedule each line to appear
    SCHEDULE.forEach(({ line, appearsAt }, idx) => {
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, { ...line, id: idx }]);
      }, appearsAt);
      timersRef.current.push(t);
    });

    // Schedule step highlights
    for (const [stepStr, time] of Object.entries(STEP_START_TIMES)) {
      const step = Number(stepStr);
      const t = setTimeout(() => setActiveStep(step), time);
      timersRef.current.push(t);
    }

    // Mark done
    const doneT = setTimeout(() => setIsDone(true), TOTAL_DURATION);
    timersRef.current.push(doneT);
  }, [clearTimers]);

  // Auto-scroll terminal body as new lines appear
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLines]);

  // IntersectionObserver — triggers once when section scrolls into view
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startAnimation();
            observer.unobserve(section);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      clearTimers();
    };
    // runKey in deps causes the observer to re-attach after replay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAnimation, clearTimers, runKey]);

  const handleReplay = () => {
    setRunKey((k) => k + 1);
  };

  return (
    <section ref={sectionRef} aria-labelledby="cli-demo-heading" className="section-py-lg">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="reveal text-center mb-12">
          <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4">
            See It In Action
          </span>
          <h2
            id="cli-demo-heading"
            className="text-3xl font-extrabold text-slate-100 md:text-4xl lg:text-5xl tracking-tight"
          >
            Zero to running org in <span className="gradient-text">four commands</span>
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-slate-400 leading-relaxed">
            Watch OpenSpawn scaffold, inspect, and delegate work to a live agent organization.
          </p>
        </div>

        {/* Split layout: terminal left, explanation right */}
        <div className="reveal grid gap-8 lg:grid-cols-[3fr_2fr] lg:gap-12 items-start">
          {/* ── Left: Terminal window ─────────────────────────────────────── */}
          <div className="terminal terminal-enhanced">
            {/* Title bar */}
            <div className="terminal-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="terminal-dot bg-red-500/80" />
                <div className="terminal-dot bg-yellow-500/80" />
                <div className="terminal-dot bg-green-500/80" />
                <span className="ml-2 font-mono text-xs text-slate-600 font-medium tracking-wide">
                  openspawn — bash
                </span>
              </div>
              <div className="flex items-center gap-3">
                {activeStep > 0 && !isDone && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                    running
                  </span>
                )}
                {isDone && (
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="flex items-center gap-1.5 rounded px-2 py-0.5 text-xs text-slate-500 transition-all duration-150 hover:bg-white/10 hover:text-cyan-400"
                    aria-label="Replay demo"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                      />
                    </svg>
                    Replay
                  </button>
                )}
              </div>
            </div>

            {/* Terminal body — scrollable */}
            <div
              ref={terminalRef}
              className="p-5 min-h-[320px] max-h-[480px] overflow-y-auto font-mono text-sm leading-relaxed"
              aria-live="polite"
              aria-label="Terminal output"
            >
              {/* Idle prompt before animation starts */}
              {activeStep === 0 && (
                <div className="flex items-center gap-1 text-slate-600">
                  <span className="text-cyan-500/30 select-none">$ </span>
                  <span className="cursor-blink text-cyan-500/30 font-bold">▋</span>
                </div>
              )}

              {visibleLines.map((line) => {
                if (line.kind === "blank") {
                  return <div key={line.id} className="h-2" aria-hidden />;
                }

                if (line.kind === "cmd") {
                  const chars = line.charCount ?? line.text.replace(/^\$ /, "").length;
                  const durationS = (chars * CHAR_MS) / 1000;
                  // The typing animation expands from width:0 to width:N ch.
                  // animation-timing-function uses steps(N, end) for char-by-char effect.
                  return (
                    <div
                      key={line.id}
                      className="cli-typing-cmd"
                      style={
                        {
                          "--char-count": chars,
                          animationDuration: `${durationS}s`,
                          animationTimingFunction: `steps(${chars}, end)`,
                        } as React.CSSProperties
                      }
                    >
                      <span className="text-cyan-500/60 select-none">$ </span>
                      <span className={line.color}>{line.text.slice(2)}</span>
                    </div>
                  );
                }

                // output line — fade in
                return (
                  <div key={line.id} className={`cli-output-line ${line.color}`}>
                    {line.text}
                  </div>
                );
              })}

              {/* Active cursor while running */}
              {activeStep > 0 && !isDone && (
                <span className="cursor-blink text-cyan-500/70 font-bold">▋</span>
              )}
            </div>
          </div>

          {/* ── Right: Step explanations ──────────────────────────────────── */}
          <div className="flex flex-col gap-3" role="list" aria-label="Demo steps">
            {STEPS.map((exp) => {
              const isActive = activeStep === exp.step;
              const isPast = activeStep > exp.step;
              const bs = BADGE_STYLES[exp.color];

              return (
                <div
                  key={exp.step}
                  role="listitem"
                  className={[
                    "rounded-xl border p-4 transition-all duration-500",
                    isActive
                      ? "border-cyan-500/25 bg-cyan-500/[0.05] ring-1 ring-cyan-500/10 shadow-lg shadow-cyan-500/5"
                      : isPast
                        ? "border-white/[0.06] bg-white/[0.02] opacity-60"
                        : "border-white/5 bg-transparent opacity-35",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    {/* Step indicator */}
                    <span
                      className={[
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                        isActive
                          ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
                          : isPast
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-white/5 text-slate-600",
                      ].join(" ")}
                    >
                      {isPast ? "✓" : exp.step}
                    </span>

                    {/* Label */}
                    <span
                      className={[
                        "font-semibold text-sm transition-colors duration-300",
                        isActive ? "text-slate-100" : isPast ? "text-slate-400" : "text-slate-600",
                      ].join(" ")}
                    >
                      {exp.label}
                    </span>

                    {/* Command badge */}
                    <span
                      className={[
                        "ml-auto inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs transition-all duration-300",
                        isActive ? bs.active : "border-white/5 bg-white/[0.02] text-slate-700",
                      ].join(" ")}
                    >
                      {exp.badge}
                    </span>
                  </div>

                  {/* Description — expands when active or past */}
                  <p
                    className={[
                      "text-xs leading-relaxed pl-9 transition-all duration-500 overflow-hidden",
                      isActive
                        ? "text-slate-400 max-h-20 opacity-100"
                        : isPast
                          ? "text-slate-600 max-h-20 opacity-50"
                          : "text-transparent max-h-0 opacity-0 pointer-events-none",
                    ].join(" ")}
                  >
                    {exp.description}
                  </p>
                </div>
              );
            })}

            {/* CTA — fades in when animation completes */}
            <div
              className={[
                "mt-2 transition-all duration-700",
                isDone
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none",
              ].join(" ")}
              aria-hidden={!isDone}
            >
              <a
                href="/docs/getting-started"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-cyan-400 glow-cyan"
                tabIndex={isDone ? 0 : -1}
              >
                Try it yourself →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
