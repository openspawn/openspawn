export function OrgMdPage() {
  const orgSnippet = `# ORG.md — Krusty Krab

## Mission
Serve the finest underwater cuisine while
maintaining operational excellence across all stations.

## Culture
- Transparency over hierarchy
- Every agent owns their domain
- Escalate early, blame never

## Teams
- **Kitchen** → SpongeBob (lead), Gary (sous)
- **Front of House** → Squidward (lead), Patrick (support)
- **Operations** → Sandy (infra), Plankton (security)

## Policies
- Budget: $50/day per agent (pooled weekly)
- Escalation: 2 failed attempts → team lead
- Deploy: PR approval from any peer`;

  return (
    <div className="px-5 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden pb-16 pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-violet-500/6 blur-[140px]" />
          <div className="absolute right-1/3 top-32 h-[300px] w-[300px] rounded-full bg-cyan-500/4 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 font-mono text-sm tracking-widest text-cyan-400/70 uppercase">
            A meditation on agent organizations
          </p>
          <h1 className="mb-8 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="gradient-text">ORG.md</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-400 leading-relaxed md:text-xl">
            You gave your agent a soul.
            <br />
            Now give your team a spine.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-100 md:text-3xl">
            The problem with agents
          </h2>
          <div className="space-y-4 text-slate-400 leading-relaxed text-lg">
            <p>
              One agent is a tool. Two agents is a conversation.
              Ten agents is chaos.
            </p>
            <p>
              You can give each agent a persona, a system prompt, a set of tools.
              But who decides what the <em>team</em> believes? Who sets the budget?
              Who resolves conflicts? Who defines "done"?
            </p>
            <p>
              Individual brilliance doesn't scale.
              Organizations do.
            </p>
          </div>
        </div>
      </section>

      {/* The Insight */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-100 md:text-3xl">
            The org chart is the config
          </h2>
          <div className="space-y-4 text-slate-400 leading-relaxed text-lg">
            <p>
              Not YAML. Not JSON. Not a dashboard with drag-and-drop boxes.
            </p>
            <p className="text-slate-200 font-medium">
              Markdown.
            </p>
            <p>
              Human-readable. Version-controlled. Diffable. Reviewable.
              The documentation <em>is</em> the configuration.
              The README <em>is</em> the runtime.
            </p>
            <p>
              You don't configure your org — you <em>write</em> it.
              And because it's a file in git, your organization has history.
              Every reorg is a commit. Every policy change is a PR.
            </p>
          </div>
        </div>
      </section>

      {/* The Ecosystem */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-100 md:text-3xl">
            The natural next step
          </h2>
          <div className="space-y-5 text-slate-400 leading-relaxed text-lg">
            <div className="flex items-start gap-4">
              <code className="mt-1 shrink-0 rounded bg-white/5 px-2 py-1 font-mono text-sm text-cyan-400">
                CLAUDE.md
              </code>
              <p>defines one agent — its identity, its boundaries.</p>
            </div>
            <div className="flex items-start gap-4">
              <code className="mt-1 shrink-0 rounded bg-white/5 px-2 py-1 font-mono text-sm text-violet-400">
                AGENTS.md
              </code>
              <p>defines a workspace — how agents share a project.</p>
            </div>
            <div className="flex items-start gap-4">
              <code className="mt-1 shrink-0 rounded bg-white/5 px-2 py-1 font-mono text-sm text-amber-400">
                ORG.md
              </code>
              <p>
                defines an entire organization — mission, culture, structure,
                policy, playbooks. The whole machine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What goes in ORG.md */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-2xl font-bold text-slate-100 md:text-3xl">
            What lives inside
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { label: "Identity", desc: "Mission, vision, values — the why behind every decision." },
              { label: "Culture", desc: "Communication norms, conflict resolution, how the team thinks." },
              { label: "Structure", desc: "Agents, teams, hierarchy — who reports to whom." },
              { label: "Policies", desc: "Budgets, permissions, escalation paths, guardrails." },
              { label: "Playbooks", desc: "How work flows — from ticket to deploy to retro." },
              { label: "Evolution", desc: "Living document. Your org grows, the file grows with it." },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-5"
              >
                <h3 className="mb-2 text-sm font-semibold tracking-wide text-cyan-400 uppercase">
                  {item.label}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A Taste */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-100 md:text-3xl">
            A taste
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-900/80 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-2 font-mono text-xs text-slate-500">
                ORG.md
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-slate-300">
              {orgSnippet}
            </pre>
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-2xl font-bold text-slate-100 md:text-3xl">
            SimCity for agent organizations
          </h2>
          <div className="space-y-4 text-slate-400 leading-relaxed text-lg">
            <p>
              Define your org. Deploy it. Watch it work.
              See where the bottlenecks are. Tune. Commit. Push.
            </p>
            <p>
              Your organization evolves as a file in git.
              Not as tribal knowledge. Not as a wiki nobody reads.
              As code that runs.
            </p>
            <p className="text-slate-300 italic">
              The best organizations aren't built — they're written.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-100 md:text-4xl">
            See it running
          </h2>
          <p className="mb-8 text-slate-400 text-lg">
            BikiniBottom is a live reference implementation — 22 agents,
            organized by ORG.md, running right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
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
              Getting Started
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
