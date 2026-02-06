import { useState } from "react";

import { CreditLedger } from "../components";
import { useAgents, useCredits } from "../hooks";

const ORG_ID = import.meta.env.VITE_ORG_ID || "default-org-id";

export function CreditsPage() {
  const { agents, loading: agentsLoading } = useAgents(ORG_ID);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const {
    transactions,
    loading: creditsLoading,
    error,
  } = useCredits(ORG_ID, selectedAgentId || (agents[0]?.id ?? ""));

  const selectedAgent = agents.find((a) => a.id === (selectedAgentId || agents[0]?.id));

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Credits</h1>
        <p className="text-gray-500">Credit economy ledger</p>
      </div>

      {/* Agent selector */}
      <div className="mb-6">
        <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700">
          Select Agent
        </label>
        <select
          id="agent-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedAgentId || agents[0]?.id}
          onChange={(e) => setSelectedAgentId(e.target.value)}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.agentId}) - Balance: {agent.currentBalance}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {selectedAgent && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">{selectedAgent.currentBalance}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Budget Spent</p>
            <p className="text-2xl font-bold text-gray-900">
              {selectedAgent.budgetPeriodSpent}
              {selectedAgent.budgetPeriodLimit && ` / ${selectedAgent.budgetPeriodLimit}`}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Management Fee</p>
            <p className="text-2xl font-bold text-gray-900">{selectedAgent.managementFeePct}%</p>
          </div>
        </div>
      )}

      {/* Transaction ledger */}
      {error ? (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">Error: {error.message}</p>
        </div>
      ) : creditsLoading ? (
        <div className="text-gray-500">Loading transactions...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <CreditLedger transactions={transactions} />
        </div>
      )}
    </div>
  );
}
