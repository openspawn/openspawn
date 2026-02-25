import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function NotFoundPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      {/* Glowing backdrop */}
      <div className="pointer-events-none absolute">
        <div className="h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
      </div>

      <div className="relative">
        <div className="mb-6 text-7xl md:text-8xl">{tick % 2 === 0 ? "🪸" : "🐠"}</div>

        <div className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-cyan-500">
          404 — Page Not Found
        </div>

        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-100 md:text-5xl">
          Lost in the <span className="gradient-text">deep end</span>
        </h1>

        <p className="mx-auto mb-10 max-w-md text-slate-400">
          This page doesn't exist. Maybe your agent took a wrong turn. Let's get
          you back to the surface.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="glow-cyan rounded-xl bg-cyan-500 px-8 py-3 text-base font-semibold text-navy-950 transition hover:bg-cyan-400"
          >
            ← Back to Home
          </Link>
          <Link
            to="/docs"
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-base font-semibold text-slate-200 transition hover:bg-white/10"
          >
            View Docs
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-12 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
          {[
            { label: "Getting Started", href: "/docs/getting-started" },
            { label: "A2A Protocol", href: "/docs/protocols/a2a" },
            { label: "MCP Tools", href: "/docs/protocols/mcp" },
            { label: "Model Router", href: "/docs/features/model-router" },
            { label: "Dashboard", href: "/docs/features/dashboard" },
            { label: "ORG.md", href: "/org-md" },
          ].map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-sm text-slate-400 transition hover:border-cyan-500/20 hover:bg-cyan-500/5 hover:text-cyan-400"
            >
              {l.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
