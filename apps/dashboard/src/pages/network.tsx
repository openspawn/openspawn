import { AgentNetwork } from "../components/agent-network";

export function NetworkPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] -m-6 lg:-m-6 -mx-4 sm:-mx-6">
      {/* Header overlay - hidden on mobile, shown on larger screens */}
      <div className="hidden sm:block absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-10 text-center px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Agent Network</h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Real-time agent hierarchy
        </p>
      </div>

      {/* Stats bar - responsive grid on mobile */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 
        bg-zinc-900/90 backdrop-blur border border-zinc-800 
        rounded-2xl sm:rounded-full px-4 sm:px-6 py-2 sm:py-3
        w-[calc(100%-2rem)] sm:w-auto max-w-lg sm:max-w-none">
        <div className="grid grid-cols-5 gap-2 sm:flex sm:gap-6">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-white">14</div>
            <div className="text-[10px] sm:text-xs text-zinc-500">Agents</div>
          </div>
          <div className="hidden sm:block w-px bg-zinc-700" />
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-green-500">11</div>
            <div className="text-[10px] sm:text-xs text-zinc-500">Active</div>
          </div>
          <div className="hidden sm:block w-px bg-zinc-700" />
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-yellow-500">2</div>
            <div className="text-[10px] sm:text-xs text-zinc-500">Pending</div>
          </div>
          <div className="hidden sm:block w-px bg-zinc-700" />
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-purple-500">1</div>
            <div className="text-[10px] sm:text-xs text-zinc-500">Paused</div>
          </div>
          <div className="hidden sm:block w-px bg-zinc-700" />
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-white">98.7K</div>
            <div className="text-[10px] sm:text-xs text-zinc-500">Credits</div>
          </div>
        </div>
      </div>

      <AgentNetwork className="w-full h-full" />
    </div>
  );
}
