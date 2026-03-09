import { useState, useEffect } from "react";
import { AGENTS, NodeStatus, type SpawnedAgent } from "./replay-data";
import { resolveAvatarUrl } from "../../lib/resolve-avatar-url";
import type { AgentNodeState } from "./org-chart-live";

// Department definitions (VP + subordinates)
interface DeptDef {
  id: string;
  label: string;
  vpId: string;
  memberIds: string[];
}

const DEPARTMENTS: DeptDef[] = [
  {
    id: "kitchen",
    label: "Kitchen",
    vpId: "spongebob-squarepants",
    memberIds: ["sandy-cheeks", "karen", "patrick-star", "gary", "plankton-jr", "mermaid-man"],
  },
  {
    id: "delivery",
    label: "Delivery",
    vpId: "squidward-tentacles",
    memberIds: [
      "pearl-krabs",
      "perch-perkins",
      "barnacle-boy",
      "larry-the-lobster",
      "bubble-bass",
      "dennis",
      "flying-dutchman",
      "fred-1",
      "fred-2",
      "fred-3",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    vpId: "squilliam-fancyson",
    memberIds: ["plankton", "mrs-puff"],
  },
];

const STATUS_COLOR: Record<NodeStatus, string> = {
  [NodeStatus.Idle]: "#4AAED9",
  [NodeStatus.Working]: "#F4C542",
  [NodeStatus.Busy]: "#FF6B6B",
  [NodeStatus.Overwhelmed]: "#FF4757",
};

const STATUS_LABEL: Record<NodeStatus, string> = {
  [NodeStatus.Idle]: "IDLE",
  [NodeStatus.Working]: "WORKING",
  [NodeStatus.Busy]: "BUSY",
  [NodeStatus.Overwhelmed]: "🔥 OVERWHELMED",
};

interface AgentPillProps {
  agentId: string;
  state: AgentNodeState;
}

function AgentPill({ agentId, state }: AgentPillProps) {
  const agent = AGENTS[agentId];
  const color = STATUS_COLOR[state.status];
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
      style={{
        background: "rgba(11,61,96,0.6)",
        border: `1px solid ${color}30`,
      }}
    >
      {agent?.avatarUrl ? (
        <img
          src={resolveAvatarUrl(agent.avatarUrl)}
          alt={agent?.name ?? agentId}
          className="w-5 h-5 rounded-full object-contain shrink-0"
          style={{ background: "#0B3D60" }}
        />
      ) : (
        <span className="text-sm shrink-0">{agent?.emoji ?? "🐟"}</span>
      )}
      <span style={{ color: "#B8E4F7", fontFamily: "Nunito, sans-serif" }}>
        {agent?.name ?? agentId}
      </span>
      <span
        className="w-2 h-2 rounded-full shrink-0 ml-auto"
        style={{ background: color, boxShadow: `0 0 4px ${color}80` }}
      />
    </div>
  );
}

interface DeptCardProps {
  dept: DeptDef;
  nodeStates: Record<string, AgentNodeState>;
  spawnedAgents: SpawnedAgent[];
  expanded: boolean;
  onToggle: () => void;
}

