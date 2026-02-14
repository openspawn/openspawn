import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">🍍</span>
          <span className="gradient-text">BikiniBottom</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link to="/docs" className="text-sm text-slate-400 transition hover:text-cyan-400">
            Docs
          </Link>
          <Link to="/docs/protocols/a2a" className="text-sm text-slate-400 transition hover:text-cyan-400">
            Protocols
          </Link>
          <a
            href="https://github.com/openspawn/openspawn"
            target="_blank"
            rel="noopener"
            className="text-sm text-slate-400 transition hover:text-cyan-400"
          >
            GitHub
          </a>
        </div>
        <a
          href="/app/"
          className="rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
        >
          Launch Demo →
        </a>
      </div>
    </nav>
  );
}
