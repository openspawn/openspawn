import { AgentNetwork } from "../components/agent-network";
import { useAgents } from "../hooks";
import { EmptyState } from "../components/ui/empty-state";
import { Card, CardContent } from "../components/ui/card";

export function NetworkPage() {
  const { agents } = useAgents();

  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-theme(spacing.16))]">
        <Card className="max-w-md w-full bg-slate-800/30 border-slate-700">
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
      {/* Header overlay - hidden on mobile/landscape, shown on larger screens */}
      <div className="hidden landscape:hidden sm:portrait:block lg:block absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10 text-center px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Agent Network</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Real-time agent hierarchy
        </p>
      </div>

      {/* Stats bar - compact horizontal strip on landscape, grid on portrait mobile */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 
        bg-zinc-900/90 backdrop-blur border border-zinc-800 
        rounded-full px-3 sm:px-6 py-1.5 sm:py-3
        w-auto max-w-[calc(100%-8rem)] landscape:max-w-none sm:max-w-none">
        <div className="flex gap-3 sm:gap-6 items-center">
          <div className="text-center">
            <div className="text-base sm:text-xl font-bold text-white">14</div>
            <div className="text-[9px] sm:text-xs text-zinc-500 hidden landscape:hidden sm:block">Agents</div>
          </div>
          <div className="w-px h-6 bg-zinc-700 hidden sm:block" />
          <div className="text-center">
            <div className="text-base sm:text-xl font-bold text-green-500">11</div>
            <div className="text-[9px] sm:text-xs text-zinc-500 hidden landscape:hidden sm:block">Active</div>
          </div>
          <div className="w-px h-6 bg-zinc-700 hidden sm:block" />
          <div className="text-center">
            <div className="text-base sm:text-xl font-bold text-yellow-500">2</div>
            <div className="text-[9px] sm:text-xs text-zinc-500 hidden landscape:hidden sm:block">Pending</div>
          </div>
          <div className="w-px h-6 bg-zinc-700 hidden sm:block" />
          <div className="text-center">
            <div className="text-base sm:text-xl font-bold text-purple-500">1</div>
            <div className="text-[9px] sm:text-xs text-zinc-500 hidden landscape:hidden sm:block">Paused</div>
          </div>
          <div className="w-px h-6 bg-zinc-700 hidden sm:block" />
          <div className="text-center">
            <div className="text-base sm:text-xl font-bold text-white">98.7K</div>
            <div className="text-[9px] sm:text-xs text-zinc-500 hidden landscape:hidden sm:block">Credits</div>
          </div>
        </div>
      </div>

      <AgentNetwork className="w-full h-full" />
    </div>
  );
}
