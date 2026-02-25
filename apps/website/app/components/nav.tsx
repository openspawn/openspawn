import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
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
        <div className="flex items-center gap-3">
          <a
            href="/app/"
            className="rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
          >
            Launch Demo →
          </a>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-400 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-white/5 bg-navy-950/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-8 py-4">
            <Link to="/docs" className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>
              Docs
            </Link>
            <Link to="/docs/protocols/a2a" className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400" onClick={() => setMenuOpen(false)}>
              Protocols
            </Link>
            <a
              href="https://github.com/openspawn/openspawn"
              target="_blank"
              rel="noopener"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
