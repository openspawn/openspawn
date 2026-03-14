import { DocsLayout } from "../../components/docs-layout";
import { Link } from "@tanstack/react-router";
import { useTitle } from "../../hooks/use-title";

const sections = [
  {
    to: "/docs/getting-started",
    emoji: "🚀",
    title: "Getting Started",
    desc: "Get OpenSpawn running in 2 minutes.",
  },
  {
    to: "/docs/openclaw",
    emoji: "🦞",
    title: "OpenClaw Integration",
    desc: "Add org structure to your OpenClaw agents.",
  },
  {
    to: "/docs/protocols/a2a",
    emoji: "🔗",
    title: "A2A Protocol",
    desc: "Agent-to-Agent discovery, tasks, and streaming.",
  },
  {
    to: "/docs/protocols/mcp",
    emoji: "🔌",
    title: "MCP Tools",
    desc: "7 tools via Streamable HTTP.",
  },
  {
    to: "/docs/features/dashboard",
    emoji: "📊",
    title: "Dashboard",
    desc: "Real-time agent visualization.",
  },
  {
    to: "/docs/features/model-router",
    emoji: "🔀",
    title: "Model Router",
    desc: "Smart LLM routing with fallbacks.",
  },
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

      {/* Key Concepts */}
      <h2 className="mt-14 mb-6 text-2xl font-bold text-slate-100">Key Concepts</h2>
      <div className="space-y-4">
        {[
          {
            name: "ORG.md",
            desc: "A single markdown file that defines your entire agent organization — roles, hierarchy, culture, policies, and playbooks. It's infrastructure-as-code for agent teams.",
          },
          {
            name: "Hierarchy",
            desc: "Agents have levels (L1–L10) and report-to relationships. Heading depth in ORG.md determines hierarchy. Tasks flow down, escalations flow up.",
          },
          {
            name: "Communication Protocol",
            desc: "4 message types (TASK, RESULT, ESCALATION, DECISION), silence-as-success, files-over-chat. Eliminates 40–60% of wasted coordination tokens.",
          },
          {
            name: "Dashboard",
            desc: "Real-time React UI showing network graph, task timelines, agent cards, trust scores, and org health. Powered by SSE streaming.",
          },
          {
            name: "MCP & A2A",
            desc: "Every org exposes 7 MCP tools and A2A agent cards. Any MCP-compatible client or A2A-capable agent can discover and interact with your org.",
          },
        ].map((concept) => (
          <div
            key={concept.name}
            className="rounded-lg border border-white/5 bg-white/[0.02] px-5 py-4"
          >
            <p className="mb-1 font-semibold text-slate-200">{concept.name}</p>
            <p className="text-sm text-slate-400">{concept.desc}</p>
          </div>
        ))}
      </div>
    </DocsLayout>
  );
}
