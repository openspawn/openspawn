import { useState, useMemo } from "react";
import { Nav } from "../components/nav";
import { Footer } from "../components/footer";

/* ─── Plugin Data ──────────────────────────────────────────────────────────── */

type Category = "Coordination" | "Identity" | "Communication" | "Monitoring" | "Storage" | "DevOps";
type Status = "available" | "coming-soon";

interface Plugin {
  name: string;
  slug: string;
  emoji: string;
  category: Category;
  tagline: string;
  description: string;
  status: Status;
}

const plugins: Plugin[] = [
  { name: "Coordinator", slug: "coordinator", emoji: "📋", category: "Coordination", tagline: "SQLite task board + MCP tools", description: "Atomic task claiming, budget tracking, event audit trail.", status: "available" },
  { name: "Dashboard", slug: "dashboard", emoji: "📊", category: "Monitoring", tagline: "Real-time org visualization", description: "Kanban board, org chart, agent controls.", status: "available" },
  { name: "Identity", slug: "identity", emoji: "🔑", category: "Identity", tagline: "Ed25519 agent keypairs", description: "Sign messages, verify identity, cross-org federation.", status: "available" },
  { name: "Budget Guard", slug: "budget-guard", emoji: "💰", category: "Monitoring", tagline: "Token/cost enforcement", description: "Set per-agent limits, auto-pause on overspend.", status: "coming-soon" },
  { name: "Git Sync", slug: "git-sync", emoji: "🔄", category: "DevOps", tagline: "Automatic git operations", description: "Branch per agent, auto-commit, PR creation.", status: "coming-soon" },
  { name: "Slack Bridge", slug: "slack-bridge", emoji: "💬", category: "Communication", tagline: "Agent ↔ Slack integration", description: "Human-in-the-loop via Slack channels.", status: "coming-soon" },
  { name: "S3 Artifacts", slug: "s3-artifacts", emoji: "☁️", category: "Storage", tagline: "Cloud artifact storage", description: "Upload results, share across orgs.", status: "coming-soon" },
  { name: "Prometheus Exporter", slug: "prometheus-exporter", emoji: "📈", category: "Monitoring", tagline: "Metrics export", description: "Grafana dashboards for agent performance.", status: "coming-soon" },
  { name: "Review Gate", slug: "review-gate", emoji: "✅", category: "DevOps", tagline: "Automated code review", description: "PR quality checks before merge.", status: "coming-soon" },
  { name: "Webhook Router", slug: "webhook-router", emoji: "🔗", category: "Communication", tagline: "External event triggers", description: "GitHub webhooks, CI notifications.", status: "coming-soon" },
];

const categories: Array<"All" | Category> = ["All", "Coordination", "Identity", "Communication", "Monitoring", "Storage", "DevOps"];

/* ─── Components ───────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Status }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Coming Soon
    </span>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-400 ring-1 ring-cyan-500/20">
      {category}
    </span>
  );
}

function PluginCard({ plugin }: { plugin: Plugin }) {
  const [copied, setCopied] = useState(false);

  const handleInstall = () => {
    navigator.clipboard.writeText(`openspawn plugin add ${plugin.slug}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* noop */ });
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-cyan-500/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-cyan-500/5">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-3xl">{plugin.emoji}</span>
        <StatusBadge status={plugin.status} />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-white">{plugin.name}</h3>
      <p className="mb-1 text-sm text-cyan-400/80">{plugin.tagline}</p>
      <p className="mb-4 flex-1 text-sm text-slate-400">{plugin.description}</p>
      <div className="flex items-center justify-between gap-3">
        <CategoryBadge category={plugin.category} />
        {plugin.status === "available" ? (
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-lg bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
          >
            {copied ? "Copied!" : "Install"}
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 ring-1 ring-amber-500/20 transition hover:bg-amber-500/20"
          >
            Notify Me
          </button>
        )}
      </div>
      {plugin.status === "available" && (
        <div className="mt-3 rounded-lg bg-navy-950/50 px-3 py-2 font-mono text-xs text-slate-500 ring-1 ring-white/5">
          openspawn plugin add {plugin.slug}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export function PluginsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return plugins.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.tagline.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-6">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            <span className="gradient-text">SpawnHub</span>
            <span className="text-slate-300"> — Plugins for Agent Organizations</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-400">
            Browse and install plugins to extend your agent org with task coordination, monitoring, identity, DevOps integrations, and more.
          </p>
          <div className="mx-auto max-w-xl">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search plugins..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-500/30 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs + Grid */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeCategory === cat
                  ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30"
                  : "bg-white/[0.03] text-slate-400 ring-1 ring-white/5 hover:bg-white/[0.06] hover:text-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Plugin Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            No plugins match your search.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <PluginCard key={p.slug} plugin={p} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500">
            {plugins.filter((p) => p.status === "available").length} available · {plugins.filter((p) => p.status === "coming-soon").length} coming soon · More plugins shipping every week
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
