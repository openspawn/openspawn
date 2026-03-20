import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, Brain, ThumbsUp, ThumbsDown, Network } from "lucide-react";
import { PageHeader, EmptyState } from "@openspawn/dashboard-ui";
import {
  useMemories,
  useMemorySearch,
  useGraphCytoscape,
  useAgents,
} from "@openspawn/dashboard-data";
import { useMemoryList, useMemoryFeedback } from "@openspawn/dashboard-data";
import { cn } from "../lib/utils";
import CytoscapeComponent from "react-cytoscapejs";

/* ── constants ────────────────────────────────────────── */

const MEMORY_TYPES = ["fact", "lesson", "preference", "decision"] as const;

const TYPE_COLORS: Record<string, string> = {
  fact: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  lesson: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  preference: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  decision: "bg-green-500/20 text-green-400 border-green-500/30",
};

const TABS = [
  { id: "feed", label: "Memory Feed", icon: Brain },
  { id: "graph", label: "Knowledge Graph", icon: Network },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PAGE_SIZE = 20;

/* ── helpers ──────────────────────────────────────────── */

function timeAgo(date: string | null | undefined): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── main component ───────────────────────────────────── */

export function MemoryPage() {
  const [tab, setTab] = useState<TabId>("feed");

  return (
    <div className="space-y-6">
      <PageHeader title="Memory" description="Agent memories and knowledge graph" />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors",
              tab === t.id
                ? "bg-white/10 text-white font-medium"
                : "text-white/50 hover:text-white/80 hover:bg-white/5",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "feed" ? <MemoryFeed /> : <KnowledgeGraph />}
    </div>
  );
}

/* ── Memory Feed ──────────────────────────────────────── */

