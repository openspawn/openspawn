import { AgentNetwork } from "../components/agent-network";

export function NetworkPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] -m-6">
      {/* Header overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-center">
        <h1 className="text-2xl font-bold text-white mb-1">Agent Network</h1>
        <p className="text-sm text-zinc-400">
          Real-time visualization of agent hierarchy and relationships
        </p>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-6 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-full px-6 py-3">
        <div className="text-center">
          <div className="text-xl font-bold text-white">14</div>
          <div className="text-xs text-zinc-500">Total Agents</div>
        </div>
        <div className="w-px bg-zinc-700" />
        <div className="text-center">
          <div className="text-xl font-bold text-green-500">11</div>
          <div className="text-xs text-zinc-500">Active</div>
        </div>
        <div className="w-px bg-zinc-700" />
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-500">2</div>
          <div className="text-xs text-zinc-500">Pending</div>
        </div>
        <div className="w-px bg-zinc-700" />
        <div className="text-center">
          <div className="text-xl font-bold text-purple-500">1</div>
          <div className="text-xs text-zinc-500">Paused</div>
        </div>
        <div className="w-px bg-zinc-700" />
        <div className="text-center">
          <div className="text-xl font-bold text-white">98.7K</div>
          <div className="text-xs text-zinc-500">Total Credits</div>
        </div>
      </div>

      <AgentNetwork className="w-full h-full" />
    </div>
  );
}
