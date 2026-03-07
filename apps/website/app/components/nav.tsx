import { useState } from "react";
import { Link } from "@tanstack/react-router";

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="text-2xl">🪸</span>
          <span className="gradient-text">OpenSpawn</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link
            to="/getting-started"
            className="text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            Get Started
          </Link>
          <Link to="/org-md" className="text-sm text-slate-400 transition hover:text-cyan-400">
            ORG.md
          </Link>
          <Link to="/templates" className="text-sm text-slate-400 transition hover:text-cyan-400">
            Templates
          </Link>
          <Link to="/plugins" className="text-sm text-slate-400 transition hover:text-cyan-400">
            Plugins
          </Link>
          <Link to="/docs" className="text-sm text-slate-400 transition hover:text-cyan-400">
            Docs
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
            href="https://bikinibottom.ai/app/"
            target="_blank"
            rel="noopener"
            className="rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
          >
            Live Demo →
          </a>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-cyan-400 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-white/5 bg-navy-950/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1 px-8 py-4">
            <Link
              to="/getting-started"
              className="rounded-lg px-3 py-2 text-sm font-medium text-cyan-400 transition hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              Get Started
            </Link>
            <Link
              to="/org-md"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400"
              onClick={() => setMenuOpen(false)}
            >
              ORG.md
            </Link>
            <Link
              to="/templates"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400"
              onClick={() => setMenuOpen(false)}
            >
              Templates
            </Link>
            <Link
              to="/plugins"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400"
              onClick={() => setMenuOpen(false)}
            >
              Plugins
            </Link>
            <Link
              to="/docs"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400"
              onClick={() => setMenuOpen(false)}
            >
              Docs
            </Link>
            <a
              href="https://github.com/openspawn/openspawn"
              target="_blank"
              rel="noopener"
              className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-cyan-400"
            >
              GitHub
            </a>
            <a
              href="https://bikinibottom.ai/app/"
              target="_blank"
              rel="noopener"
              className="rounded-lg px-3 py-2 text-sm text-cyan-400 transition hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              Live Demo →
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
