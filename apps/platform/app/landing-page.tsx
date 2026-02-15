import { useState, useEffect } from "react";

/* ── Reusable small components ── */

function ProtocolBadge({ label, variant = "protocol" }: { label: string; variant?: "protocol" | "core" }) {
  const styles =
    variant === "protocol"
      ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
      : "border-violet-500/20 bg-violet-500/10 text-violet-400";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}

function FeatureCard({ emoji, title, description, color }: { emoji: string; title: string; description: string; color: string }) {
  return (
    <div className="group rounded-xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-white/10 hover:bg-white/[0.04]">
      <div className="mb-3 text-3xl">{emoji}</div>
      <h3 className={`mb-2 text-lg font-semibold ${color}`}>{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function TerminalDemo() {
  const lines = [
    { text: "$ npx openspawn init my-reef", color: "text-slate-300", delay: 0 },
    { text: "🪸 Created ORG.md, config, .gitignore", color: "text-emerald-400", delay: 900 },
    { text: "", color: "", delay: 1300 },
    { text: "$ npx openspawn start", color: "text-slate-300", delay: 1500 },
    { text: "🌐 Server running at http://localhost:3333", color: "text-cyan-400", delay: 2400 },
    { text: "🔗 A2A: /.well-known/agent.json", color: "text-violet-400", delay: 2850 },
    { text: "🔌 MCP: /mcp (7 tools)", color: "text-amber-400", delay: 3250 },
    { text: "🔀 Router: 3 providers configured", color: "text-emerald-400", delay: 3700 },
    { text: "📊 Dashboard: http://localhost:3333", color: "text-cyan-400", delay: 4100 },
    { text: "", color: "", delay: 4600 },
    { text: "✨ Agents ready. Visit http://localhost:3333", color: "text-cyan-300 font-semibold", delay: 5200 },
  ];

  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay + Math.random() * 80)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="terminal glow-cyan mx-auto max-w-2xl">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500/80" />
        <div className="terminal-dot bg-yellow-500/80" />
        <div className="terminal-dot bg-green-500/80" />
      </div>
      <div className="p-5 min-h-[260px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`${line.color} ${i === visibleLines - 1 ? "animate-fade-in-up" : ""}`}>
            {line.text || "\u00A0"}
          </div>
        ))}
        <span className="cursor-blink text-slate-500">▋</span>
      </div>
    </div>
  );
}

/* ── Data ── */

const features = [
  { emoji: "🔗", title: "A2A Protocol", description: "Every agent is discoverable. Native Agent-to-Agent protocol support with streaming, task management, and per-agent cards.", color: "text-cyan-400" },
  { emoji: "🔌", title: "MCP Tools", description: "Your agents become MCP servers — connect from Claude Desktop, Cursor, or any MCP client. Streamable HTTP out of the box.", color: "text-violet-400" },
  { emoji: "🔀", title: "Model Router", description: "Intelligent routing with fallback chains. Local-first with Ollama, cloud when needed. Cost tracking per provider.", color: "text-emerald-400" },
  { emoji: "📊", title: "Live Dashboard", description: "Real-time visualization of your agent organization. Network graph, task timeline, cost charts, router metrics.", color: "text-amber-400" },
  { emoji: "💻", title: "CLI", description: "npx openspawn init — zero config, instant setup. Scaffold, start, and deploy your agent org in seconds.", color: "text-cyan-400" },
];

const openclawJsonSnippet = `{
  "agents": {
    "list": [
      { "id": "sandy", "model": "opus" },
      { "id": "spongebob", "model": "sonnet" },
      { "id": "squidward", "model": "sonnet" }
    ]
  },
  "tools": {
    "agentToAgent": { "enabled": true }
  }
}`;

const orgMdSnippet = `# 🪸 My Agent Org

## Structure
- 🔬 Research (lead: Alice, model: opus)
  - Bob (analysis), Carol (data)
- 🛠️ Engineering (lead: Dave)
  - Eve (backend), Frank (frontend)

## Policies
- Senior agents: event-driven (Opus)
- Junior agents: polling (Sonnet, budget-capped)
- All PRs require peer review`;

/* ── Main Page ── */