function MemoryFeed() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  // Track user's vote per memory: "up" | "down" | null (togglable)
  const [votes, setVotes] = useState<Record<string, "up" | "down" | null>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim());
      setPage(0);
    }, 300);
  }, []);

  // Fetch agents for filter chips
  const { agents } = useAgents();

  // Use search endpoint when searching, list endpoint otherwise
  const isSearching = debouncedSearch.length > 0;

  const searchResult = useMemorySearch(debouncedSearch);
  const listResult = useMemoryList({
    type: typeFilter,
    agent_id: agentFilter,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const feedbackMutation = useMemoryFeedback();

  const memories = useMemo(() => {
    if (isSearching) {
      const items = searchResult.memories ?? [];
      // Map search results to a common shape
      return items.map((m: Record<string, unknown>) => ({
        id: (m as { memory_id?: string }).memory_id ?? (m as { id?: string }).id ?? "",
        content: (m as { content?: string }).content ?? "",
        type: (m as { memory_type?: string }).memory_type ?? (m as { type?: string }).type ?? "fact",
        agent_id: (m as { agent_id?: string }).agent_id ?? "",
        confidence: (m as { confidence?: number }).confidence ?? 0,
        created_at: (m as { created_at?: string }).created_at ?? "",
        occurred_at: (m as { occurred_at?: string }).occurred_at ?? (m as { created_at?: string }).created_at ?? "",
        helpful_count: (m as { helpful_count?: number }).helpful_count ?? 0,
        unhelpful_count: (m as { unhelpful_count?: number }).unhelpful_count ?? 0,
        score: (m as { score?: number }).score,
      }));
    }

    const resp = listResult.data;
    if (!resp) return [];
    const data = "data" in resp ? (resp as { data: unknown[] }).data : resp;
    if (!Array.isArray(data)) return [];
    return data.map((m: Record<string, unknown>) => ({
      id: (m as { id?: string }).id ?? "",
      content: (m as { content?: string }).content ?? "",
      type: (m as { type?: string }).type ?? "fact",
      agent_id: (m as { agent_id?: string }).agent_id ?? "",
      confidence: (m as { confidence?: number }).confidence ?? 0,
      created_at: (m as { created_at?: string }).created_at ?? "",
      occurred_at: (m as { occurred_at?: string }).occurred_at ?? (m as { created_at?: string }).created_at ?? "",
      helpful_count: (m as { helpful_count?: number }).helpful_count ?? 0,
      unhelpful_count: (m as { unhelpful_count?: number }).unhelpful_count ?? 0,
      score: undefined as number | undefined,
    }));
  }, [isSearching, searchResult.memories, listResult.data]);

  const totalPages = useMemo(() => {
    if (isSearching) return 1;
    const resp = listResult.data;
    if (!resp || !("meta" in resp)) return 1;
    const meta = (resp as { meta?: { total?: number } }).meta;
    if (!meta?.total) return 1;
    return Math.ceil(meta.total / PAGE_SIZE);
  }, [isSearching, listResult.data]);

  const loading = isSearching ? searchResult.loading : listResult.isLoading;

  const agentNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of agents) m[a.id] = a.name;
    return m;
  }, [agents]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search memories..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Type filters */}
        {MEMORY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTypeFilter((prev) => (prev === t ? null : t));
              setPage(0);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize",
              typeFilter === t
                ? TYPE_COLORS[t]
                : "border-white/10 text-white/40 hover:text-white/60 hover:border-white/20",
            )}
          >
            {t}
          </button>
        ))}

        {/* Agent filter */}
        {agents.length > 0 && (
          <select
            value={agentFilter ?? ""}
            onChange={(e) => {
              setAgentFilter(e.target.value || null);
              setPage(0);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 focus:outline-none focus:border-white/20"
          >
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-white/40 text-sm">Loading memories...</div>
      ) : memories.length === 0 ? (
        <EmptyState
          title="No memories found"
          description={
            isSearching
              ? "No memories match your search."
              : "No memories recorded yet. Memories appear as agents work."
          }
        />
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3 hover:border-white/10 transition-colors"
            >
              {/* Top row: type badge + agent + timestamp */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    TYPE_COLORS[memory.type] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30",
                  )}
                >
                  {memory.type}
                </span>
                {memory.agent_id && (
                  <span className="text-xs text-white/40">
                    {agentNameMap[memory.agent_id] ?? memory.agent_id.slice(0, 8)}
                  </span>
                )}
                <span className="text-xs text-white/30 ml-auto shrink-0">
                  {timeAgo(memory.occurred_at || memory.created_at)}
                </span>
              </div>

              {/* Content */}
              <p className="text-sm text-white/80 leading-relaxed">{memory.content}</p>

              {/* Bottom row: confidence + search score + feedback */}
              <div className="flex items-center gap-4 text-xs text-white/30">
                <span>Confidence: {Math.round(memory.confidence * 100)}%</span>
                {memory.score != null && (
                  <span>Relevance: {Math.round(memory.score * 100)}%</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => {
                      const current = votes[memory.id];
                      const next = current === "up" ? null : "up";
                      setVotes((v) => ({ ...v, [memory.id]: next }));
                      if (next === "up") {
                        feedbackMutation.mutate({ memoryId: memory.id, helpful: true });
                      }
                      // null = undo vote (no API call for undo, just visual)
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 transition-colors",
                      votes[memory.id] === "up"
                        ? "bg-green-500/20 text-green-400"
                        : "text-white/30 hover:bg-green-500/10 hover:text-green-400",
                    )}
                    title={votes[memory.id] === "up" ? "Remove vote" : "Helpful"}
                  >
                    <ThumbsUp className="h-3 w-3" />
                    {memory.helpful_count > 0 && <span>{memory.helpful_count}</span>}
                  </button>
                  <button
                    onClick={() => {
                      const current = votes[memory.id];
                      const next = current === "down" ? null : "down";
                      setVotes((v) => ({ ...v, [memory.id]: next }));
                      if (next === "down") {
                        feedbackMutation.mutate({ memoryId: memory.id, helpful: false });
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 transition-colors",
                      votes[memory.id] === "down"
                        ? "bg-red-500/20 text-red-400"
                        : "text-white/30 hover:bg-red-500/10 hover:text-red-400",
                    )}
                    title={votes[memory.id] === "down" ? "Remove vote" : "Not helpful"}
                  >
                    <ThumbsDown className="h-3 w-3" />
                    {memory.unhelpful_count > 0 && <span>{memory.unhelpful_count}</span>}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {!isSearching && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-white/40">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Knowledge Graph ──────────────────────────────────── */

const CYTOSCAPE_STYLESHEET: cytoscape.Stylesheet[] = [
  {
    selector: "node",
    style: {
      label: "data(label)" as unknown as string,
      "text-valign": "center",
      "text-halign": "center",
      color: "#fff",
      "font-size": "10px",
      "text-outline-color": "#000",
      "text-outline-width": 1,
      width: 40,
      height: 40,
    },
  },
  {
    selector: "node[type='entity']",
    style: {
      "background-color": "#06b6d4",
      "border-color": "#22d3ee",
      "border-width": 2,
    },
  },
  {
    selector: "node[type='memory']",
    style: {
      "background-color": "#8b5cf6",
      "border-color": "#a78bfa",
      "border-width": 2,
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#334155",
      "target-arrow-color": "#334155",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      label: "data(label)" as unknown as string,
      "font-size": "8px",
      color: "#64748b",
      "text-rotation": "autorotate",
    },
  },
  {
    selector: ":selected",
    style: {
      "border-color": "#f59e0b",
      "border-width": 3,
    },
  },
];

const CYTOSCAPE_LAYOUT = {
  name: "cose",
  animate: false,
  padding: 40,
  nodeRepulsion: () => 8000,
  idealEdgeLength: () => 100,
};

function KnowledgeGraph() {
  const { nodes, edges, loading } = useGraphCytoscape();
  const [selectedNode, setSelectedNode] = useState<Record<string, unknown> | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = useMemo(() => {
    if (!nodes.length && !edges.length) return [];
    return [
      ...nodes.map((n: { data: Record<string, unknown> }) => ({
        data: {
          ...n.data,
          label: (n.data.label as string) ?? (n.data.name as string) ?? (n.data.id as string) ?? "?",
          type: (n.data.type as string) ?? "entity",
        },
      })),
      ...edges.map((e: { data: Record<string, unknown> }) => ({
        data: {
          ...e.data,
          label: (e.data.label as string) ?? (e.data.relationship as string) ?? "",
        },
      })),
    ];
  }, [nodes, edges]);

  const handleCyInit = useCallback((cy: cytoscape.Core) => {
    cyRef.current = cy;
    cy.on("tap", "node", (evt) => {
      const data = evt.target.data();
      setSelectedNode(data);
    });
    cy.on("tap", (evt) => {
      if (evt.target === cy) setSelectedNode(null);
    });
  }, []);

  if (loading) {
    return <div className="text-white/40 text-sm">Loading knowledge graph...</div>;
  }

  if (elements.length === 0) {
    return (
      <EmptyState
        title="No knowledge graph data"
        description="The knowledge graph will populate as agents store memories and entities are extracted."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-cyan-500" />
          Entity
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-violet-500" />
          Memory
        </div>
      </div>

      {/* Graph container */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden relative" style={{ height: 500 }}>
        <CytoscapeComponent
          elements={elements}
          stylesheet={CYTOSCAPE_STYLESHEET}
          layout={CYTOSCAPE_LAYOUT}
          style={{ width: "100%", height: "100%" }}
          cy={handleCyInit}
        />
      </div>

      {/* Selected node details */}
      {selectedNode && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border",
                selectedNode.type === "entity"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                  : "bg-violet-500/20 text-violet-400 border-violet-500/30",
              )}
            >
              {(selectedNode.type as string) ?? "node"}
            </span>
            <span className="text-sm font-medium text-white">
              {(selectedNode.label as string) ?? (selectedNode.name as string) ?? (selectedNode.id as string)}
            </span>
          </div>
          {selectedNode.entity_type && (
            <div className="text-xs text-white/40">
              Entity type: {selectedNode.entity_type as string}
            </div>
          )}
          {selectedNode.content && (
            <p className="text-sm text-white/60">{selectedNode.content as string}</p>
          )}
          {selectedNode.description && (
            <p className="text-sm text-white/60">{selectedNode.description as string}</p>
          )}
        </div>
      )}
    </div>
  );
}
