import { useState, useEffect } from "react";
import { TerminalDemo } from "../components/terminal-demo";
import { FeatureCard } from "../components/feature-card";
import { ProtocolBadge } from "../components/protocol-badge";

const features = [
 { emoji: "🔗", title: "A2A Protocol", description: "Every agent is discoverable. Native Agent-to-Agent protocol support with streaming, task management, and per-agent cards.", color: "text-cyan-400" },
 { emoji: "🔌", title: "MCP Tools", description: "7 tools via Streamable HTTP. Your agents become MCP servers — connect from Claude Desktop, Cursor, or any MCP client.", color: "text-violet-400" },
 { emoji: "🔀", title: "Model Router", description: "Intelligent routing with fallback chains. Local-first with Ollama, cloud when needed. Cost tracking per provider.", color: "text-emerald-400" },
 { emoji: "📊", title: "Live Dashboard", description: "Real-time visualization of your agent organization. Network graph, task timeline, cost charts, router metrics.", color: "text-amber-400" },
 { emoji: "💻", title: "CLI", description: "npx openspawn init — zero config, instant setup. Scaffold, start, and deploy in seconds.", color: "text-cyan-400" },
];

const frameworks = [
 { name: "OpenClaw", highlight: true },
 { name: "CrewAI" },
 { name: "LangGraph" },
 { name: "AutoGen" },
 { name: "Custom" },
];

const orgMdSnippet = `# 🍍 BikiniBottom Inc.
> Mission: Protect Bikini Bottom

## Teams
- 🔬 Science (lead: Sandy)
- 🍔 Operations (lead: SpongeBob)

## Policies
- All tasks require peer review
- Escalate critical issues to Patrick`;

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

const orgMdPivotSnippet = `# 🍍 BikiniBottom Inc.

## Structure
- 🔬 Science (lead: Sandy, model: opus)
  - Patrick (research), Gary (data)
- 🍔 Operations (lead: SpongeBob)
  - Squidward (quality), Larry (logistics)

## Policies
- L7+ agents: event-driven (Opus)
- L1-6: polling (Sonnet, budget-capped)
- All PRs require peer review`;

