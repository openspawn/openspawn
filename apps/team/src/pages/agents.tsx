import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { PageHeader, Badge, EmptyState } from "@openspawn/dashboard-ui";
import { AgentStatus } from "@openspawn/dashboard-data";
import { cn } from "../lib/utils";
import { useAgents } from "../hooks";

export function AgentsPage() {
  const { agents, loading } = useAgents();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return agents;
    const q = search.toLowerCase();
    return agents.filter((a) => a.name.toLowerCase().includes(q));
  }, [agents, search]);

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
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">{agent.name}</span>
                <Badge variant={agent.status === AgentStatus.Active ? "default" : "secondary"}>
                  {agent.status}
                </Badge>
              </div>
              {agent.role && (
                <div className="text-xs text-white/40">{agent.role}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
