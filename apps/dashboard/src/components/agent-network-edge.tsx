/**
 * TaskFlowEdge — animated edge component for the AgentNetwork visualization.
 * EdgeTooltip — hover card shown when an edge is clicked.
 * Extracted from agent-network.tsx to reduce file size.
 */
import { useContext } from "react";
import { BaseEdge, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import { motion, AnimatePresence } from "motion/react";
import { NetworkContext } from "./agent-network-context";

// ─── TaskFlowEdge ──────────────────────────────────────────────────────────────

/**
 * Custom animated ReactFlow edge that:
 * - Shows particle animations when tasks are being delegated.
 * - Scales stroke width based on total message volume.
 * - Reduces particle count on mobile for performance.
 */
export function TaskFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  source,
  target,
  selected,
}: EdgeProps & { selected?: boolean }) {
  const { delegations, speed, edgeMessages, isMobileOrTouch } = useContext(NetworkContext);

  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const activeDelegations = delegations.filter((d) => d.fromId === source && d.toId === target);

  const edgeKey      = `${source}-${target}`;
  const messageData  = edgeMessages.get(edgeKey);
  const messageCount = messageData?.count || 0;

  const baseStrokeWidth = 2;
  const maxStrokeWidth  = 6;
  const strokeWidth = messageCount > 0
    ? Math.min(baseStrokeWidth + Math.log(messageCount + 1) * 0.8, maxStrokeWidth)
    : baseStrokeWidth;

  const baseDuration = 1.2;
  const duration     = baseDuration / Math.sqrt(speed);

  const maxParticles  = isMobileOrTouch ? 1 : 3;
  const particleCount = Math.min(Math.max(1, Math.floor(messageCount / 5)), maxParticles);
  const particles     = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <>
      {/* Glow underlay for active edges — skip on mobile */}
      {messageCount > 0 && !isMobileOrTouch && (
        <BaseEdge
          id={`${id}-glow`}
          path={edgePath}
          style={{ ...style, strokeWidth: strokeWidth + 4, opacity: 0.15, filter: 'blur(4px)' }}
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth,
          strokeDasharray: messageCount > 0 ? undefined : '6 4',
          opacity: selected ? 1 : (messageCount > 0 ? 0.85 : 0.35),
        }}
        markerEnd={markerEnd}
      />

      {/* Delegation particles — full on desktop */}
      {!isMobileOrTouch && activeDelegations.map((delegation) => (
        <motion.g key={delegation.id}>
          <motion.circle
            r={6}
            fill="#22c55e"
            filter="drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))"
            initial={{ offsetDistance: "0%", scale: 0, opacity: 0 }}
            animate={{ offsetDistance: "100%", scale: [0, 1.2, 1, 1, 0.8], opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration, ease: "easeInOut", times: [0, 0.1, 0.3, 0.9, 1] }}
            style={{ offsetPath: `path("${edgePath}")` }}
          />
          <motion.circle
            r={4}
            fill="#22c55e"
            opacity={0.4}
            filter="blur(4px)"
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{ duration, ease: "easeInOut", delay: 0.1 }}
            style={{ offsetPath: `path("${edgePath}")` }}
          />
        </motion.g>
      ))}

      {/* Mobile: simpler single particle */}
      {isMobileOrTouch && activeDelegations.slice(0, 1).map((delegation) => (
        <motion.circle
          key={delegation.id}
          r={5}
          fill="#22c55e"
          initial={{ offsetDistance: "0%", opacity: 0 }}
          animate={{ offsetDistance: "100%", opacity: [0, 1, 1, 0] }}
          transition={{ duration, ease: "easeInOut" }}
          style={{ offsetPath: `path("${edgePath}")` }}
        />
      ))}

      {/* Ambient particles for high-traffic edges — desktop only */}
      {!isMobileOrTouch && messageCount > 10 && particles.map((i) => (
        <motion.circle
          key={`ambient-${i}`}
          r={3}
          fill="#06b6d4"
          opacity={0.3}
          filter="blur(2px)"
          animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 0.3, 0] }}
          transition={{ duration: duration * 2, ease: "linear", repeat: Infinity, delay: i * (duration * 0.5) }}
          style={{ offsetPath: `path("${edgePath}")` }}
        />
      ))}
    </>
  );
}

// ─── EdgeTooltip ───────────────────────────────────────────────────────────────

interface EdgeTooltipProps {
  edgeData: { source: string; target: string; sourceLabel: string; targetLabel: string } | null;
  onClose: () => void;
}

/**
 * Floating tooltip shown when a network edge is clicked.
 * Displays message count and the most recent message on that edge.
 */
export function EdgeTooltip({ edgeData, onClose }: EdgeTooltipProps) {
  const { edgeMessages } = useContext(NetworkContext);

  if (!edgeData) return null;

  const edgeKey     = `${edgeData.source}-${edgeData.target}`;
  const messageData = edgeMessages.get(edgeKey);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                   bg-zinc-900/95 backdrop-blur border border-cyan-500/50 rounded-lg p-4
                   shadow-xl shadow-cyan-500/20 z-50 min-w-[250px]"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
        >
          ✕
        </button>

        <div className="text-sm font-semibold text-foreground mb-2">
          {edgeData.sourceLabel} → {edgeData.targetLabel}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Messages</span>
            <span className="text-cyan-400 font-semibold">{messageData?.count || 0}</span>
          </div>

          {messageData?.lastMessage && (
            <div className="border-t border-zinc-800 pt-2 mt-2">
              <div className="text-zinc-500 mb-1">Last message:</div>
              <div className="text-zinc-300 italic line-clamp-2">
                "{messageData.lastMessage}"
              </div>
              {messageData.lastMessageTime && (
                <div className="text-zinc-500 text-[10px] mt-1">
                  {new Date(messageData.lastMessageTime).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