export function LandingPage() {
  const [stars, setStars] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("https://api.github.com/repos/openspawn/openspawn")
      .then((r) => r.json())
      .then((d) => { if (d.stargazers_count) setStars(d.stargazers_count); })
      .catch(() => {});
  }, []);

  const copyCommand = () => {
    navigator.clipboard.writeText("npx openspawn init my-reef");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-200 overflow-x-hidden">
      {/* Subtle ocean backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 50% at 80% 100%, rgba(139,92,246,0.03) 0%, transparent 60%)",
        }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <a href="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="text-2xl">🪸</span>
            <span className="gradient-text">OpenSpawn</span>
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-400 transition hover:text-cyan-400">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 transition hover:text-cyan-400">How It Works</a>
            <a href="https://github.com/openspawn/openspawn" target="_blank" rel="noopener" className="text-sm text-slate-400 transition hover:text-cyan-400">GitHub</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://bikinibottom.ai"
              target="_blank"
              rel="noopener"
              className="rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
            >
              See Live Demo →
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-5 sm:px-6">
        {/* Hero */}
        <section className="relative overflow-hidden pb-20 pt-24 md:pt-32">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-cyan-500/5 blur-[120px]" />
            <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="animate-fade-in-up mb-6 text-6xl md:text-8xl">🪸</div>
            <h1 className="animate-fade-in-up animate-delay-100 mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl">
              <span className="gradient-text">OpenSpawn</span>
            </h1>
            <p className="animate-fade-in-up animate-delay-200 mx-auto mb-4 max-w-xl text-lg text-slate-300 md:text-xl">
              One agent needs a prompt. A team needs an org.
            </p>
            <p className="animate-fade-in-up animate-delay-200 mx-auto mb-8 max-w-lg text-base text-slate-500">
              The open-source coordination layer for AI agent teams. Define structure, hierarchy, and policies in markdown. Your agents do the rest.
            </p>
            <div className="animate-fade-in-up animate-delay-300 mb-10 flex flex-wrap items-center justify-center gap-4">
              <a href="#how-it-works" className="glow-cyan rounded-xl bg-cyan-500 px-8 py-3 text-base font-semibold text-navy-950 transition hover:bg-cyan-400">
                Get Started
              </a>
              <a
                href="https://bikinibottom.ai"
                target="_blank"
                rel="noopener"
                className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/10"
              >
                See Live Demo → bikinibottom.ai
              </a>
            </div>
            <div className="animate-fade-in-up animate-delay-400 mb-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <ProtocolBadge label="A2A Protocol" />
              <ProtocolBadge label="MCP" />
              <ProtocolBadge label="Model Router" />
            </div>
            <div className="animate-fade-in-up animate-delay-400 mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <ProtocolBadge label="TypeScript" variant="core" />
              <ProtocolBadge label="Python" variant="core" />
            </div>
            {/* Install command */}
            <div className="animate-fade-in-up animate-delay-500 mb-16">
              <div className="group relative mx-auto inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-mono text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08]">
                <span className="text-slate-500">$</span>
                <span>npx openspawn init my-reef</span>
                <button
                  type="button"
                  className="ml-1 rounded p-1 text-slate-500 transition hover:bg-white/10 hover:text-cyan-400"
                  onClick={copyCommand}
                  aria-label="Copy to clipboard"
                >
                  {copied ? (
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
            <TerminalDemo />
          </div>
        </section>

        {/* What is OpenSpawn? */}
        <section id="how-it-works" className="py-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-100">
              What is <span className="gradient-text">OpenSpawn</span>?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-slate-400">
              OpenSpawn turns a flat list of AI agents into a coordinated organization.
              You define the org in ORG.md — teams, roles, hierarchy, policies — and
              OpenSpawn handles task delegation, credit tracking, and communication protocols.
            </p>
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
              {/* Left panel: openclaw.json */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900/80">
                <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-slate-500">openclaw.json</span>
                </div>
                <pre className="overflow-x-auto p-4 text-left text-sm leading-relaxed text-slate-300"><code>{openclawJsonSnippet}</code></pre>
              </div>
              {/* Arrow */}
              <div className="hidden text-4xl text-cyan-500/60 md:block">→</div>
              <div className="text-2xl text-cyan-500/60 md:hidden">↓</div>
              {/* Right panel: ORG.md */}
              <div className="overflow-hidden rounded-xl border border-cyan-500/20 bg-navy-900/80 ring-1 ring-cyan-500/10">
                <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-slate-500">ORG.md</span>
                </div>
                <pre className="overflow-x-auto p-4 text-left text-sm leading-relaxed text-slate-300"><code>{orgMdSnippet}</code></pre>
              </div>
            </div>
          </div>
        </section>

        {/* See it in Action */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-100">See it in Action</h2>
            <p className="mx-auto mb-10 max-w-2xl text-slate-400">
              BikiniBottom is a live OpenSpawn deployment with 22 SpongeBob characters
              running a software company. 5 departments. Real-time coordination.
            </p>
            <a href="https://bikinibottom.ai" target="_blank" rel="noopener" className="group block">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900/50 shadow-2xl shadow-cyan-500/5 transition group-hover:border-white/20">
                <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  <span className="ml-2 text-xs text-slate-500">bikinibottom.ai</span>
                </div>
                <div className="flex items-center justify-center bg-navy-900/30 py-24">
                  <div className="text-center">
                    <div className="mb-4 text-6xl">🍍</div>
                    <p className="text-lg font-semibold text-slate-300">BikiniBottom Live Dashboard</p>
                    <p className="mt-2 text-sm text-slate-500">22 agents · 5 departments · Real-time</p>
                  </div>
                </div>
              </div>
            </a>
            <a
              href="https://bikinibottom.ai"
              target="_blank"
              rel="noopener"
              className="mt-6 inline-flex items-center gap-2 text-cyan-400 transition hover:text-cyan-300"
            >
              Visit bikinibottom.ai →
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-100 md:text-4xl">
              Everything you need for <span className="gradient-text">multi-agent orchestration</span>
            </h2>
            <p className="mx-auto mb-14 max-w-2xl text-center text-slate-400">Built on open protocols. Deploy anywhere. Scale from laptop to cloud.</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (<FeatureCard key={f.title} {...f} />))}
            </div>
          </div>
        </section>

        {/* Made for OpenClaw */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-cyan-400">Built for OpenClaw</span>
            <h2 className="mb-4 text-3xl font-bold text-slate-100">
              Made for <span className="gradient-text">OpenClaw</span> Agents
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-slate-400">
              OpenSpawn is built for OpenClaw agents. Install the skill, add ORG.md to
              your workspace, and your agents understand their role in the organization.
            </p>
            <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-white/10 bg-navy-900/80">
              <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-500">terminal</span>
              </div>
              <pre className="p-4 text-left text-sm leading-relaxed text-slate-300"><code>{`$ openclaw skill add openspawn\n🪸 OpenSpawn skill installed\n\n$ echo "# My Org" > ORG.md\n✨ Agents now coordinate automatically`}</code></pre>
            </div>
          </div>
        </section>

        {/* Open Source */}
        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold text-slate-100">Open Source</h2>
            <p className="mb-8 text-slate-400">
              OpenSpawn is MIT licensed. Star us on GitHub, contribute, or fork and build your own agent organization.
            </p>
            <a
              href="https://github.com/openspawn/openspawn"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/10"
            >
              ⭐ {stars ? `${stars.toLocaleString()} Stars on GitHub` : "Star on GitHub"}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-navy-950 py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 text-lg font-bold">
                <span className="mr-2">🪸</span>
                <span className="gradient-text">OpenSpawn</span>
              </div>
              <p className="text-sm text-slate-500">The coordination layer for AI agent teams.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-cyan-400 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-cyan-400 transition">How It Works</a></li>
                <li><a href="https://bikinibottom.ai" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">Live Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Protocols</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><span className="text-slate-500">A2A Protocol</span></li>
                <li><span className="text-slate-500">MCP Tools</span></li>
                <li><span className="text-slate-500">Model Router</span></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Community</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="https://github.com/openspawn/openspawn" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">GitHub</a></li>
                <li><a href="https://openclaw.ai" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">OpenClaw</a></li>
                <li><span className="text-slate-600">MIT License</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} OpenSpawn. Open source under MIT.
          </div>
        </div>
      </footer>
    </div>
  );
}
