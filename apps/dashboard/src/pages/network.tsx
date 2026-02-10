import { AgentNetwork } from "../components/agent-network";
import { useAgents } from "../hooks";
import { EmptyState } from "../components/ui/empty-state";
import { Card, CardContent } from "../components/ui/card";

export function NetworkPage() {
  const { agents } = useAgents();

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
      {/* Header bar with title + stats */}
      <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10
        bg-zinc-900/90 backdrop-blur border border-zinc-800
        rounded-full px-4 sm:px-6 py-2 sm:py-3
        w-auto max-w-[calc(100%-4rem)]">
        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="hidden sm:block">
            <h1 className="text-sm sm:text-base font-bold text-white leading-tight">Agent Network</h1>
            <p className="text-[10px] sm:text-xs text-zinc-500">Real-time hierarchy</p>
          </div>
          <div className="w-px h-8 bg-zinc-700 hidden sm:block" />
          <div className="flex gap-3 sm:gap-5 items-center">
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-white">14</div>
              <div className="text-[9px] sm:text-xs text-zinc-500">Agents</div>
            </div>
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-emerald-500">11</div>
              <div className="text-[9px] sm:text-xs text-zinc-500">Active</div>
            </div>
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-amber-500">2</div>
              <div className="text-[9px] sm:text-xs text-zinc-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-violet-500">1</div>
              <div className="text-[9px] sm:text-xs text-zinc-500">Paused</div>
            </div>
            <div className="text-center">
              <div className="text-sm sm:text-lg font-bold text-white">98.7K</div>
              <div className="text-[9px] sm:text-xs text-zinc-500">Credits</div>
            </div>
          </div>
        </div>
      </div>

      <AgentNetwork className="w-full h-full" />
    </div>
  );
}
