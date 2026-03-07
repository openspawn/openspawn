/**
 * AgentNode — custom ReactFlow node for the AgentNetwork visualization.
 * Extracted from agent-network.tsx to reduce file size.
 */
import { useContext, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "motion/react";
import { darkenForBackground } from "../lib/avatar-utils";
import { levelColors } from "../lib/status-colors";
import {
  NetworkContext,
  heatColors,
  roleLabels,
  type AgentNodeData,
} from "./agent-network-context";

// Re-export AgentNodeData so callers can import it from this file if needed.
export type { AgentNodeData };

// Suppress unused import warning for levelColors (used implicitly via context)
void levelColors;

/**
 * Custom ReactFlow node rendered for each agent in the network graph.
 * Colour-codes by activity level (heat map) and shows health rings when data
 * is available.
 */
export function AgentNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const { agentActivity, agentHealth, isMobileOrTouch, dimIdle } = useContext(NetworkContext);
  const hasAnimated = useRef(false);

  // Activity data
  const activity = agentActivity.get(nodeData.agentId);
  const activityLevel = activity?.activityLevel || "idle";
  const taskCount = activity?.taskCount || 0;

  // Node colour — heat map based on activity (human always cyan)
  let color: string;
  if (nodeData.isHuman) {
    color = "#06b6d4";
  } else {
    switch (activityLevel) {
      case "hot":
        color = heatColors.hot;
        break;
      case "warm":
        color = heatColors.warm;
        break;
      case "cool":
        color = heatColors.cool;
        break;
      default:
        color = heatColors.idle;
    }
  }

  const isSpawning = nodeData.isSpawning;
  const isDespawning = nodeData.isDespawning;
  const compact = nodeData.compact;
  const isActive = nodeData.status === "active" && activityLevel !== "idle";
  const isIdle = activityLevel === "idle";

  // Larger touch targets on mobile (44 px minimum)
  const mobileScale = isMobileOrTouch ? 1.2 : 1;
  const nodeWidth = (compact ? 90 : 160) * mobileScale;
  const nodeHeight = (compact ? 64 : 96) * mobileScale;

  const avatarEmoji = nodeData.avatar || "🤖";
  const avatarColor = nodeData.avatarColor || "#71717a";

  return (
    <div className="relative" style={{ width: nodeWidth, height: nodeHeight }}>
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{
          background: color,
          width: compact ? 8 : 12,
          height: compact ? 8 : 12,
          border: "2px solid #27272a",
          borderRadius: "50%",
        }}
      />

      <motion.div
        initial={hasAnimated.current ? false : { scale: 0, opacity: 0 }}
        animate={{
          scale: isDespawning ? 0 : 1,
          opacity: isDespawning ? 0 : isIdle && dimIdle ? 0.35 : isIdle ? 0.9 : 1,
        }}
        exit={{ scale: 0, opacity: 0 }}
        onAnimationComplete={() => {
          hasAnimated.current = true;
        }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="absolute inset-0"
      >
        {/* Pulsing glow for active agents — disabled on mobile for performance */}
        {isActive && !isMobileOrTouch && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{
              repeat: Infinity,
              duration: activityLevel === "hot" ? 1 : 2,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-xl blur-lg"
            style={{ backgroundColor: color }}
          />
        )}
        {/* Static glow on mobile */}
        {isActive && isMobileOrTouch && (
          <div
            className="absolute inset-0 rounded-xl blur-md opacity-30"
            style={{ backgroundColor: color }}
          />
        )}

        {isSpawning && !isMobileOrTouch && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: "#22c55e", filter: "blur(20px)" }}
          />
        )}

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full h-full flex flex-col items-center justify-center
            rounded-xl border-2 px-2 py-1 transition-all
            ${selected ? "shadow-lg shadow-purple-500/30" : ""}
            ${isSpawning ? "shadow-lg shadow-green-500/50" : ""}
            ${isActive ? "shadow-lg" : ""}
          `}
          style={{
            borderColor: color,
            backgroundColor: `${color}${isIdle ? "18" : "20"}`,
            boxShadow: isActive ? `0 0 20px ${color}40` : undefined,
          }}
        >
          {/* Level badge */}
          {!nodeData.isHuman && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`absolute rounded-full font-bold text-foreground ${compact ? "-top-1.5 -right-1.5 px-1 py-0 text-[8px]" : "-top-2 -right-2 px-1.5 py-0.5 text-[10px]"}`}
              style={{ backgroundColor: color }}
            >
              L{nodeData.level}
            </motion.div>
          )}

          {/* Task count badge */}
          {!nodeData.isHuman && taskCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className={`absolute rounded-full font-bold text-foreground bg-violet-600 ${compact ? "-bottom-1.5 -right-1.5 px-1 py-0 text-[8px]" : "-bottom-2 -right-2 px-1.5 py-0.5 text-[10px]"}`}
            >
              {taskCount}
            </motion.div>
          )}

          {/* Status dot */}
          <motion.div
            animate={{
              scale: isActive ? [1, 1.3, 1] : 1,
              opacity: isActive ? 1 : 0.5,
            }}
            transition={{
              repeat: isActive ? Infinity : 0,
              duration: activityLevel === "hot" ? 1.5 : 2,
            }}
            className={`absolute rounded-full ${compact ? "-top-0.5 -left-0.5 w-2 h-2" : "-top-1 -left-1 w-2.5 h-2.5"}`}
            style={{
              backgroundColor:
                nodeData.status === "active"
                  ? "#22c55e"
                  : nodeData.status === "pending"
                    ? "#fbbf24"
                    : nodeData.status === "paused"
                      ? "#a78bfa"
                      : "#ef4444",
            }}
          />

          {/* Avatar / health rings */}
          {!compact &&
            (() => {
              const health = agentHealth.get(nodeData.agentId);
              const avatarImg = nodeData.isHuman ? (
                <span className="text-lg leading-none">👤</span>
              ) : nodeData.avatarUrl ? (
                <img
                  src={nodeData.avatarUrl}
                  alt={nodeData.label}
                  className="w-8 h-8 rounded-full object-contain"
                  style={{ backgroundColor: darkenForBackground(avatarColor) }}
                />
              ) : (
                <span
                  className="w-8 h-8 rounded-full inline-flex items-center justify-center text-xl leading-none select-none"
                  style={{ backgroundColor: darkenForBackground(avatarColor) }}
                >
                  {avatarEmoji}
                </span>
              );

              if (!nodeData.isHuman && health) {
                const size = 44,
                  sw = 3;
                const r1 = (size - sw) / 2;
                const r2 = r1 - sw - 1;
                const c1 = 2 * Math.PI * r1,
                  c2 = 2 * Math.PI * r2;
                const o1 = c1 * (1 - health.completionRate);
                const o2 = c2 * (1 - health.creditUsage);
                const col = (v: number) =>
                  v >= 0.85 ? "#f43f5e" : v >= 0.6 ? "#f59e0b" : "#10b981";
                const cx = size / 2;
                const avatarSize = Math.floor((r2 - sw / 2) * 2) - 2;
                return (
                  <div className="relative mb-0.5" style={{ width: size, height: size }}>
                    <svg
                      className="absolute inset-0"
                      width={size}
                      height={size}
                      viewBox={`0 0 ${size} ${size}`}
                    >
                      <circle
                        cx={cx}
                        cy={cx}
                        r={r1}
                        fill="none"
                        stroke="white"
                        strokeOpacity={0.08}
                        strokeWidth={sw}
                      />
                      <motion.circle
                        cx={cx}
                        cy={cx}
                        r={r1}
                        fill="none"
                        stroke={col(health.completionRate)}
                        strokeWidth={sw}
                        strokeLinecap="butt"
                        strokeDasharray={c1}
                        initial={{ strokeDashoffset: c1 }}
                        animate={{ strokeDashoffset: o1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        transform={`rotate(-90 ${cx} ${cx})`}
                      />
                      <circle
                        cx={cx}
                        cy={cx}
                        r={r2}
                        fill="none"
                        stroke="white"
                        strokeOpacity={0.08}
                        strokeWidth={sw}
                      />
                      <motion.circle
                        cx={cx}
                        cy={cx}
                        r={r2}
                        fill="none"
                        stroke={col(health.creditUsage)}
                        strokeWidth={sw}
                        strokeLinecap="butt"
                        strokeDasharray={c2}
                        initial={{ strokeDashoffset: c2 }}
                        animate={{ strokeDashoffset: o2 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                        transform={`rotate(-90 ${cx} ${cx})`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="rounded-full overflow-hidden"
                        style={{ width: avatarSize, height: avatarSize }}
                      >
                        {nodeData.avatarUrl ? (
                          <img
                            src={nodeData.avatarUrl}
                            alt={nodeData.label}
                            className="w-full h-full object-contain"
                            style={{ backgroundColor: darkenForBackground(avatarColor) }}
                          />
                        ) : (
                          <span
                            className="w-full h-full inline-flex items-center justify-center text-lg leading-none select-none"
                            style={{ backgroundColor: darkenForBackground(avatarColor) }}
                          >
                            {avatarEmoji}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return <div className="mb-0.5">{avatarImg}</div>;
            })()}

          {/* Name */}
          <div
            className={`font-semibold text-foreground text-center truncate w-full ${compact ? (isMobileOrTouch ? "text-xs" : "text-[10px]") : isMobileOrTouch ? "text-base" : "text-sm"}`}
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
          >
            {compact
              ? (nodeData.isHuman ? "👤 " : "") + nodeData.label.split(" ")[0]
              : nodeData.label}
          </div>

          {/* Role */}
          {!compact && (
            <div
              className={`text-center truncate w-full ${isMobileOrTouch ? "text-[11px]" : "text-[9px]"}`}
              style={{ color }}
            >
              {nodeData.isHuman ? "Human" : roleLabels[nodeData.role] || nodeData.role}
            </div>
          )}

          {/* Credits */}
          {!nodeData.isHuman && !compact && (
            <div className="text-[9px] text-center text-zinc-400 mt-0.5">
              💰 {nodeData.credits.toLocaleString()}
            </div>
          )}
        </motion.div>
      </motion.div>

      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{
          background: color,
          width: compact ? 8 : 12,
          height: compact ? 8 : 12,
          border: "2px solid #27272a",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}