function DeptCard({ dept, nodeStates, spawnedAgents, expanded, onToggle }: DeptCardProps) {
  const vpState = nodeStates[dept.vpId] || { status: NodeStatus.Idle };
  const vpAgent = AGENTS[dept.vpId];
  const vpColor = STATUS_COLOR[vpState.status];
  const isOverwhelmed = vpState.status === NodeStatus.Overwhelmed;
  const isBusy = vpState.status === NodeStatus.Busy || vpState.status === NodeStatus.Overwhelmed;

  // Count working members
  const memberStatuses = dept.memberIds.map((id) => nodeStates[id]?.status ?? NodeStatus.Idle);
  const activeCount = memberStatuses.filter((s) => s !== NodeStatus.Idle).length;
  const totalCount = dept.memberIds.length;

  // Sous-chef pool for kitchen dept
  const kitchenPool = dept.id === "kitchen" ? spawnedAgents : [];

  // Auto-expand when overwhelmed
  useEffect(() => {
    // Expansion is controlled by parent via auto-expand logic
  }, [vpState.status]);

  return (
    <div
      className="rounded-xl overflow-hidden dept-card"
      style={{
        background: "rgba(6,42,69,0.85)",
        border: `1px solid ${isOverwhelmed ? "#FF4757" : `${vpColor}40`}`,
        boxShadow: isOverwhelmed ? "0 0 16px rgba(255,71,87,0.3)" : undefined,
        animation: isOverwhelmed ? "dept-pulse 1.5s ease-in-out infinite" : undefined,
        transition: "border-color 0.4s, box-shadow 0.4s",
      }}
    >
      {/* VP header — tap to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        {/* Avatar */}
        <div
          className="relative shrink-0"
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `2px solid ${vpColor}`,
            boxShadow: isBusy ? `0 0 12px ${vpColor}60` : undefined,
            background: "radial-gradient(circle at center, #0B3D60, #062A45)",
            animation: isBusy ? "ring-pulse 1.5s ease-in-out infinite" : undefined,
          }}
        >
          {vpAgent?.avatarUrl ? (
            <img
              src={resolveAvatarUrl(vpAgent.avatarUrl)}
              alt={vpAgent.name}
              className="w-full h-full object-contain p-0.5 rounded-full"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-2xl">
              {vpAgent?.emoji ?? "🐟"}
            </span>
          )}
          {/* Queue badge */}
          {vpState.queueBadge != null && vpState.queueBadge > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {vpState.queueBadge > 999
                ? `${(vpState.queueBadge / 1000).toFixed(1)}k`
                : vpState.queueBadge}
            </div>
          )}
        </div>

        {/* VP info */}
        <div className="flex-1 min-w-0">
          <div
            className="font-bold text-sm truncate"
            style={{ color: "#B8E4F7", fontFamily: '"Baloo 2", cursive' }}
          >
            {vpAgent?.name ?? dept.vpId}
          </div>
          <div
            className="text-xs"
            style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
          >
            {dept.label}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: vpColor }} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: vpColor, fontFamily: "Nunito, sans-serif" }}
            >
              {STATUS_LABEL[vpState.status]}
            </span>
          </div>
        </div>

        {/* Counts + expand arrow */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className="text-[10px]"
            style={{ color: "rgba(184,228,247,0.4)", fontFamily: "Nunito, sans-serif" }}
          >
            {activeCount}/{totalCount + kitchenPool.length} active
          </span>
          <span
            className="text-xs"
            style={{
              color: "rgba(74,174,217,0.6)",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
              transition: "transform 0.3s ease",
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Expanded members list */}
      <div
        style={{
          maxHeight: expanded ? "400px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <div
          className="px-3 pb-3 space-y-1.5 border-t"
          style={{ borderColor: "rgba(74,174,217,0.1)" }}
        >
          <div
            className="pt-2 text-[10px] uppercase tracking-wider"
            style={{ color: "rgba(184,228,247,0.3)", fontFamily: "Nunito, sans-serif" }}
          >
            Team
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {dept.memberIds.map((id) => (
              <AgentPill
                key={id}
                agentId={id}
                state={nodeStates[id] || { status: NodeStatus.Idle }}
              />
            ))}
          </div>

          {/* Kitchen pool (sous-chefs) */}
          {kitchenPool.length > 0 && (
            <div
              className="rounded-lg p-2 mt-1"
              style={{
                background: "rgba(244,197,66,0.05)",
                border: "1px solid rgba(244,197,66,0.2)",
              }}
            >
              <div
                className="text-[10px] font-bold mb-1"
                style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
              >
                🍳 Grill Station Pool
              </div>
              <div
                className="text-xs"
                style={{ color: "#B8E4F7", fontFamily: "Nunito, sans-serif" }}
              >
                ⭐ ×{kitchenPool.length} sous-chefs · WORKING
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MobileOrgChartProps {
  nodeStates: Record<string, AgentNodeState>;
  spawnedAgents: SpawnedAgent[];
}

export function MobileOrgChart({ nodeStates, spawnedAgents }: MobileOrgChartProps) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const ceoState = nodeStates["mr-krabs"] || { status: NodeStatus.Idle };
  const ceoColor = STATUS_COLOR[ceoState.status];
  const ceoAgent = AGENTS["mr-krabs"];

  // Auto-expand when a dept head becomes overwhelmed
  useEffect(() => {
    for (const dept of DEPARTMENTS) {
      const vpState = nodeStates[dept.vpId];
      if (vpState?.status === NodeStatus.Overwhelmed || vpState?.status === NodeStatus.Busy) {
        setExpandedDept((prev) => prev ?? dept.id);
        break;
      }
    }
  }, [nodeStates]);

  const toggleDept = (id: string) => {
    setExpandedDept((prev) => (prev === id ? null : id));
  };

  return (
    <div
      className="flex flex-col gap-2 p-3 overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #062A45 0%, #030E1A 100%)" }}
    >
      {/* CEO Card */}
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
        style={{
          background: "rgba(6,42,69,0.9)",
          border: `1px solid ${ceoColor}50`,
          boxShadow: `0 0 12px ${ceoColor}20`,
        }}
      >
        <div
          className="shrink-0"
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: `2px solid ${ceoColor}`,
            boxShadow: `0 0 12px ${ceoColor}60`,
            background: "radial-gradient(circle at center, #0B3D60, #062A45)",
          }}
        >
          {ceoAgent?.avatarUrl ? (
            <img
              src={resolveAvatarUrl(ceoAgent.avatarUrl)}
              alt={ceoAgent.name}
              className="w-full h-full object-contain p-0.5 rounded-full"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-2xl">🦀</span>
          )}
        </div>
        <div>
          <div
            className="font-bold text-base"
            style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
          >
            {ceoAgent?.name ?? "Mr. Krabs"}
          </div>
          <div
            className="text-xs"
            style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
          >
            CEO · The Krusty Krab
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ceoColor }} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: ceoColor, fontFamily: "Nunito, sans-serif" }}
            >
              {STATUS_LABEL[ceoState.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Department Cards */}
      {DEPARTMENTS.map((dept) => (
        <DeptCard
          key={dept.id}
          dept={dept}
          nodeStates={nodeStates}
          spawnedAgents={spawnedAgents}
          expanded={expandedDept === dept.id}
          onToggle={() => toggleDept(dept.id)}
        />
      ))}

      <style>{`
        @keyframes dept-pulse {
          0%, 100% { box-shadow: 0 0 16px rgba(255,71,87,0.3); }
          50% { box-shadow: 0 0 24px rgba(255,71,87,0.6); }
        }
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
