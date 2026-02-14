import { DocsLayout, CodeBlock } from "../../../components/docs-layout";

export function DashboardDocs() {
  return (
    <DocsLayout>
      <h1 className="mb-2 text-4xl font-bold text-slate-100">Dashboard</h1>
      <p className="mb-8 text-lg text-slate-400">
        Real-time React dashboard with network graph, task timeline, cost charts, and agent monitoring.
      </p>

      <div className="mb-8 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
        💡 See it live at <a href="https://bikinibottom.ai" className="underline">bikinibottom.ai</a>
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Overview</h2>
      <p className="mb-4 text-slate-400">The dashboard starts automatically when you run <code className="rounded bg-white/10 px-1.5 py-0.5 text-cyan-400">npx bikinibottom start</code>. It provides:</p>
      <ul className="mb-6 ml-4 list-disc space-y-2 text-slate-400">
        <li><strong className="text-slate-200">Agent network graph</strong> — Visualize the org hierarchy and active connections</li>
        <li><strong className="text-slate-200">Task timeline</strong> — Real-time feed of task creation, delegation, and completion</li>
        <li><strong className="text-slate-200">Cost charts</strong> — Per-provider spending, savings calculator</li>
        <li><strong className="text-slate-200">Agent status</strong> — Idle, busy, offline for every agent</li>
        <li><strong className="text-slate-200">Router metrics</strong> — Provider health, latency, fallback frequency</li>
      </ul>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">Pages</h2>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">Home</h3>
      <p className="mb-4 text-slate-400">Main view with agent network graph showing live task flows. Agents light up when working.</p>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">Tasks</h3>
      <p className="mb-4 text-slate-400">All tasks with filtering by state (submitted, working, completed, failed). Click any task for full delegation chain.</p>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">Agents</h3>
      <p className="mb-4 text-slate-400">Grid view of all agents showing level, domain, status, and current task.</p>
      <h3 className="mt-6 mb-2 text-lg font-semibold text-slate-200">Router</h3>
      <p className="mb-4 text-slate-400">Provider status dashboard: online/offline, rate limits, cost breakdown, and latency distribution.</p>

      <h2 className="mt-10 mb-4 text-2xl font-bold text-slate-100">API Endpoints</h2>
      <CodeBlock title="bash">{`# Org stats
curl https://bikinibottom.ai/api/org/stats

# Agent list
curl https://bikinibottom.ai/api/agents

# Task list
curl https://bikinibottom.ai/api/tasks`}</CodeBlock>
    </DocsLayout>
  );
}
