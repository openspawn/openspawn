export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950">
      {/* ── "Ready to graduate?" strip ─────────────────────────────────────── */}
      <div className="border-b border-white/5 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-transparent py-8">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-100">🎓 Ready to graduate from sub-agents?</p>
            <p className="text-sm text-slate-500 mt-0.5">Deploy your first OpenSpawn org in 5 minutes. MIT licensed, runs locally.</p>
          </div>
          <a
            href="/getting-started"
            className="shrink-0 rounded-xl bg-cyan-500 px-6 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-cyan-400 whitespace-nowrap"
          >
            Get Started →
          </a>
        </div>
      </div>

      <div className="py-12">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span>🪸</span>
                <span className="gradient-text">OpenSpawn</span>
              </div>
              <p className="text-sm text-slate-500">
                Graduate from sub-agents. The multi-agent platform for persistent, coordinated AI orgs.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="https://bikinibottom.ai/app/" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">
                    Live Demo ↗
                  </a>
                </li>
                <li><a href="/getting-started" className="hover:text-cyan-400 transition">Getting Started</a></li>
                <li><a href="/docs/comparison" className="hover:text-cyan-400 transition">Framework Comparison</a></li>
                <li><a href="/docs/protocols/a2a" className="hover:text-cyan-400 transition">A2A Protocol</a></li>
                <li><a href="/docs/protocols/mcp" className="hover:text-cyan-400 transition">MCP Tools</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Features</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="/docs/features/model-router" className="hover:text-cyan-400 transition">Model Router</a></li>
                <li><a href="/docs/features/dashboard" className="hover:text-cyan-400 transition">Live Dashboard</a></li>
                <li><a href="/org-md" className="hover:text-cyan-400 transition">ORG.md</a></li>
                <li><a href="/templates" className="hover:text-cyan-400 transition">Templates</a></li>
                <li><a href="/plugins" className="hover:text-cyan-400 transition">Plugins</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-300">Community</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="https://github.com/openspawn/openspawn" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">GitHub</a></li>
                <li><a href="/docs/agent-quickstart" className="hover:text-cyan-400 transition">Agent Quickstart</a></li>
                <li><a href="/docs" className="hover:text-cyan-400 transition">Documentation</a></li>
                <li><span className="text-slate-600">MIT License</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <span>© {new Date().getFullYear()} OpenSpawn. Open source under MIT.</span>
            <span>
              BikiniBottom demo powered by{" "}
              <a href="https://bikinibottom.ai/app/" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">
                bikinibottom.ai ↗
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
