/**
 * GlobalSearch — ⌘K / Ctrl+K search modal
 *
 * Responsive behaviour:
 *  - Mobile  (<sm): fixed inset-0, full-screen sheet sliding from top
 *  - Desktop (sm+): centred dialog with max-w-lg
 *
 * No new npm packages — implemented with createPortal + useEffect only.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useAgents, useTasks } from "../hooks";
import { Link } from "@tanstack/react-router";

/* ── Types ────────────────────────────────────────────────────── */
interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  kind: "agent" | "task";
}

/* ── Trigger button (used inside Layout header) ─────────────── */
export function GlobalSearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open global search"
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/30">
        ⌘K
      </kbd>
    </button>
  );
}

/* ── Modal ────────────────────────────────────────────────────── */
interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { agents } = useAgents();
  const { tasks } = useTasks();

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  /* Escape to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Build results */
  const results: SearchResult[] = [];
  if (query.trim().length >= 1) {
    const q = query.toLowerCase();
    for (const a of agents) {
      if (a.name.toLowerCase().includes(q) || (a.role ?? "").toLowerCase().includes(q)) {
        results.push({
          id: `agent-${a.id}`,
          label: a.name,
          sublabel: a.role ?? "Agent",
          href: "/agents",
          kind: "agent",
        });
      }
    }
    for (const t of tasks) {
      if (t.title.toLowerCase().includes(q)) {
        results.push({
          id: `task-${t.id}`,
          label: t.title,
          sublabel: t.status,
          href: "/tasks",
          kind: "task",
        });
      }
    }
  }

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/*
        Modal panel
        Mobile  (default): fixed inset-x-0 top-0, full-width, rounded bottom corners
        Desktop (sm+)     : centred, max-w-lg, rounded all corners, top-[20vh]
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className={cn(
          "fixed z-[101] flex flex-col bg-[hsl(var(--card))] border border-white/10 shadow-2xl",
          // Mobile: full-width sheet from top
          "inset-x-0 top-0 rounded-b-2xl max-h-[85vh]",
          // Desktop: centred dialog
          "sm:inset-x-auto sm:top-[20vh] sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl sm:max-h-[60vh]",
        )}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-4 w-4 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search agents, tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="text-white/40 hover:text-white/70 transition-colors p-1 rounded-md hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {query.trim().length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-white/30">
              Type to search agents and tasks…
            </div>
          )}
          {query.trim().length >= 1 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-white/30">
              No results for <span className="text-white/50">"{query}"</span>
            </div>
          )}
          {results.length > 0 && (
            <ul className="py-2">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    to={r.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                        r.kind === "agent"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-violet-500/20 text-violet-400",
                      )}
                    >
                      {r.kind}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-white truncate">{r.label}</span>
                      {r.sublabel && (
                        <span className="block text-xs text-white/40 truncate">{r.sublabel}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ── Hook: ⌘K / Ctrl+K shortcut ──────────────────────────────── */
export function useGlobalSearchShortcut(onOpen: () => void) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    },
    [onOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
