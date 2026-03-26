import { useState, useMemo, useEffect } from "react";
import { Search, Shield, Clock, TrendingUp } from "lucide-react";
import { PageHeader, Badge, EmptyState } from "@openspawn/dashboard-ui";
import { AgentStatus, useDashboardPanels } from "@openspawn/dashboard-data";
import { cn } from "../lib/utils";
import { useAgents, useTasks } from "../hooks";
import { useParams, useNavigate } from "@tanstack/react-router";

function timeAgo(date: string | null | undefined): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function levelLabel(level: number): string {
  if (level >= 10) return "CEO";
  if (level >= 9) return "VP";
  if (level >= 7) return "Lead";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Junior";
  return "Intern";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  founder: "bg-amber-500/20 text-amber-400",
  admin: "bg-cyan-500/20 text-cyan-400",
  worker: "bg-violet-500/20 text-violet-400",
  hr: "bg-emerald-500/20 text-emerald-400",
};

export function AgentsPage() {
  const { agents, loading } = useAgents();
  const { tasks } = useTasks();
  const { openAgentPanel } = useDashboardPanels({ agents, tasks });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Auto-open agent panel from URL param
  const params = (() => { try { return useParams({ from: "/agents/$agentId" }); } catch { return { agentId: undefined }; } })() as { agentId?: string };
  useEffect(() => {
    if (params.agentId && agents.length > 0) {
      const agent = agents.find((a) => a.agentId === params.agentId || a.id === params.agentId);
      if (agent) openAgentPanel(agent.id);
    }
  }, [params.agentId, agents, openAgentPanel]);

  const filtered = useMemo(() => {
    if (!search) return agents;
    const q = search.toLowerCase();
    return agents.filter((a) => a.name.toLowerCase().includes(q));
  }, [agents, search]);

  const tasksByAgent = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) if (t.assigneeId) m[t.assigneeId] = (m[t.assigneeId] || 0) + 1;
    return m;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <PageHeader title="Agents" description="Manage your agent fleet" />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
      </div>
      {loading ? (
        <div className="text-white/40 text-sm">Loading agents...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No agents found" description="No agents match your search criteria." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => {
            const isActive = agent.status.toLowerCase() === AgentStatus.ACTIVE;
            const taskCount = tasksByAgent[agent.id] || 0;
            const completion =
              agent.tasksCompleted > 0
                ? Math.round((agent.tasksSuccessful / agent.tasksCompleted) * 100)
                : null;
            return (
              <button
                key={agent.id}
                onClick={() => { openAgentPanel(agent.id); navigate({ to: "/agents/$agentId", params: { agentId: agent.agentId ?? agent.id } }); }}
                className={cn(
                  "rounded-xl border bg-white/[0.02] p-4 space-y-4 transition-all text-left hover:bg-white/[0.04] hover:border-white/20 cursor-pointer group",
                  isActive ? "border-cyan-500/20" : "border-white/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                      ROLE_COLORS[agent.role?.toLowerCase() ?? ""] ??
                        "bg-slate-500/20 text-slate-400",
                    )}
                  >
                    {initials(agent.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white text-sm truncate group-hover:text-cyan-300 transition-colors">
                        {agent.name}
                      </span>
                      <Badge
                        variant={isActive ? "default" : "secondary"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    {agent.role && <div className="text-xs text-white/40 mt-0.5">{agent.role}</div>}
                    {agent.level != null && (
                      <div className="text-xs text-white/30">
                        L{agent.level} · {levelLabel(agent.level)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-white/40 mb-0.5 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Trust
                    </div>
                    <div className="font-semibold text-white">{agent.trustScore ?? "—"}%</div>
                  </div>
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-white/40 mb-0.5">Tasks</div>
                    <div className="font-semibold text-white">{taskCount}</div>
                  </div>
                  {completion !== null && (
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <div className="text-white/40 mb-0.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Win rate
                      </div>
                      <div className="font-semibold text-white">{completion}%</div>
                    </div>
                  )}
                  <div className="rounded-lg bg-white/5 px-3 py-2">
                    <div className="text-white/40 mb-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last seen
                    </div>
                    <div className="font-semibold text-white truncate">
                      {timeAgo(agent.lastActivityAt)}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
