import { useState } from "react";
import { AgentNetwork } from "../components/agent-network";
import { OrgChart } from "../components/org-chart";
import { AgentDetailPanel } from "../components/agent-detail-panel";
import { TeamDetailPanel } from "../components/team-detail-panel";
import { useAgents } from "../hooks";
import { useSidePanel } from "../contexts";
import { EmptyState } from "../components/ui/empty-state";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Network, GitBranch } from "lucide-react";

enum NetworkView {
  Network = "network",
  Orgchart = "orgchart",
}

export function NetworkPage() {
  const { agents } = useAgents();
  const [view, setView] = useState<NetworkView>(NetworkView.Network);
  const { openSidePanel, closeSidePanel } = useSidePanel();
  const openAgentDetail = (agentId: string) => {
    openSidePanel(<AgentDetailPanel agentId={agentId} onClose={closeSidePanel} />, { width: 520 });
  };

  const openTeamDetail = (teamId: string) => {
    openSidePanel(
      <TeamDetailPanel
        teamId={teamId}
        onAgentClick={openAgentDetail}
        onTeamClick={openTeamDetail}
      />,
      { width: 480, title: "Team Details" },
    );
  };

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
              onCta={() => {
                /* noop */
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-theme(spacing.16))] overflow-hidden relative"
      data-tour="network-viz"
    >
      {/* Header bar with title + stats + view toggle */}
      <div
        className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10
        bg-card/90 backdrop-blur border border-border
        rounded-full px-4 sm:px-6 py-2 sm:py-3
        w-auto max-w-[calc(100%-4rem)]"
      >
        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="hidden sm:block">
            <h1 className="text-sm sm:text-base font-bold text-foreground leading-tight whitespace-nowrap">
              {view === NetworkView.Network ? "Agent Network" : "Org Chart"}
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {view === NetworkView.Network ? "Real-time hierarchy" : "Team structure"}
            </p>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
            <Button
              variant={view === NetworkView.Network ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full h-7 px-3 text-xs"
              onClick={() => setView(NetworkView.Network)}
            >
              <Network className="h-3.5 w-3.5 mr-1" />
              Network
            </Button>
            <Button
              variant={view === NetworkView.Orgchart ? "secondary" : "ghost"}
              size="sm"
              className="rounded-full h-7 px-3 text-xs"
              onClick={() => setView(NetworkView.Orgchart)}
            >
              <GitBranch className="h-3.5 w-3.5 mr-1" />
              Org Chart
            </Button>
          </div>

          {view === NetworkView.Network && (
            <>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div className="flex gap-3 sm:gap-5 items-center">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {agents.length}
                  </div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-emerald-500">
                    {agents.filter((a) => a.status?.toString().toUpperCase() === "ACTIVE").length}
                  </div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-amber-500">
                    {agents.filter((a) => a.status?.toString().toUpperCase() === "PENDING").length}
                  </div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-foreground">
                    {(agents.reduce((s, a) => s + a.currentBalance, 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">Credits</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {view === NetworkView.Network ? (
        <AgentNetwork className="w-full h-full" onAgentClick={openAgentDetail} />
      ) : (
        <OrgChart
          className="w-full h-full"
          onAgentClick={openAgentDetail}
          onTeamClick={openTeamDetail}
        />
      )}

      {/* Agent Detail Panel now uses global side panel */}
    </div>
  );
}
