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

// ─── "Seen in" / early-adopter logos bar ─────────────────────────────────────
const earlyAdopters = [
  { name: "OpenClaw", emoji: "🦞" },
  { name: "BikiniBottom Demo", emoji: "🍍" },
  { name: "Internal Labs", emoji: "🔬" },
  { name: "Indie Builders", emoji: "🛠️" },
];

// ─── ORG.md snippets ──────────────────────────────────────────────────────────
const orgMdSnippet = `# 🪸 MyOrg
> Mission: Ship great software faster

## Teams
- 🔬 Research (lead: Analyst)
- 🛠️ Engineering (lead: Architect)

## Policies
- All tasks require peer review
- Escalate critical issues to Manager`;

const openclawJsonSnippet = `{
  "agents": {
    "list": [
      { "id": "analyst",   "model": "opus"   },
      { "id": "architect", "model": "sonnet" },
      { "id": "reviewer",  "model": "sonnet" }
    ]
  },
  "tools": {
    "agentToAgent": { "enabled": true }
  }
}`;

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

// ─── Tagline word reveal helper ───────────────────────────────────────────────
function TaglineWords({ text }: { text: string }) {
  // Split on spaces but preserve periods as part of the word they're attached to
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

// ─── Component ────────────────────────────────────────────────────────────────
export function LandingPage() {
  const [agentCount, setAgentCount] = useState(22);
  const [stars, setStars] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  useScrollReveal();

  useEffect(() => {
    fetch("https://bikinibottom.ai/api/health")
      .then((r) => r.json())
      .then((d) => { if (d.agents) setAgentCount(d.agents); })
      .catch(() => {});
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
            <span className="text-emerald-400 font-semibold">🏢 5</span>
            departments orchestrated
          </span>
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400 font-semibold">📦 MIT</span>
            open source
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO — Atmospheric, unforgettable
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="grain-overlay relative overflow-hidden pb-24 pt-28 md:pt-36">
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="orb-drift absolute left-1/2 top-0 -translate-x-1/2 h-[700px] w-[900px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(6,182,212,0.07) 0%, transparent 70%)",
            }}
          />
          <div
            className="orb-drift-alt absolute right-0 top-32 h-[500px] w-[500px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)",
            }}
          />
          <div
            className="orb-drift absolute -left-20 bottom-0 h-[400px] w-[400px]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(245,158,11,0.04) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Coral emoji — floats gently */}
          <div className="animate-fade-in-up mb-6">
            <span className="coral-float text-6xl md:text-8xl" role="img" aria-label="coral">
              🪸
            </span>
          </div>

          {/* Category badge */}
          <div className="animate-fade-in-up animate-delay-100 mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block" />
              Multi-Agent Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up animate-delay-100 mb-5 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-8xl">
            <span className="gradient-text-animated">OpenSpawn</span>
          </h1>

          {/* THE tagline — word-by-word reveal, maximum impact */}
          <p className="mb-3 text-2xl font-bold text-slate-100 md:text-3xl lg:text-4xl leading-tight tracking-tight">
            <TaglineWords text="Your agents. Your devices. Your rules." />
          </p>

          {/* Sub-copy */}
          <p className="animate-fade-in-up animate-delay-300 mx-auto mb-10 max-w-xl text-base text-slate-400 md:text-lg leading-relaxed">
            Orchestrate agent teams across devices, nodes, and services — with the structure
            your org actually needs. No competitor brings agents into the physical world like this.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up animate-delay-400 mb-10 flex flex-wrap items-center justify-center gap-4">
            <Button as="a" href="/docs/getting-started" variant="primary" size="lg" className="glow-cyan">
              Get Started →
            </Button>
            <Button
              as="a"
              href="https://bikinibottom.ai/app/"
              target="_blank"
              rel="noopener"
              variant="neutral"
              size="lg"
            >
              🍍 Watch 22 SpongeBob Agents Run a Company →
            </Button>
          </div>

          {/* Protocol badges */}
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

          {/* Install command — pulse ring */}
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

          {/* Terminal demo */}
          <div className="animate-fade-in-up animate-delay-600">
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* ── Differentiator callout ─────────────────────────────────────────── */}
      <section className="section-py">
        <div className="mx-auto max-w-5xl">
          <div className="reveal rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-violet-500/[0.04] p-8 text-center md:p-14">
            {/* Icon row */}
            <div className="mb-5 flex items-center justify-center gap-3 text-4xl">
              {["📱", "💻", "📷", "🌐"].map((icon, i) => (
                <span
                  key={icon}
                  className="inline-block"
                  style={{
                    animation: `coralFloat ${4 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
                  }}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          CAPABILITY GRID — Staggered scroll reveal
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
          {/* Cards: reveal-stagger enables nth-child delay cascade */}
          <div className="reveal-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="reveal">
                <FeatureCard {...f} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live demo callout ──────────────────────────────────────────────── */}
      <section className="section-py-lg">
        <div className="mx-auto max-w-5xl text-center">
          <div className="reveal mb-6">
            <span className="inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Live Demo
            </span>
          </div>
          <h2 className="reveal mb-4 text-3xl font-bold text-slate-100 md:text-4xl">
            See it running. <span className="gradient-text">Right now.</span>
          </h2>
          <p className="reveal mx-auto mb-10 max-w-xl text-slate-400">
            We deployed a real OpenSpawn org using SpongeBob characters as agents. Watch 22 agents
            in 5 departments run a full company in real-time.
          </p>
          <a
            href="https://bikinibottom.ai/app/"
            target="_blank"
            rel="noopener"
            className="reveal inline-block"
          >
            <div className="group overflow-hidden rounded-xl border border-white/10 bg-navy-900/50 shadow-2xl shadow-cyan-500/5 transition-all duration-300 hover:border-cyan-500/20 hover:shadow-cyan-500/10">
              <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-500">bikinibottom.ai/app</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  Live
                </span>
              </div>
              <img src="/og-image.jpg" alt="OpenSpawn Dashboard — BikiniBottom Demo" className="w-full opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </a>
          <p className="reveal mt-6 text-sm text-slate-500">
            🍍 <strong className="text-slate-300">BikiniBottom</strong> — 22 SpongeBob agents · 5 departments · Real-time coordination
          </p>
          <div className="reveal mt-4">
            <a
              href="https://bikinibottom.ai/app/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:gap-3"
            >
              Watch 22 SpongeBob agents run a company in real-time
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
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
            {/* Left panel: openclaw.json */}
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
            {/* Arrow */}
            <div className="reveal hidden text-4xl text-cyan-500/50 md:block">→</div>
            <div className="reveal text-2xl text-cyan-500/50 md:hidden">↓</div>
            {/* Right panel: ORG.md */}
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
              <code>{orgMdSnippet}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 section-py reveal">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
          {[
            { value: String(agentCount), label: "Agents Live", color: "text-cyan-400" },
            { value: "5",  label: "Departments",  color: "text-violet-400" },
            { value: "7",  label: "MCP Tools",    color: "text-emerald-400" },
            { value: "3",  label: "LLM Providers", color: "text-amber-400" },
            { value: "∞",  label: "Devices Possible", color: "text-rose-400" },
          ].map((stat, i) => (
            <div key={stat.label}>
              <div
                className={`stat-pop text-4xl font-bold ${stat.color}`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
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
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-100">
            How We Compare
          </h2>
          <p className="mb-4 text-center text-lg font-semibold text-slate-300">vs CrewAI &amp; LangGraph</p>
          <p className="mx-auto mb-10 max-w-xl text-center text-slate-400">
            CrewAI and LangGraph are great <em>execution</em> frameworks. OpenSpawn is{" "}
            <em>coordination infrastructure</em>. They solve different problems — and they work
            together.
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
                  ["Real device support", "✅ via OpenClaw", "❌", "❌"],
                  ["Org as code (ORG.md)", "✅ Markdown file", "Python code", "Python code"],
                  ["Budget & governance", "✅ Built-in", "❌", "❌"],
                  ["MCP native", "✅ 7 tools", "Plugins", "LangChain tools"],
                  ["Live dashboard", "✅ React + SSE", "❌", "❌"],
                  ["Framework agnostic", "✅ A2A / MCP", "❌", "❌"],
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
            <a
              href="/docs/comparison"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Full framework comparison →
            </a>
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
            <Button
              as="a"
              href="https://github.com/openspawn/openspawn"
              target="_blank"
              rel="noopener"
              variant="neutral"
            >
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