export function LandingPage() {
 const [agentCount, setAgentCount] = useState(22);
 const [stars, setStars] = useState<number | null>(null);

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

 return (
  <div className="px-5 sm:px-6">
   {/* Built with OpenSpawn */}
   <div className="text-center py-2 text-xs text-slate-500">
    Built with <a href="https://openspawn.ai" className="text-cyan-400 hover:text-cyan-300 transition font-medium">🪸 OpenSpawn</a>
   </div>
   {/* Hero */}
   <section className="relative overflow-hidden pb-20 pt-24 md:pt-32">
    <div className="pointer-events-none absolute inset-0">
     <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-cyan-500/5 blur-[120px]" />
     <div className="absolute right-1/4 top-20 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
    </div>
    <div className="relative mx-auto max-w-4xl text-center">
     <div className="animate-fade-in-up mb-6 text-6xl md:text-8xl">🍍</div>
     <h1 className="animate-fade-in-up animate-delay-100 mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl">
      <span className="gradient-text">BikiniBottom</span>
     </h1>
     <p className="animate-fade-in-up animate-delay-200 mx-auto mb-4 max-w-xl text-lg text-slate-300 md:text-xl">
      One agent needs a prompt. A team needs an org.
     </p>
     <p className="animate-fade-in-up animate-delay-200 mx-auto mb-8 max-w-lg text-base text-slate-500">
      The org chart for AI agents. Define teams, hierarchy, and policies in markdown.
     </p>
     <div className="animate-fade-in-up animate-delay-300 mb-10 flex flex-wrap items-center justify-center gap-4">
      <a href="/app/" className="glow-cyan rounded-xl bg-cyan-500 px-8 py-3 text-base font-semibold text-navy-950 transition hover:bg-cyan-400">Launch Live Demo →</a>
      <a href="/docs/getting-started" className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/10">Get Started</a>
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
        onClick={() => { navigator.clipboard.writeText("npx openspawn init my-reef"); }}
        aria-label="Copy to clipboard"
       >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
       </button>
      </div>
     </div>
     <div className="animate-fade-in-up animate-delay-600">
      <TerminalDemo />
     </div>
    </div>
   </section>

   {/* From Config to Coordination */}
   <section className="py-20">
    <div className="mx-auto max-w-5xl text-center">
     <h2 className="mb-4 text-3xl font-bold text-slate-100">Your agents can talk. <span className="gradient-text">Now give them structure.</span></h2>
     <p className="mx-auto mb-12 max-w-2xl text-slate-400">
      OpenClaw handles routing and isolation. BikiniBottom adds the org chart — teams, hierarchy, policies, and coordination.
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
       <pre className="overflow-x-auto p-4 text-left text-sm leading-relaxed text-slate-300"><code>{orgMdPivotSnippet}</code></pre>
      </div>
     </div>
     <p className="mt-8 text-sm text-slate-500">
      Made for <a href="https://openclaw.ai" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 transition">OpenClaw</a>. Works with any agent.
     </p>
    </div>
   </section>

   {/* Dashboard Preview */}
   <section className="py-20">
    <div className="mx-auto max-w-5xl text-center">
     <a href="/app/" className="group block">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900/50 shadow-2xl shadow-cyan-500/5 transition group-hover:border-white/20">
       <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-500/70" />
        <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <div className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-xs text-slate-500">bikinibottom.ai/app</span>
       </div>
       <img src="/og-image.jpg" alt="BikiniBottom Dashboard" className="w-full" />
      </div>
     </a>
     <p className="mt-6 text-lg text-slate-400">{agentCount} agents. 5 departments. Real-time coordination.</p>
    </div>
   </section>

   {/* Works with your stack */}
   <section className="py-16">
    <div className="mx-auto max-w-4xl text-center">
     <h2 className="mb-4 text-3xl font-bold text-slate-100">Works with your stack</h2>
     <p className="mx-auto mb-10 max-w-2xl text-slate-400">
      Made for OpenClaw. Works with CrewAI, LangGraph, AutoGen, and any agent framework.
     </p>
     <div className="flex flex-wrap items-center justify-center gap-3">
      {frameworks.map((f) => (
       <span key={f.name} className={`rounded-xl px-5 py-2 text-sm font-medium ${f.highlight ? "ring-1 ring-cyan-500/30 bg-cyan-500/10 text-cyan-400" : "border border-white/10 bg-white/5 text-slate-300"}`}>{f.name}</span>
      ))}
     </div>
    </div>
   </section>

   {/* ORG.md Callout */}
   <section className="py-20">
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
     <div className="flex flex-col justify-center">
      <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">Defining Feature</span>
      <h2 className="mb-4 text-3xl font-bold text-slate-100">Organization as Code</h2>
      <p className="mb-6 text-slate-400">
       Define your entire agent organization in a single markdown file. Mission, culture, teams, policies — version-controlled and diffable. The documentation is the configuration.
      </p>
      <a href="/org-md" className="text-cyan-400 transition hover:text-cyan-300">Read about ORG.md →</a>
     </div>
     <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900/80">
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/5 px-4 py-3">
       <div className="h-3 w-3 rounded-full bg-red-500/70" />
       <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
       <div className="h-3 w-3 rounded-full bg-green-500/70" />
       <span className="ml-2 text-xs text-slate-500">ORG.md</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-slate-300"><code>{orgMdSnippet}</code></pre>
     </div>
    </div>
   </section>

   {/* Features */}
   <section className="py-20">
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

   {/* Stats */}
   <section className="border-y border-white/5 py-16">
    <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 sm:gap-12 text-center">
     <div>
      <div className="text-4xl font-bold text-cyan-400">{agentCount}</div>
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
    <div className="mx-auto max-w-2xl">
     <h2 className="mb-4 text-3xl font-bold text-slate-100">Open Source</h2>
     <p className="mb-8 text-slate-400">BikiniBottom is MIT licensed. Star us on GitHub, contribute, or fork and build your own.</p>
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
  </div>
 );
}
