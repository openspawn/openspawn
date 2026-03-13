import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { create, search, type AnyOrama } from "@orama/orama";

interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
}

interface SearchIndexEntry {
  title: string;
  path: string;
  content: string;
  section: string;
}

interface DocsSearchProps {
  indexUrl: string;
}

export function DocsSearch({ indexUrl }: DocsSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [db, setDb] = useState<AnyOrama | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load search index on first focus
  const handleLoadIndex = useCallback(async () => {
    if (db) return;
    try {
      const res = await fetch(indexUrl);
      const entries: SearchIndexEntry[] = await res.json();
      const orama = create({
        schema: {
          title: "string" as const,
          path: "string" as const,
          content: "string" as const,
          section: "string" as const,
        },
      });
      for (const entry of entries) {
        // @ts-expect-error -- Orama's insert type is overly strict with schema inference
        orama.insert(entry);
      }
      setDb(orama);
    } catch {
      // Search unavailable — degrade gracefully
    }
  }, [db, indexUrl]);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      if (!db || q.length < 2) {
        setResults([]);
        return;
      }
      const res = await search(db, { term: q, limit: 8 });
      setResults(
        res.hits.map((hit) => {
          const doc = hit.document as unknown as SearchIndexEntry;
          const idx = doc.content.toLowerCase().indexOf(q.toLowerCase());
          const start = Math.max(0, idx - 40);
          const end = Math.min(doc.content.length, idx + q.length + 80);
          const excerpt =
            idx >= 0
              ? `${start > 0 ? "..." : ""}${doc.content.slice(start, end)}${end < doc.content.length ? "..." : ""}`
              : doc.content.slice(0, 120) + "...";
          return { title: doc.title, path: doc.path, excerpt };
        }),
      );
    },
    [db],
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search docs... (⌘K)"
          value={query}
          onFocus={() => {
            setIsOpen(true);
            handleLoadIndex();
          }}
          onChange={(e) => {
            handleSearch(e.target.value);
            setIsOpen(true);
          }}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 pl-9 text-sm text-slate-300 placeholder:text-slate-500 focus:border-cyan-500/30 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 shadow-xl">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">No results found</div>
          ) : (
            results.map((result) => (
              <button
                key={result.path}
                onClick={() => {
                  navigate({ to: result.path });
                  setIsOpen(false);
                  setQuery("");
                }}
                className="block w-full px-4 py-3 text-left transition hover:bg-white/5 border-b border-white/5 last:border-b-0"
              >
                <div className="text-sm font-medium text-slate-200">{result.title}</div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-2">{result.excerpt}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
