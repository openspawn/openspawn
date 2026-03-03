import { useState, useEffect, useRef } from "react";
import { TerminalDemo } from "../components/terminal-demo";
import { FeatureCard } from "../components/feature-card";
import { ProtocolBadge } from "../components/protocol-badge";
import { Button } from "../components/button";
import {
  DeviceOrchestrationIllustration,
  AgentCommunicationIllustration,
  ProtocolNativeIllustration,
  ModelRouterIllustration,
  DashboardIllustration,
  ZeroConfigCliIllustration,
} from "../components/illustrations";

// ─── Feature grid data ──────────────────────────────────────────────────────
const features = [
  {
    category: "REAL-WORLD",
    badgeColor: "cyan" as const,
    emoji: "📱",
    illustration: DeviceOrchestrationIllustration,
    title: "Device & Node Orchestration",
    description:
      "Give your agents eyes, ears, and hands. Control phones, cameras, screens, and IoT devices from your agent org — no competitor does this.",
    color: "text-cyan-400",
  },
  {
    category: "PROTOCOL",
    badgeColor: "violet" as const,
    emoji: "🔗",
    illustration: AgentCommunicationIllustration,
    title: "A2A Protocol",
    description:
      "Coordinate agents across services without brittle custom APIs. Native Agent-to-Agent protocol with streaming, task queues, and per-agent discovery cards.",
    color: "text-violet-400",
    href: "/docs/protocols/a2a",
  },
  {
    category: "PROTOCOL",
    badgeColor: "violet" as const,
    emoji: "🔌",
    illustration: ProtocolNativeIllustration,
    title: "MCP Tools",
    description:
      "Connect your agents to Claude Desktop, Cursor, or any MCP client instantly. 7 tools via Streamable HTTP — your agents become MCP servers.",
    color: "text-violet-400",
    href: "/docs/protocols/mcp",
  },
  {
    category: "INTELLIGENCE",
    badgeColor: "emerald" as const,
    emoji: "🔀",
    illustration: ModelRouterIllustration,
    title: "Model Router",
    description:
      "Route to the right model automatically. Local-first with Ollama, cloud when needed. Fallback chains and per-task cost tracking built in.",
    color: "text-emerald-400",
    href: "/docs/features/model-router",
  },
  {
    category: "VISIBILITY",
    badgeColor: "amber" as const,
    emoji: "📊",
    illustration: DashboardIllustration,
    title: "Live Dashboard",
    description:
      "See exactly what your agents are doing in real-time. Network graph, task timeline, cost charts — watch your org breathe.",
    color: "text-amber-400",
    href: "/docs/features/dashboard",
  },
  {
    category: "DEVELOPER",
    badgeColor: "slate" as const,
    emoji: "💻",
    illustration: ZeroConfigCliIllustration,
    title: "Zero-Config CLI",
    description:
      "Go from zero to a running agent org in under 30 seconds. Scaffold, start, and deploy with a single command.",
    color: "text-slate-300",
    href: "/docs/getting-started",
  },
];

// ─── Integrations / ecosystem ────────────────────────────────────────────────
const ecosystemItems = [
  { name: "OpenClaw", highlight: true },
  { name: "CrewAI" },
  { name: "LangGraph" },
  { name: "AutoGen" },
  { name: "Claude Desktop" },
  { name: "Custom" },
];

// ─── Industry scenarios — enhanced with mini-orgmd & agent metadata ───────────
const industryScenarios = [
  {
    emoji: "🚀",
    title: "SaaS Onboarding",
    pain: "2–3 days per customer across 4 teams",
    template: "saas-onboarding",
    color: "cyan",
    agentCount: 4,
    setupMin: 15,
    miniOrgMd: [
      "### Onboarding Lead (L7)",
      "#### Data Migration Specialist (L5)",
      "#### Integration Engineer (L5)",
      "#### Success Agent (L4)",
    ],
    agentList: [
      { name: "Onboarding Lead", level: "L7", model: "claude-sonnet" },
      { name: "Data Migration Specialist", level: "L5", model: "claude-haiku" },
      { name: "Integration Engineer", level: "L5", model: "claude-haiku" },
      { name: "Success Agent", level: "L4", model: "qwen2.5" },
    ],
  },
  {
    emoji: "🚨",
    title: "DevOps Incident Response",
    pain: "3am pages, 45-min MTTR, 6 tools",
    template: "incident-response",
    color: "rose",
    agentCount: 3,
    setupMin: 10,
    miniOrgMd: [
      "### Incident Commander (L7)",
      "#### Diagnostics Agent (L5)",
      "#### Remediation Agent (L5)",
    ],
    agentList: [
      { name: "Incident Commander", level: "L7", model: "claude-sonnet" },
      { name: "Diagnostics Agent", level: "L5", model: "claude-haiku" },
      { name: "Remediation Agent", level: "L5", model: "claude-haiku" },
    ],
  },
  {
    emoji: "⚖️",
    title: "Legal Contract Review",
    pain: "Junior associates spend 80+ hrs/week on manual review",
    template: "contract-review",
    color: "violet",
    agentCount: 4,
    setupMin: 20,
    miniOrgMd: [
      "### Senior Counsel Agent (L7)",
      "#### Risk Analyzer (L5)",
      "#### Clause Extractor (L5)",
      "#### Summary Writer (L4)",
    ],
    agentList: [
      { name: "Senior Counsel Agent", level: "L7", model: "claude-opus" },
      { name: "Risk Analyzer", level: "L5", model: "claude-sonnet" },
      { name: "Clause Extractor", level: "L5", model: "claude-haiku" },
      { name: "Summary Writer", level: "L4", model: "claude-haiku" },
    ],
  },
  {
    emoji: "🏦",
    title: "Fintech Compliance",
    pain: "Manual transaction monitoring misses 15% of anomalies",
    template: "compliance-monitoring",
    color: "emerald",
    agentCount: 3,
    setupMin: 12,
    miniOrgMd: [
      "### Compliance Officer (L7)",
      "#### Transaction Monitor (L5)",
      "#### Audit Reporter (L4)",
    ],
    agentList: [
      { name: "Compliance Officer", level: "L7", model: "claude-sonnet" },
      { name: "Transaction Monitor", level: "L5", model: "claude-haiku" },
      { name: "Audit Reporter", level: "L4", model: "qwen2.5" },
    ],
  },
  {
    emoji: "🎮",
    title: "Gaming Live Ops",
    pain: "Player churn from stale content and unbalanced economy",
    template: "game-live-ops",
    color: "amber",
    agentCount: 4,
    setupMin: 18,
    miniOrgMd: [
      "### Live Ops Director (L7)",
      "#### Economy Balancer (L5)",
      "#### Content Curator (L5)",
      "#### Churn Predictor (L4)",
    ],
    agentList: [
      { name: "Live Ops Director", level: "L7", model: "claude-sonnet" },
      { name: "Economy Balancer", level: "L5", model: "claude-haiku" },
      { name: "Content Curator", level: "L5", model: "claude-haiku" },
      { name: "Churn Predictor", level: "L4", model: "qwen2.5" },
    ],
  },
  {
    emoji: "🛒",
    title: "E-commerce Catalog",
    pain: "10,000 SKUs, daily price changes, stale descriptions",
    template: "catalog-management",
    color: "slate",
    agentCount: 3,
    setupMin: 10,
    miniOrgMd: [
      "### Catalog Manager (L7)",
      "#### Price Monitor (L5)",
      "#### Content Agent (L5)",
    ],
    agentList: [
      { name: "Catalog Manager", level: "L7", model: "claude-sonnet" },
      { name: "Price Monitor", level: "L5", model: "claude-haiku" },
      { name: "Content Agent", level: "L5", model: "claude-haiku" },
    ],
  },
];

