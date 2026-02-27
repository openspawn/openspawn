import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTitle } from "../hooks/use-title";

/* ── Expandable "What just happened?" ─────────────────────────────────────── */
function Expandable({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-300 transition hover:text-cyan-400"
      >
        <span
          className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        What just happened?
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-3 text-sm text-slate-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Terminal-style code block ────────────────────────────────────────────── */
function Terminal({
  title,
  children,
}: {
  title?: string;
  children: string;
}) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border border-white/10 bg-[#0d1117] font-mono text-sm">
      {title && (
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2 text-xs text-slate-500">
          <span className="inline-flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </span>
          <span className="ml-1">{title}</span>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 leading-relaxed text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ── Progress indicator ───────────────────────────────────────────────────── */
const STEPS = [
  { num: 1, label: "Install" },
  { num: 2, label: "Init" },
  { num: 3, label: "Configure" },
  { num: 4, label: "Start" },
  { num: 5, label: "Monitor" },
  { num: 6, label: "Ship" },
];

function Progress({ active }: { active: number }) {
  return (
    <div className="mb-12 flex items-center justify-center gap-1 sm:gap-2">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center gap-1 sm:gap-2">
          <a
            href={`#step-${s.num}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition
              ${
                s.num === active
                  ? "bg-cyan-500 text-navy-950"
                  : s.num < active
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-white/5 text-slate-500"
              }`}
          >
            {s.num < active ? "✓" : s.num}
          </a>
          <span className="hidden text-xs text-slate-500 sm:inline">{s.label}</span>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-4 sm:w-8 ${
                s.num < active ? "bg-cyan-500/40" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Intersection observer hook for active step ───────────────────────────── */
function useActiveStep() {
  const [active, setActive] = useState(1);

  // Use a simple scroll-based approach via IntersectionObserver
  // We'll attach it in the component
  return { active, setActive };
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export function GettingStartedPage() {
  useTitle("Getting Started with OpenSpawn");
  const { active, setActive } = useActiveStep();

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Hero */}
      <div className="mx-auto max-w-3xl px-5 pt-24 pb-12 text-center sm:px-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm text-cyan-400">
          <span>⏱</span> 5 minutes from install to running org
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
          Getting Started with OpenSpawn
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-400">
          Install OpenSpawn, create an ORG.md, and boot a multi-agent organization
          on OpenClaw in under 5 minutes.
        </p>
      </div>

      {/* Progress bar */}
      <div className="sticky top-16 z-40 bg-navy-950/90 py-3 backdrop-blur-lg border-b border-white/5">
        <Progress active={active} />
      </div>

      {/* Steps */}
      <div className="mx-auto max-w-3xl px-5 pb-24 sm:px-6">
        {/* Step 1: Install */}
        <StepSection num={1} title="Install" onVisible={setActive}>
          <p className="mb-2 text-slate-400">
            Install OpenSpawn globally, or use <code className="inline-code">npx</code> to
            run without installing. Requires Node.js 18+.
          </p>
          <Terminal title="terminal">
{`$ npm install -g openspawn

added 1 package in 3s

$ openspawn --version
openspawn v0.3.0`}
          </Terminal>
          <p className="text-sm text-slate-500">
            Or skip the global install:{" "}
            <code className="inline-code">npx openspawn</code> works everywhere.
          </p>
          <Expandable>
            <p>
              OpenSpawn is a single npm package that includes the CLI, the org parser,
              the agent runtime, and the dashboard. It connects to OpenClaw for agent
              execution — your agents run in sandboxed containers, not on your machine.
            </p>
          </Expandable>
        </StepSection>

        {/* Step 2: Init */}
        <StepSection num={2} title="Init" onVisible={setActive}>
          <p className="mb-2 text-slate-400">
            Scaffold a new org. The interactive wizard asks a few questions and picks
            a template that matches your use case.
          </p>
          <Terminal title="terminal">
{`$ openspawn init my-org

🪸 OpenSpawn — Create a new org

? What kind of org? (Use arrow keys)
❯ Dev Shop — engineering team with leads + workers
  Content Agency — writers, editors, designers
  Research Lab — analysts + synthesizer
  Assistant Team — general-purpose agent pool
  Custom — start from scratch

? Org name: my-org
? Primary model provider: OpenRouter

✓ Created my-org/ORG.md
✓ Created my-org/openspawn.config.json

  cd my-org && openspawn start`}
          </Terminal>
          <Expandable>
            <p>
              <code className="inline-code">openspawn init</code> creates two files:
              <strong className="text-slate-200"> ORG.md</strong> (your org definition — agents, hierarchy, 
              culture, policies) and <strong className="text-slate-200">openspawn.config.json</strong> (server 
              settings, API keys, port). The template pre-fills sensible defaults — you can edit everything later.
            </p>
          </Expandable>
          <div className="mt-3">
            <Link
              to="/docs/templates"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              Browse all templates →
            </Link>
          </div>
        </StepSection>

        {/* Step 3: Configure */}
        <StepSection num={3} title="Configure" onVisible={setActive}>
          <p className="mb-2 text-slate-400">
            Open the generated ORG.md. This single file defines your entire agent
            organization — hierarchy, roles, models, and policies.
          </p>
          <Terminal title="my-org/ORG.md">
{`# My Org

## Identity
A fast-moving dev team. We ship code.
- **Industry:** Technology
- **Stage:** Early

## Culture
preset: startup

## Structure

### COO
Receives tasks, delegates to leads, ensures nothing falls through.
- **Model:** claude-sonnet
- **Domain:** operations

### Engineering
#### Engineering Lead
Triages technical work. Breaks projects into tasks.
- **Model:** claude-haiku
- **Domain:** engineering

#### Workers
Write code, run tests, build APIs.
- **Model:** ollama/qwen2.5
- **Domain:** backend
- **Count:** 2

## Policies
### Budget
- **Per-agent limit:** 500 credits/period
- **Alert threshold:** 80%
- **Period:** daily`}
          </Terminal>
          <p className="text-sm text-slate-400">
            Heading levels define the hierarchy. Prose descriptions become agent system
            prompts. <code className="inline-code">Count: 2</code> spawns multiple workers
            with the same role.
          </p>
          <Expandable>
            <p>
              ORG.md is infrastructure-as-code for agent organizations. The parser reads
              markdown headings to build a hierarchy tree — H3 roles are top-level, H4
              roles report to the H3 above. Each agent's description, model, domain, and
              constraints are extracted and injected into their runtime context.
              Culture presets (like <code className="inline-code">startup</code>) configure
              communication defaults: escalation thresholds, update frequency, and routing rules.
            </p>
          </Expandable>
          <div className="mt-3">
            <Link
              to="/docs/reference/org-md-reference"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              Full ORG.md reference →
            </Link>
          </div>
        </StepSection>

        {/* Step 4: Start */}
        <StepSection num={4} title="Start" onVisible={setActive}>
          <p className="mb-2 text-slate-400">
            Boot your org on OpenClaw. Agents spawn in sandboxed containers and start
            listening for tasks immediately.
          </p>
          <Terminal title="terminal">
{`$ cd my-org
$ openspawn start

🚀 OpenSpawn starting...
   Parsing ORG.md...
   ✓ Found 5 agents (1 COO, 1 Lead, 2 Workers, 1 Observer)
   ✓ Applied culture: startup
   ✓ Loaded policies: budget limits, routing rules
   Spawning agents on OpenClaw...
   ✓ COO .................. claude-sonnet   L10  operations
   ✓ Engineering Lead ..... claude-haiku    L7   engineering
   ✓ Worker 1 ............. ollama/qwen2.5  L4   backend
   ✓ Worker 2 ............. ollama/qwen2.5  L4   backend

   Dashboard:  http://localhost:3333/app/
   A2A:        http://localhost:3333/.well-known/agent.json
   MCP:        http://localhost:3333/mcp`}
          </Terminal>
          <Expandable>
            <p>
              <code className="inline-code">openspawn start</code> does three things:
              (1) parses ORG.md into an agent graph, (2) connects to OpenClaw and spawns
              each agent in its own sandboxed container with the right model and context,
              (3) starts a local server with the dashboard, A2A endpoint, and MCP tool server.
              Agents immediately begin a tick-based execution loop — checking their inbox,
              deciding what to do, and acting.
            </p>
          </Expandable>
          <div className="mt-3">
            <Link
              to="/docs/how-it-works"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              How the runtime works →
            </Link>
          </div>
        </StepSection>

        {/* Step 5: Monitor */}
        <StepSection num={5} title="Monitor" onVisible={setActive}>
          <p className="mb-2 text-slate-400">
            Check on your org from the CLI or open the real-time dashboard to see
            agents working, tasks flowing, and escalations happening.
          </p>
          <Terminal title="terminal">
{`$ openspawn status

┌─────────────────────┬──────────┬───────┬──────────┐
│ Agent               │ Status   │ Trust │ Tasks    │
├─────────────────────┼──────────┼───────┼──────────┤
│ COO                 │ idle     │ 72    │ 3 done   │
│ Engineering Lead    │ working  │ 58    │ 2 active │
│ Worker 1            │ working  │ 35    │ 1 active │
│ Worker 2            │ idle     │ 31    │ 1 done   │
└─────────────────────┴──────────┴───────┴──────────┘

Health: 84/100  |  Tasks: 4 total, 2 active, 2 done

$ openspawn dashboard
Opening http://localhost:3333/app/ ...`}
          </Terminal>
          <p className="text-sm text-slate-400">
            The dashboard shows a live network graph, task timeline, trust scores,
            and budget usage — all updating in real time via SSE.
          </p>
          <Expandable>
            <p>
              <code className="inline-code">openspawn status</code> gives you a snapshot
              of every agent's state, trust score, and task count.
              <code className="inline-code"> openspawn dashboard</code> opens the web UI
              where you can watch the org graph animate as tasks flow through the hierarchy.
              Trust scores start at 30 (PROBATION) and rise with successful completions.
              The health score is a composite of ack latency, escalation rate, completion
              rate, and budget utilization.
            </p>
          </Expandable>
          <div className="mt-3">
            <Link
              to="/docs/guides/dashboard-guide"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              Dashboard guide →
            </Link>
          </div>
        </StepSection>

        {/* Step 6: Ship */}
        <StepSection num={6} title="Ship" onVisible={setActive}>
          <p className="mb-2 text-slate-400">
            When you're done, archive the org. Results are collected, agents wind
            down gracefully, and you get a summary of everything that happened.
          </p>
          <Terminal title="terminal">
{`$ openspawn done

🏁 Winding down org "my-org"...
   Waiting for 2 in-flight tasks to complete...
   ✓ All tasks resolved

   Summary:
   ├── Tasks completed:  7
   ├── Escalations:      1 (resolved)
   ├── Total cost:       $0.42
   ├── Runtime:          23m 14s
   └── Artifacts:        ./output/

   Archive saved to: ./my-org-archive-2026-02-26.tar.gz

Done. Results are in ./output/`}
          </Terminal>
          <Expandable>
            <p>
              <code className="inline-code">openspawn done</code> initiates a graceful shutdown.
              In-flight tasks are given time to complete (configurable timeout). The system
              collects all artifacts, task results, and communication logs into an archive.
              Agent containers on OpenClaw are cleaned up. The archive includes everything
              needed to reproduce or audit the run.
            </p>
          </Expandable>
        </StepSection>

        {/* CTA */}
        <div className="mt-20 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-8 text-center sm:p-12">
          <h2 className="mb-3 text-2xl font-bold text-slate-100 sm:text-3xl">
            Ready to graduate from sub-agents?
          </h2>
          <p className="mx-auto mb-6 max-w-lg text-slate-400">
            Sub-agents are great for simple tasks. But when you need a full team —
            with hierarchy, delegation, escalation, and accountability — you need
            an org.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Terminal title="terminal">
{`$ npx openspawn init my-org`}
            </Terminal>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              to="/docs/tutorials/your-first-org-md"
              className="rounded-lg bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-cyan-400"
            >
              Full tutorial
            </Link>
            <Link
              to="/docs"
              className="rounded-lg border border-white/10 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
            >
              Browse docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Step section wrapper with scroll detection ───────────────────────────── */
function StepSection({
  num,
  title,
  onVisible,
  children,
}: {
  num: number;
  title: string;
  onVisible: (n: number) => void;
  children: React.ReactNode;
}) {
  const ref = useIntersectionStep(num, onVisible);

  return (
    <section
      id={`step-${num}`}
      ref={ref}
      className="scroll-mt-32 py-10 border-b border-white/5 last:border-0"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-bold text-cyan-400">
          {num}
        </span>
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ── Intersection observer hook ───────────────────────────────────────────── */
import { useEffect, useRef } from "react";

function useIntersectionStep(
  num: number,
  onVisible: (n: number) => void,
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(num);
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [num, onVisible]);

  return ref;
}
