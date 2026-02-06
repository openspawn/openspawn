import type { Agent } from "../hooks";

const roleColors: Record<string, string> = {
  worker: "bg-blue-100 text-blue-800",
  hr: "bg-purple-100 text-purple-800",
  founder: "bg-yellow-100 text-yellow-800",
  admin: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  suspended: "bg-yellow-500",
  revoked: "bg-red-500",
};

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full ${statusColors[agent.status] || "bg-gray-400"} mr-2`}
            title={agent.status}
          />
          <span className="font-medium text-gray-900">{agent.name}</span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full ${roleColors[agent.role] || "bg-gray-100"}`}
        >
          {agent.role}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        <span className="font-mono">{agent.agentId}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Balance:</span>
          <span className="ml-1 font-medium">{agent.currentBalance}</span>
        </div>
        <div>
          <span className="text-gray-500">Level:</span>
          <span className="ml-1 font-medium">{agent.level}</span>
        </div>
        <div>
          <span className="text-gray-500">Model:</span>
          <span className="ml-1 font-medium">{agent.model}</span>
        </div>
        {agent.budgetPeriodLimit && (
          <div>
            <span className="text-gray-500">Budget:</span>
            <span className="ml-1 font-medium">
              {agent.budgetPeriodSpent}/{agent.budgetPeriodLimit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