// ─── Early adopters ───────────────────────────────────────────────────────────
const earlyAdopters = [
  { name: "OpenClaw", emoji: "🦞" },
  { name: "SaaS Teams", emoji: "🚀" },
  { name: "Internal Labs", emoji: "🔬" },
  { name: "Indie Builders", emoji: "🛠️" },
];

// ─── ORG.md snippets ──────────────────────────────────────────────────────────
const orgMdSaasLines = [
  "# customer-onboarding",
  "> Mission: Onboard new enterprise customers end-to-end",
  "",
  "## Culture",
  "- Preset: professional",
  "- Escalation: 30 min — customers can't wait",
  "",
  "## Structure",
  "",
  "### Onboarding Lead (level 7)",
  "Owns the entire customer journey from contract to go-live.",
  "- Model: claude-sonnet",
  "",
  "#### Data Migration Specialist (level 5)",
  "Moves and validates customer data from legacy systems.",
  "- Model: claude-haiku",
  "",
  "#### Integration Engineer (level 5)",
  "Configures API connectors and runs integration tests.",
  "- Model: claude-haiku",
  "",
  "#### Success Agent (level 4)",
  "Schedules check-ins, collects feedback, flags churn risk.",
  "- Model: ollama/qwen2.5",
];

const orgMdSaasSnippet = orgMdSaasLines.join("\n");

const orgMdPivotSnippet = `# 🪸 MyOrg

## Structure
- 🔬 Research (lead: Analyst, model: opus)
  - Scout (discovery), Archivist (memory)
- 🛠️ Engineering (lead: Architect)
  - Builder (impl), Reviewer (quality)

## Policies
- L7+ agents: event-driven (Opus)
- L1-6: polling (Sonnet, budget-capped)
- All PRs require peer review`;

const openclawJsonSnippet = `{
  "agents": {
    "list": [
      { "id": "onboarding-lead", "model": "sonnet" },
      { "id": "data-migration",  "model": "haiku"  },
      { "id": "integration-eng", "model": "haiku"  },
      { "id": "success-agent",   "model": "qwen2.5" }
    ]
  },
  "tools": {
    "agentToAgent": { "enabled": true }
  }
}`;

// ─── Syntax coloring for ORG.md lines ────────────────────────────────────────
function colorizeOrgMdLine(line: string) {
  if (line === "") return <span>&nbsp;</span>;
  if (line.startsWith("# ")) {
    return <span className="text-cyan-300 font-bold">{line}</span>;
  }
  if (line.startsWith("> ")) {
    return <span className="italic text-violet-300 opacity-90">{line}</span>;
  }
  if (line.startsWith("## ")) {
    return <span className="text-violet-400 font-semibold">{line}</span>;
  }
  if (line.startsWith("### ")) {
    return <span className="text-slate-100 font-semibold">{line}</span>;
  }
  if (line.startsWith("#### ")) {
    return <span className="text-slate-300">{line}</span>;
  }
  if (line.includes("Model:") || line.includes("model:")) {
    const key = line.includes("Model:") ? "Model:" : "model:";
    const idx = line.indexOf(key);
    return (
      <span>
        <span className="text-slate-500">{line.slice(0, idx)}</span>
        <span className="text-amber-400">{key}</span>
        <span className="text-emerald-400">{line.slice(idx + key.length)}</span>
      </span>
    );
  }
  if (line.startsWith("- ")) {
    return <span className="text-slate-400">{line}</span>;
  }
  return <span className="text-slate-500">{line}</span>;
}

