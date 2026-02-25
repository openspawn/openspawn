import { DocsLayout } from "../../components/docs-layout";
import { Link } from "@tanstack/react-router";
import { useTitle } from "../../hooks/use-title";

const sections = [
  { to: "/docs/getting-started", emoji: "🚀", title: "Getting Started", desc: "Get OpenSpawn running in 2 minutes." },
  { to: "/docs/openclaw", emoji: "🦞", title: "OpenClaw Integration", desc: "Add org structure to your OpenClaw agents." },
  { to: "/docs/protocols/a2a", emoji: "🔗", title: "A2A Protocol", desc: "Agent-to-Agent discovery, tasks, and streaming." },
  { to: "/docs/protocols/mcp", emoji: "🔌", title: "MCP Tools", desc: "7 tools via Streamable HTTP." },
  { to: "/docs/features/dashboard", emoji: "📊", title: "Dashboard", desc: "Real-time agent visualization." },
  { to: "/docs/features/model-router", emoji: "🔀", title: "Model Router", desc: "Smart LLM routing with fallbacks." },
];

export function DocsIndex() {
  useTitle("Documentation");
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Documentation</h1>
      <p className="mb-10 text-lg text-slate-400">
        Learn how to set up, configure, and integrate with OpenSpawn.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-5 transition hover:border-cyan-500/20 hover:bg-cyan-500/5 no-underline"
          >
            <div className="mb-2 text-2xl">{s.emoji}</div>
            <div className="font-semibold text-slate-200 group-hover:text-cyan-400">{s.title}</div>
            <div className="text-sm text-slate-500">{s.desc}</div>
          </Link>
        ))}
      </div>
    </DocsLayout>
  );
}
