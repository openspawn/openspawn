import { TerminalDemo } from "../components/terminal-demo";
import { FeatureCard } from "../components/feature-card";
import { ProtocolBadge } from "../components/protocol-badge";

const features = [
  { emoji: "🔗", title: "A2A Protocol", description: "Every agent is discoverable. Native Agent-to-Agent protocol support with streaming, task management, and per-agent cards.", color: "text-cyan-400" },
  { emoji: "🔌", title: "MCP Tools", description: "7 tools via Streamable HTTP. Your agents become MCP servers — connect from Claude Desktop, Cursor, or any MCP client.", color: "text-violet-400" },
  { emoji: "🔀", title: "Model Router", description: "Intelligent routing with fallback chains. Local-first with Ollama, cloud when needed. Cost tracking per provider.", color: "text-emerald-400" },
  { emoji: "📊", title: "Live Dashboard", description: "Real-time visualization of your agent organization. Network graph, task timeline, cost charts, router metrics.", color: "text-amber-400" },
  { emoji: "💻", title: "CLI", description: "npx bikinibottom init — zero config, instant setup. Scaffold, start, and deploy in seconds.", color: "text-cyan-400" },
  { emoji: "🏗️", title: "ORG.md", description: "Define your org in markdown. Agents, teams, hierarchy, culture — all version-controlled.", color: "text-violet-400" },
];

export function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-24 md:pt-32">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="animate-fade-in-up mb-6 text-7xl md:text-8xl">🍍</div>
          <h1 className="animate-fade-in-up animate-delay-100 mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
            <span className="gradient-text">BikiniBottom</span>
          </h1>
          <p className="animate-fade-in-up animate-delay-200 mx-auto mb-8 max-w-xl text-lg text-slate-400 md:text-xl">
            The control plane your AI agents deserve.
            <br />
            <span className="text-slate-500">A2A + MCP native orchestration with real-time dashboard.</span>
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up animate-delay-300 mb-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/app/"
              className="glow-cyan rounded-xl bg-cyan-500 px-8 py-3 text-base font-semibold text-navy-950 transition hover:bg-cyan-400"
            >
              Launch Live Demo →
            </a>
            <a
              href="/docs/getting-started"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Get Started
            </a>
          </div>

          {/* Protocol Badges */}
          <div className="animate-fade-in-up animate-delay-400 mb-16 flex flex-wrap items-center justify-center gap-3">
            <ProtocolBadge label="A2A Protocol" />
            <ProtocolBadge label="MCP" />
            <ProtocolBadge label="Model Router" />
            <ProtocolBadge label="TypeScript" variant="core" />
            <ProtocolBadge label="Python" variant="core" />
          </div>

          {/* Terminal */}
          <div className="animate-fade-in-up animate-delay-500">
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-100 md:text-4xl">
            Everything you need for{" "}
            <span className="gradient-text">multi-agent orchestration</span>
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-center text-slate-400">
            Built on open protocols. Deploy anywhere. Scale from laptop to cloud.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 py-16">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-12 px-6 text-center">
          <div>
            <div className="text-4xl font-bold text-cyan-400">22</div>
            <div className="mt-1 text-sm text-slate-500">Agents</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-4xl font-bold text-violet-400">5</div>
            <div className="mt-1 text-sm text-slate-500">Departments</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-4xl font-bold text-emerald-400">7</div>
            <div className="mt-1 text-sm text-slate-500">MCP Tools</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-4xl font-bold text-amber-400">3</div>
            <div className="mt-1 text-sm text-slate-500">LLM Providers</div>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 text-3xl font-bold text-slate-100">
            Open Source
          </h2>
          <p className="mb-8 text-slate-400">
            BikiniBottom is MIT licensed. Star us on GitHub, contribute, or fork and build your own.
          </p>
          <a
            href="https://github.com/openspawn/openspawn"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/10"
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