// ─── ORG.md Live Preview component ───────────────────────────────────────────
function OrgMdLivePreview() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("orgmd-active");
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const agents = [
    {
      emoji: "🎯",
      name: "Onboarding Lead",
      level: "L7",
      model: "claude-sonnet",
      status: "active" as const,
      task: "Reviewing customer requirements doc",
    },
    {
      emoji: "📦",
      name: "Data Migration",
      level: "L5",
      model: "claude-haiku",
      status: "active" as const,
      task: "Importing 3,847 records — 68% done",
    },
    {
      emoji: "🔗",
      name: "Integration Eng",
      level: "L5",
      model: "claude-haiku",
      status: "working" as const,
      task: "Configuring CRM webhook endpoints",
    },
    {
      emoji: "✉️",
      name: "Success Agent",
      level: "L4",
      model: "qwen2.5",
      status: "queued" as const,
      task: "Queued: schedule Day-7 check-in",
    },
  ];

  // Lines appear at 0.05 + i * 0.09s each — last line ~2.2s
  // Agents appear starting at 2.4s
  const agentBaseDelay = 2.4;

  return (
    <div
      ref={sectionRef}
      className="orgmd-preview grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start"
    >
      {/* ── Left: ORG.md "being written" ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-cyan-500/30 bg-navy-900/90 ring-1 ring-cyan-500/10 shadow-[0_0_40px_rgba(6,182,212,0.06)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-cyan-500/[0.04] px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="ml-2 flex-1 font-mono text-xs font-semibold text-cyan-400">
            ORG.md
          </span>
          <span className="orgmd-cursor font-mono text-sm text-cyan-400/80">█</span>
          <span className="ml-2 text-xs text-slate-600">source of truth</span>
        </div>

        {/* Code with staggered line reveal */}
        <pre className="overflow-x-auto p-4 font-mono text-[0.72rem] leading-relaxed text-slate-300">
          {orgMdSaasLines.map((line, i) => (
            <span
              key={i}
              className="code-line"
              style={{ animationDelay: `${0.05 + i * 0.09}s` }}
            >
              {colorizeOrgMdLine(line)}
            </span>
          ))}
        </pre>
      </div>

      {/* ── Right: Running org visualization ──────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Status header */}
        <div className="agent-card-anim flex items-center gap-2" style={{ animationDelay: `${agentBaseDelay - 0.2}s` }}>
          <span className="live-dot h-2 w-2 rounded-full bg-emerald-400 inline-block" />
          <span className="text-xs font-semibold text-emerald-400">
            Live Org — customer-onboarding
          </span>
          <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[0.65rem] text-slate-500">
            openspawn start ✓
          </span>
        </div>

        {/* Agent cards */}
        {agents.map((agent, i) => (
          <div
            key={agent.name}
            className={`agent-card-anim relative overflow-hidden rounded-xl border px-4 py-3 transition-all duration-200 ${
              agent.status === "active"
                ? "border-emerald-500/25 bg-emerald-500/[0.04] agent-pulse"
                : agent.status === "working"
                ? "border-cyan-500/20 bg-cyan-500/[0.03]"
                : "border-white/[0.06] bg-white/[0.02]"
            }`}
            style={{ animationDelay: `${agentBaseDelay + i * 0.32}s` }}
          >
            {/* Active indicator bar */}
            {(agent.status === "active" || agent.status === "working") && (
              <div
                className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${
                  agent.status === "active" ? "bg-emerald-400" : "bg-cyan-400"
                }`}
              />
            )}

            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">{agent.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">
                    {agent.name}
                  </span>
                  <span className="font-mono text-[0.65rem] text-slate-600">
                    {agent.level}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[0.72rem] text-slate-500">
                  {agent.task}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`text-[0.65rem] font-semibold ${
                    agent.status === "active"
                      ? "text-emerald-400"
                      : agent.status === "working"
                      ? "text-cyan-400"
                      : "text-slate-600"
                  }`}
                >
                  {agent.status === "active"
                    ? "● active"
                    : agent.status === "working"
                    ? "◎ working"
                    : "○ queued"}
                </span>
                <span className="font-mono text-[0.6rem] text-slate-700">
                  {agent.model}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Live metrics */}
        <div
          className="agent-card-anim grid grid-cols-3 gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
          style={{ animationDelay: `${agentBaseDelay + 4 * 0.32}s` }}
        >
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-400">4</div>
            <div className="mt-0.5 text-[0.65rem] text-slate-600">agents</div>
          </div>
          <div className="border-x border-white/[0.05] text-center">
            <div className="text-xl font-bold text-emerald-400">3</div>
            <div className="mt-0.5 text-[0.65rem] text-slate-600">tasks live</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-400">$0.47</div>
            <div className="mt-0.5 text-[0.65rem] text-slate-600">cost so far</div>
          </div>
        </div>

        {/* Task flow indicator */}
        <div
          className="agent-card-anim flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
          style={{ animationDelay: `${agentBaseDelay + 5 * 0.32}s` }}
        >
          <span className="text-[0.65rem] text-slate-600">Task flow:</span>
          <div className="flex items-center gap-1 font-mono text-[0.65rem]">
            <span className="text-slate-400">Lead</span>
            <span className="task-arrow text-cyan-500/60">→</span>
            <span className="text-slate-400">Migration</span>
            <span className="task-arrow text-cyan-500/60" style={{ animationDelay: "0.3s" }}>→</span>
            <span className="text-slate-400">Eng</span>
            <span className="task-arrow text-cyan-500/60" style={{ animationDelay: "0.6s" }}>→</span>
            <span className="text-slate-400">Success</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tagline word reveal helper ───────────────────────────────────────────────
function TaglineWords({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="tagline-word" style={{ animationDelay: `${0.05 + i * 0.12}s` }}>
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Industry scenario color map ──────────────────────────────────────────────
const scenarioColorMap: Record<string, { border: string; bg: string; text: string; dot: string; tag: string }> = {
  cyan:    { border: "border-cyan-500/20",    bg: "bg-cyan-500/[0.05]",    text: "text-cyan-400",    dot: "bg-cyan-400",    tag: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  rose:    { border: "border-rose-500/20",    bg: "bg-rose-500/[0.05]",    text: "text-rose-400",    dot: "bg-rose-400",    tag: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  violet:  { border: "border-violet-500/20",  bg: "bg-violet-500/[0.05]",  text: "text-violet-400",  dot: "bg-violet-400",  tag: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.05]", text: "text-emerald-400", dot: "bg-emerald-400", tag: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  amber:   { border: "border-amber-500/20",   bg: "bg-amber-500/[0.05]",   text: "text-amber-400",   dot: "bg-amber-400",   tag: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  slate:   { border: "border-white/10",       bg: "bg-white/[0.03]",       text: "text-slate-300",   dot: "bg-slate-400",   tag: "bg-white/5 text-slate-400 border-white/10" },
};

// ─── How It Works visual panels ───────────────────────────────────────────────
function HiwStepFile() {
  return (
    <div className="hiw-panel">
      <div style={{ position: "relative" }}>
        <div className="hiw-file">
          <div className="hiw-file-line cyan" style={{ width: "85%" }} />
          <div className="hiw-file-line violet" style={{ width: "65%" }} />
          <div className="hiw-file-line dim" style={{ width: "55%" }} />
          <div className="hiw-file-line cyan" style={{ width: "75%" }} />
          <div className="hiw-file-line dim" style={{ width: "45%" }} />
          <div className="hiw-file-line violet" style={{ width: "60%" }} />
          <div className="hiw-file-line dim" style={{ width: "50%" }} />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-0.5rem",
            right: "-2.5rem",
            fontFamily: "var(--os-font-mono)",
            fontSize: "0.6rem",
            color: "rgba(34,211,238,0.7)",
            whiteSpace: "nowrap",
          }}
        >
          ORG.md ✓
        </div>
      </div>
    </div>
  );
}

function HiwStepTerminal() {
  return (
    <div className="hiw-panel">
      <div className="hiw-terminal">
        <div className="hiw-terminal-header">
          <div className="hiw-terminal-dot" style={{ background: "#ef4444aa" }} />
          <div className="hiw-terminal-dot" style={{ background: "#eab308aa" }} />
          <div className="hiw-terminal-dot" style={{ background: "#22c55eaa" }} />
        </div>
        <div className="hiw-terminal-body">
          <div style={{ color: "rgba(148,163,184,0.7)" }}>$ openspawn start</div>
          <div style={{ color: "rgba(52,211,153,0.9)" }}>▶ Spawning agents...</div>
          <div style={{ color: "rgba(34,211,238,0.9)" }}>✓ 4 agents ready</div>
          <div style={{ color: "rgba(167,139,250,0.8)" }}>📊 Dashboard: :3333</div>
          <div style={{ color: "rgba(148,163,184,0.5)" }}>
            <span style={{ color: "rgba(34,211,238,0.7)" }}>▊</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HiwStepAgents() {
  return (
    <div className="hiw-panel">
      <div className="hiw-agents">
        <div className="hiw-agent-row">
          <div className="hiw-agent-dot" style={{ background: "#34d399" }} />
          <span style={{ color: "rgba(203,213,225,0.9)" }}>🎯 Onboarding Lead</span>
          <span style={{ marginLeft: "auto", color: "rgba(52,211,153,0.8)", fontSize: "0.55rem" }}>● active</span>
        </div>
        <div className="hiw-agent-row">
          <div className="hiw-agent-dot" style={{ background: "#22d3ee" }} />
          <span>📦 Data Migration</span>
          <span style={{ marginLeft: "auto", color: "rgba(34,211,238,0.8)", fontSize: "0.55rem" }}>◎ working</span>
        </div>
        <div className="hiw-agent-row">
          <div className="hiw-agent-dot" style={{ background: "#22d3ee" }} />
          <span>🔗 Integration Eng</span>
          <span style={{ marginLeft: "auto", color: "rgba(34,211,238,0.8)", fontSize: "0.55rem" }}>◎ working</span>
        </div>
        <div className="hiw-agent-row" style={{ opacity: 0.6 }}>
          <div className="hiw-agent-dot" style={{ background: "#64748b" }} />
          <span>✉️ Success Agent</span>
          <span style={{ marginLeft: "auto", color: "rgba(100,116,139,0.8)", fontSize: "0.55rem" }}>○ queued</span>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const [agentCount, setAgentCount] = useState(22);
  const [stars, setStars] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useScrollReveal();

  useEffect(() => {
    fetch("https://api.github.com/repos/openspawn/openspawn")
      .then((r) => r.json())
      .then((d) => { if (d.stargazers_count) setStars(d.stargazers_count); })
      .catch(() => {});
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx openspawn init my-org");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="px-5 sm:px-6">

      {/* ── Social proof bar ───────────────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-navy-950/60 py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400 font-semibold">{stars ? `⭐ ${stars.toLocaleString()}` : "⭐ Stars"}</span>
            on GitHub
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="flex items-center gap-1.5">
            <span className="text-violet-400 font-semibold">🤖 {agentCount}+</span>
            agents running live
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">🏢 6</span>
            industry templates
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">📦 MIT</span>
            open source
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="grain-overlay relative overflow-hidden pb-24 pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="orb-drift absolute left-1/2 top-0 -translate-x-1/2 h-[700px] w-[900px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(6,182,212,0.07) 0%, transparent 70%)" }}
          />
          <div
            className="orb-drift-alt absolute right-0 top-32 h-[500px] w-[500px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
          />
          <div
            className="orb-drift absolute -left-20 bottom-0 h-[400px] w-[400px]"
            style={{ background: "radial-gradient(ellipse at center, rgba(245,158,11,0.04) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up mb-6">
            <span className="coral-float text-6xl md:text-8xl" role="img" aria-label="coral">🪸</span>
          </div>

          <div className="animate-fade-in-up animate-delay-100 mb-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block" />
              Persistent Agent Organizations
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300">
              🧩 Adds structure to any agent
            </span>
          </div>

          <h1 className="animate-fade-in-up animate-delay-100 mb-5 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-8xl">
            <span className="gradient-text-animated">OpenSpawn</span>
          </h1>

          <p className="mb-3 text-2xl font-bold text-slate-100 md:text-3xl lg:text-4xl leading-tight tracking-tight">
            <TaglineWords text="Your agents remember. Your org endures." />
          </p>

          <p className="animate-fade-in-up animate-delay-300 mx-auto mb-10 max-w-xl text-base text-slate-400 md:text-lg leading-relaxed">
            Your agents are powerful. OpenSpawn gives them structure — persistent memory,
            hierarchy, budgets, and governance that compound across sessions.{" "}
            <span className="text-slate-300">Add an org chart to any agent stack.</span>
          </p>

          <div className="animate-fade-in-up animate-delay-400 mb-10 flex flex-wrap items-center justify-center gap-4">
            <Button as="a" href="/docs/getting-started" variant="primary" size="lg" className="glow-cyan">
              Get Started →
            </Button>
            <Button as="a" href="/templates" variant="neutral" size="lg">
              🏭 Browse Industry Templates →
            </Button>
          </div>

          <div className="animate-fade-in-up animate-delay-500 mb-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <ProtocolBadge label="A2A Protocol" />
            <ProtocolBadge label="MCP" />
            <ProtocolBadge label="Model Router" />
            <ProtocolBadge label="Device Nodes" />
          </div>
          <div className="animate-fade-in-up animate-delay-500 mb-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <ProtocolBadge label="TypeScript" variant="core" />
            <ProtocolBadge label="Python" variant="core" />
          </div>

          <div className="animate-fade-in-up animate-delay-600 mb-16">
            <div className="install-cmd group relative mx-auto inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-mono text-sm text-slate-300 hover:border-white/20 hover:bg-white/[0.08] transition-colors duration-200">
              <span className="text-cyan-500/60 select-none">$</span>
              <span>npx openspawn init my-org</span>
              <button
                type="button"
                className="ml-1 rounded p-1 text-slate-500 transition-all duration-150 hover:bg-white/10 hover:text-cyan-400"
                onClick={handleCopy}
                aria-label="Copy to clipboard"
              >
                {copied ? (
                  <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="animate-fade-in-up animate-delay-600">
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          ORG.MD LIVE PREVIEW — "One file. Your entire agent organization."
          ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="org-md-hero" className="section-py-lg">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-10">
            <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4">
              ORG.md
            </span>
            <h2 id="org-md-hero" className="text-3xl font-extrabold text-slate-100 md:text-4xl lg:text-5xl tracking-tight">
              One file.{" "}
              <span className="gradient-text">Your entire agent organization.</span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-slate-400 leading-relaxed">
              Write a markdown file. OpenSpawn reads it, spawns the agents, and keeps them
              coordinated — live. Watch the file become a running org.
            </p>
          </div>

          {/* Live preview — side by side */}
          <div className="reveal">
            <OrgMdLivePreview />
          </div>

          {/* Bottom result strip */}
          <div className="reveal mt-6 overflow-hidden rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04]">
            <div className="flex items-center gap-3 border-b border-white/[0.05] px-5 py-2.5">
              <span className="text-xs font-semibold text-emerald-400">✓ 24 hours later — Results</span>
              <span className="ml-auto text-xs text-slate-600">customer-onboarding · run #1</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 px-5 py-3">
              {[
                { icon: "✅", text: "Customer data migrated (3,847 records)" },
                { icon: "✅", text: "CRM integration tested & configured" },
                { icon: "✅", text: "Slack workspace provisioned" },
                { icon: "✅", text: "Day-7 success check-in scheduled" },
                { icon: "📊", text: "Total cost: $1.24 · Time: 6h 12m · Saved: 41 hours" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal mt-8 text-center">
            <a href="/org-md" className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              Learn about ORG.md →
            </a>
            <span className="mx-4 text-slate-700">·</span>
            <a href="/templates" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors">
              Browse templates →
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          INDUSTRY SCENARIOS — Enhanced with mini-ORG.md + hover expand
          ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="industry-scenarios" className="section-py-lg">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-10">
            <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
              Industry Scenarios
            </span>
            <h2 id="industry-scenarios" className="text-3xl font-bold text-slate-100 md:text-4xl">
              Real workflows. Real teams.{" "}
              <span className="gradient-text">One ORG.md each.</span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-slate-400">
              Every scenario ships as a ready-to-use ORG.md template. Pick one, customize it,
              and have a working agent org in minutes.
            </p>
          </div>

          <div className="reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industryScenarios.map((scenario) => {
              const c = scenarioColorMap[scenario.color];
              return (
                <div
                  key={scenario.title}
                  className={`reveal scenario-card-wrap group rounded-xl border ${c.border} ${c.bg} p-5 cursor-default`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-3xl">{scenario.emoji}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold ${c.tag}`}>
                      {scenario.agentCount} agents · {scenario.setupMin} min setup
                    </span>
                  </div>

                  {/* Title + pain */}
                  <h3 className={`mb-1 font-bold ${c.text}`}>{scenario.title}</h3>
                  <p className="mb-3 text-xs text-slate-500 leading-relaxed">{scenario.pain}</p>

                  {/* Mini ORG.md preview — always visible */}
                  <div className="mini-orgmd mb-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                    {scenario.miniOrgMd.map((line, i) => (
                      <div key={i} className={`${
                        line.startsWith("### ") ? `font-semibold ${c.text} opacity-90` :
                        line.startsWith("#### ") ? "text-slate-400 pl-2" : "text-slate-500"
                      }`}>
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* Hover-expand: full agent list */}
                  <div className="scenario-expand">
                    <div className="mb-3 space-y-1">
                      {scenario.agentList.map((agent, i) => (
                        <div key={i} className="flex items-center gap-2 text-[0.68rem] text-slate-500">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`} />
                          <span className="text-slate-400 font-medium">{agent.name}</span>
                          <span className="ml-auto font-mono text-slate-600">{agent.level} · {agent.model}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <a
                    href={`/templates#${scenario.template}`}
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${c.text} opacity-70 hover:opacity-100 transition-opacity`}
                  >
                    See ORG.md
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              );
            })}
          </div>

          <div className="reveal mt-8 text-center">
            <a
              href="/templates"
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20"
            >
              View all 7 industry templates →
            </a>
          </div>
        </div>
      </section>

      {/* ── Differentiator callout ─────────────────────────────────────────── */}
      <section className="section-py">
        <div className="mx-auto max-w-5xl">
          <div className="reveal rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.04] p-8 text-center md:p-14">
            <div className="mb-5 flex items-center justify-center gap-3 text-4xl">
              {["📱", "💻", "📷", "🌐"].map((icon, i) => (
                <span
                  key={icon}
                  className="inline-block"
                  style={{ animation: `coralFloat ${4 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }}
                >
                  {icon}
                </span>
              ))}
            </div>
            <h2 className="mb-4 text-3xl font-extrabold text-slate-100 md:text-4xl lg:text-5xl tracking-tight leading-tight">
              Your agents,{" "}
              <span className="gradient-text">your devices,</span>
              <br className="hidden sm:block" />
              {" "}your rules.
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-slate-400 leading-relaxed">
              While other platforms run AI agents in the cloud, OpenSpawn agents can control real phones,
              read live cameras, push to screens, and interact with IoT devices — directly. This is the
              frontier no competitor has crossed.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
              {["Phone cameras", "Desktop screens", "IoT sensors", "Live notifications", "Local models"].map((item) => (
                <span
                  key={item}
                  className="diff-pill flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-navy-950/60 px-4 py-1.5 text-cyan-300 cursor-default"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Early adopters bar ─────────────────────────────────────────────── */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-600">
            Trusted by early adopters
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {earlyAdopters.map((a) => (
              <div key={a.name} className="flex items-center gap-2 text-slate-500 transition-colors duration-200 hover:text-slate-300">
                <span>{a.emoji}</span>
                <span className="text-sm font-medium">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── "Graduate from sub-agents" ────────────────────────────────────── */}
      <section aria-labelledby="why-not-subagents" className="section-py-lg">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-10">
            <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
              Why OpenSpawn
            </span>
            <h2 id="why-not-subagents" className="text-3xl font-bold text-slate-100 md:text-4xl">
              What OpenSpawn <span className="gradient-text">adds</span>
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-slate-400">
              Agent teams are going mainstream. OpenSpawn adds the organizational layer —
              persistence, hierarchy, and governance — so your agents can grow from a sprint
              into a company.
            </p>
          </div>
          <div className="reveal grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <h3 className="font-semibold text-slate-300">Without OpenSpawn</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-rose-500">✗</span> Session-scoped memory</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-rose-500">✗</span> No hierarchy — all agents are equal</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-rose-500">✗</span> No budget tracking or cost caps</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-rose-500">✗</span> No escalation path when things go wrong</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-rose-500">✗</span> No visibility into what agents are actually doing</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-rose-500">✗</span> Org structure lives only in the prompt</li>
              </ul>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6 ring-1 ring-cyan-500/10">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl">🪸</span>
                <h3 className="font-semibold text-cyan-300">OpenSpawn org</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-cyan-400">✓</span> Persistent agents with continuous memory</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-cyan-400">✓</span> 10-level hierarchy — delegation &amp; escalation built in</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-cyan-400">✓</span> Per-agent credit budgets with automatic tracking</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-cyan-400">✓</span> Typed escalation chain of command</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-cyan-400">✓</span> Live dashboard: network graph, task timeline, cost</li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-cyan-400">✓</span> Org structure version-controlled in <code className="font-mono text-xs bg-white/10 px-1 rounded">ORG.md</code></li>
              </ul>
            </div>
          </div>
          <div className="reveal mt-6 text-center">
            <a href="/docs/comparison" className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              Full framework comparison (vs CrewAI, LangGraph)
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── 3 Core Benefits ───────────────────────────────────────────────── */}
      <section aria-labelledby="core-benefits" className="section-py">
        <div className="mx-auto max-w-5xl">
          <div className="reveal text-center mb-10">
            <h2 id="core-benefits" className="text-3xl font-bold text-slate-100 md:text-4xl">
              Three things ephemeral teams can't do
            </h2>
          </div>
          <div className="reveal grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] to-transparent p-6 text-center">
              <div className="mb-3 text-4xl">🧠</div>
              <h3 className="mb-2 font-bold text-slate-100">Persistent Agents</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Your agents run continuously. They remember past tasks, build context over time,
                and improve their trust score with every successful completion.
              </p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-transparent p-6 text-center">
              <div className="mb-3 text-4xl">🏢</div>
              <h3 className="mb-2 font-bold text-slate-100">Team Coordination</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Hierarchy, delegation, and escalation built in. Agents route tasks up and down
                the org chart — no manual wiring required.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] to-transparent p-6 text-center">
              <div className="mb-3 text-4xl">💰</div>
              <h3 className="mb-2 font-bold text-slate-100">Budget Control</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Per-agent credit limits, automatic cost tracking, and configurable overage
                behavior. Know exactly what your org costs before the bill lands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS — Visual 3-step flow
          ═══════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="how-it-works" className="section-py-lg">
        <div className="mx-auto max-w-4xl">
          <div className="reveal text-center mb-12">
            <span className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-4">
              How It Works
            </span>
            <h2 id="how-it-works" className="text-3xl font-bold text-slate-100 md:text-4xl">
              From zero to running org in{" "}
              <span className="gradient-text">3 commands</span>
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-slate-400">
              No YAML. No Python classes. Just markdown that becomes infrastructure.
            </p>
          </div>

          <ol className="reveal-stagger grid gap-5 sm:grid-cols-3" role="list">
            {/* ── Step 1: Write ORG.md ────────────────────────── */}
            <li className="reveal relative rounded-xl border border-white/10 bg-navy-900/80 p-5 sm:step-connector">
              {/* Visual illustration */}
              <HiwStepFile />

              {/* Step header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="hiw-step-num">1</div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Write ORG.md</h3>
                  <p className="text-[0.65rem] text-slate-600 font-mono">npx openspawn init</p>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                An interactive wizard scaffolds your{" "}
                <code className="text-xs font-mono text-slate-300 bg-white/10 px-1 rounded">ORG.md</code>{" "}
                — the single file defining your entire agent org: hierarchy, models, budgets, policies.
              </p>

              {/* Connector arrow (desktop) */}
              <div className="hidden sm:block absolute right-[-1.1rem] top-[3.5rem] z-10 text-xl text-cyan-500/40 select-none">→</div>
            </li>

            {/* ── Step 2: Run openspawn start ─────────────────── */}
            <li className="reveal relative rounded-xl border border-white/10 bg-navy-900/80 p-5">
              {/* Visual illustration */}
              <HiwStepTerminal />

              {/* Step header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="hiw-step-num">2</div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Run openspawn start</h3>
                  <p className="text-[0.65rem] text-slate-600 font-mono">one command</p>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                Agents spawn in sandboxed containers, load their roles from ORG.md, and begin
                listening for tasks. Dashboard live at{" "}
                <code className="text-xs font-mono text-slate-300 bg-white/10 px-1 rounded">localhost:3333</code>.
              </p>

              {/* Connector arrow (desktop) */}
              <div className="hidden sm:block absolute right-[-1.1rem] top-[3.5rem] z-10 text-xl text-cyan-500/40 select-none">→</div>
            </li>

            {/* ── Step 3: Agents work ─────────────────────────── */}
            <li className="reveal rounded-xl border border-white/10 bg-navy-900/80 p-5">
              {/* Visual illustration */}
              <HiwStepAgents />

              {/* Step header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="hiw-step-num">3</div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Agents work</h3>
                  <p className="text-[0.65rem] text-slate-600 font-mono">you watch the dashboard</p>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                Agents coordinate via the A2A protocol — delegating tasks, escalating blockers,
                tracking costs, and building persistent memory across every run.
              </p>
            </li>
          </ol>

          <div className="reveal mt-10 text-center">
            <a href="/getting-started" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-navy-950 transition hover:bg-cyan-400 glow-cyan">
              Get Started in 5 Minutes →
            </a>
            <span className="mx-4 text-slate-700">·</span>
            <a href="/org-md" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-300 transition-colors">
              ORG.md reference →
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CAPABILITY GRID
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="section-py-lg">
        <div className="mx-auto max-w-6xl">
          <div className="reveal mb-4 text-center">
            <h2 className="text-3xl font-bold text-slate-100 md:text-4xl">
              Everything for{" "}
              <span className="gradient-text-animated">real-world multi-agent orchestration</span>
            </h2>
          </div>
          <div className="reveal mb-14 text-center">
            <p className="mx-auto max-w-2xl text-slate-400">
              Built on open protocols. Deploy anywhere. Scale from laptop to cloud — and out to the
              physical world.
            </p>
          </div>
          <div className="reveal-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="reveal">
                <FeatureCard {...f} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── From Config to Coordination ────────────────────────────────────── */}
      <section className="section-py-lg">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="reveal mb-4 text-3xl font-bold text-slate-100">
            Your agents can talk.{" "}
            <span className="gradient-text">Now give them structure.</span>
          </h2>
          <p className="reveal mx-auto mb-12 max-w-2xl text-slate-400">
            OpenClaw handles routing and isolation. OpenSpawn adds the org chart — teams, hierarchy,
            policies, and coordination. Version-controlled in markdown.
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="reveal code-block-hover overflow-hidden rounded-xl border border-white/10 bg-navy-900/80">
              <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-500">openclaw.json</span>
              </div>
              <pre className="overflow-x-auto p-4 text-left text-sm leading-relaxed text-slate-300">
                <code>{openclawJsonSnippet}</code>
              </pre>
            </div>
            <div className="reveal hidden text-4xl text-cyan-500/50 md:block">→</div>
            <div className="reveal text-2xl text-cyan-500/50 md:hidden">↓</div>
            <div className="reveal code-block-hover overflow-hidden rounded-xl border border-cyan-500/20 bg-navy-900/80 ring-1 ring-cyan-500/10">
              <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-500">ORG.md</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-cyan-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  source of truth
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-left text-sm leading-relaxed text-slate-300">
                <code>{orgMdPivotSnippet}</code>
              </pre>
            </div>
          </div>
          <p className="reveal mt-8 text-sm text-slate-500">
            Made for{" "}
            <a href="https://openclaw.ai" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              OpenClaw
            </a>
            . Works with any agent.
          </p>
        </div>
      </section>

      {/* ── Works with your stack ──────────────────────────────────────────── */}
      <section className="section-py">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="reveal mb-4 text-3xl font-bold text-slate-100">Works with your stack</h2>
          <p className="reveal mx-auto mb-10 max-w-2xl text-slate-400">
            Native OpenClaw integration. Plays nicely with CrewAI, LangGraph, AutoGen, and any
            agent framework.
          </p>
          <div className="reveal flex flex-wrap items-center justify-center gap-3">
            {ecosystemItems.map((f) => (
              <span
                key={f.name}
                className={`stack-badge rounded-xl px-5 py-2 text-sm font-medium ${
                  f.highlight
                    ? "ring-1 ring-cyan-500/30 bg-cyan-500/10 text-cyan-400"
                    : "border border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                {f.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORG.md Callout ────────────────────────────────────────────────── */}
      <section className="section-py-lg">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <div className="reveal flex flex-col justify-center">
            <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">Defining Feature</span>
            <h2 className="mb-4 text-3xl font-bold text-slate-100">Organization as Code</h2>
            <p className="mb-6 text-slate-400 leading-relaxed">
              Define your entire agent organization in a single markdown file. Mission, culture, teams,
              policies — version-controlled and diffable. The documentation is the configuration.
            </p>
            <a href="/org-md" className="inline-flex items-center gap-1.5 text-cyan-400 transition-all duration-200 hover:text-cyan-300 hover:gap-2.5 w-fit">
              Read about ORG.md
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
          <div className="reveal code-block-hover overflow-hidden rounded-xl border border-white/10 bg-navy-900/80">
            <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-slate-500">ORG.md</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-300">
              <code>{orgMdSaasSnippet}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 section-py reveal">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
          {[
            { value: String(agentCount), label: "Agents Live",         color: "text-cyan-400" },
            { value: "6",               label: "Industry Templates",   color: "text-violet-400" },
            { value: "7",               label: "MCP Tools",            color: "text-emerald-400" },
            { value: "3",               label: "LLM Providers",        color: "text-amber-400" },
            { value: "∞",               label: "Devices Possible",     color: "text-rose-400" },
          ].map((stat, i) => (
            <div key={stat.label}>
              <div className={`stat-pop text-4xl font-bold ${stat.color}`} style={{ animationDelay: `${i * 0.07}s` }}>
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How we compare ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 text-center">
            <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
              How We Compare
            </span>
          </div>
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-100">How We Compare</h2>
          <p className="mb-4 text-center text-lg font-semibold text-slate-300">vs CrewAI &amp; LangGraph</p>
          <p className="mx-auto mb-10 max-w-xl text-center text-slate-400">
            CrewAI and LangGraph are great <em>execution</em> frameworks. OpenSpawn adds the{" "}
            <em>coordination layer</em> — persistent orgs, governance, and budgets on top of any framework.
          </p>
          <div className="mb-8 overflow-x-auto rounded-xl border border-white/10 bg-navy-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3 text-left font-medium text-slate-400">Feature</th>
                  <th className="px-5 py-3 text-left font-semibold text-cyan-400">OpenSpawn</th>
                  <th className="px-5 py-3 text-left font-semibold text-violet-400">CrewAI</th>
                  <th className="px-5 py-3 text-left font-semibold text-emerald-400">LangGraph</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-400">
                {[
                  ["Real device support",   "✅ via OpenClaw",  "❌",         "❌"],
                  ["Persistent agents",     "✅ Cross-session", "❌",         "❌"],
                  ["Org as code (ORG.md)",  "✅ Markdown file", "Python code","Python code"],
                  ["Budget & governance",   "✅ Built-in",      "❌",         "❌"],
                  ["10-level hierarchy",    "✅ L1–L10",        "❌",         "❌"],
                  ["Live dashboard",        "✅ React + SSE",   "❌",         "❌"],
                  ["Framework agnostic",    "✅ A2A / MCP",     "❌",         "❌"],
                ].map(([feature, os, crewai, lg]) => (
                  <tr key={feature}>
                    <td className="px-5 py-2.5 font-medium text-slate-300">{feature}</td>
                    <td className="px-5 py-2.5">{os}</td>
                    <td className="px-5 py-2.5">{crewai}</td>
                    <td className="px-5 py-2.5">{lg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center">
            <a href="/docs/comparison" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Full framework comparison →
            </a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="graduate-cta" className="section-py-lg">
        <div className="mx-auto max-w-3xl">
          <div className="reveal overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-violet-500/[0.04] to-transparent p-10 text-center md:p-16">
            <div className="mb-4 text-5xl">🎓</div>
            <h2 id="graduate-cta" className="mb-4 text-3xl font-extrabold text-slate-100 md:text-4xl tracking-tight">
              Ready to graduate?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-slate-400 leading-relaxed">
              Sub-agents are training wheels. OpenSpawn is the real company — persistent agents,
              hierarchy, budget control, and full visibility. Deploy your first org in 5 minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="/getting-started" className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-3.5 font-semibold text-navy-950 transition hover:bg-cyan-400 glow-cyan">
                Get Started →
              </a>
              <a href="/templates" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/20">
                Browse industry templates
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-600">MIT licensed · No account required · Runs locally</p>
          </div>
        </div>
      </section>

      {/* ── Open Source CTA ───────────────────────────────────────────────── */}
      <section className="section-py-lg text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="reveal mb-4 text-3xl font-bold text-slate-100">Open Source</h2>
          <p className="reveal mb-8 text-slate-400">
            OpenSpawn is MIT licensed. Star us on GitHub, contribute, or fork and build your own
            real-world agent org.
          </p>
          <div className="reveal flex flex-wrap items-center justify-center gap-4">
            <Button as="a" href="https://github.com/openspawn/openspawn" target="_blank" rel="noopener" variant="neutral">
              ⭐ {stars ? `${stars.toLocaleString()} Stars on GitHub` : "Star on GitHub"}
            </Button>
            <Button as="a" href="/docs/getting-started" variant="ghost">
              Read the Docs →
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
