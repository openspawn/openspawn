import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AgentNetwork } from "../components/agent-network";
import { OrgChart } from "../components/org-chart";
import { AgentDetailPanel } from "../components/agent-detail-panel";
import { useAgents } from "../hooks";
import { EmptyState } from "../components/ui/empty-state";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Network, GitBranch } from "lucide-react";

type NetworkView = "network" | "orgchart";

export function NetworkPage() {
  const { agents } = useAgents();
  const [view, setView] = useState<NetworkView>("network");
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null);

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.16))]">
        <Card className="max-w-md w-full">
          <CardContent>
            <EmptyState
              variant="network"
              title="No agent network yet"
              description="Register agents to see their connections and hierarchy visualized here."
              ctaLabel="Register agents to get started →"
              onCta={() => {}}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] -m-6 lg:-m-6 -mx-4 sm:-mx-6">
      {/* Header bar with title + stats + view toggle */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10
        bg-zinc-900/90 backdrop-blur border border-zinc-800
        rounded-full px-4 sm:px-6 py-2 sm:py-3
        w-auto max-w-[calc(100%-4rem)]">
        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="hidden sm:block">
            <h1 className="text-sm sm:text-base font-bold text-foreground leading-tight">
              {view === "network" ? "Agent Network" : "Org Chart"}
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500">
              {view === "network" ? "Real-time hierarchy" : "Team structure"}
            </p>
          </div>
          <div className="w-px h-8 bg-zinc-700 hidden sm:block" />

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-full p-0.5">
            <Button
              variant={view === "network" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full h-7 px-3 text-xs"
              onClick={() => setView("network")}
            >
              <Network className="h-3.5 w-3.5 mr-1" />
              Network
            </Button>
            <Button
              variant={view === "orgchart" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full h-7 px-3 text-xs"
              onClick={() => setView("orgchart")}
            >
              <GitBranch className="h-3.5 w-3.5 mr-1" />
              Org Chart
            </Button>
          </div>

          {view === "network" && (
            <>
              <div className="w-px h-8 bg-zinc-700 hidden sm:block" />
              <div className="flex gap-3 sm:gap-5 items-center">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {agents.length}
                  </div>
                  <div className="text-[9px] sm:text-xs text-zinc-500">Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-emerald-500">
                    {agents.filter((a) => a.status?.toString().toUpperCase() === "ACTIVE").length}
                  </div>
                  <div className="text-[9px] sm:text-xs text-zinc-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-amber-500">
                    {agents.filter((a) => a.status?.toString().toUpperCase() === "PENDING").length}
                  </div>
                  <div className="text-[9px] sm:text-xs text-zinc-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {(agents.reduce((s, a) => s + a.currentBalance, 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[9px] sm:text-xs text-zinc-500">Credits</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {view === "network" ? (
        <AgentNetwork className="w-full h-full" />
      ) : (
        <OrgChart className="w-full h-full" onAgentClick={setDetailAgentId} />
      )}

      {/* Agent Detail Panel (overlay, for org chart click-to-detail) */}
      <AnimatePresence>
        {detailAgentId && (
          <AgentDetailPanel
            agentId={detailAgentId}
            onClose={() => setDetailAgentId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
