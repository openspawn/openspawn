export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950 py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-3 text-lg font-bold">
              <span className="mr-2">🍍</span>
              <span className="gradient-text">BikiniBottom</span>
            </div>
            <p className="text-sm text-slate-500">The control plane your AI agents deserve.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-300">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="/app/" className="hover:text-cyan-400 transition">Dashboard</a></li>
              <li><a href="/docs/getting-started" className="hover:text-cyan-400 transition">Getting Started</a></li>
              <li><a href="/docs/protocols/a2a" className="hover:text-cyan-400 transition">A2A Protocol</a></li>
              <li><a href="/docs/protocols/mcp" className="hover:text-cyan-400 transition">MCP Tools</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-300">Features</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="/docs/features/model-router" className="hover:text-cyan-400 transition">Model Router</a></li>
              <li><a href="/docs/features/dashboard" className="hover:text-cyan-400 transition">Live Dashboard</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-300">Community</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="https://github.com/openspawn/openspawn" target="_blank" rel="noopener" className="hover:text-cyan-400 transition">GitHub</a></li>
              <li><span className="text-slate-600">MIT License</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} OpenSpawn. Open source under MIT.
        </div>
      </div>
    </footer>
  );
}
