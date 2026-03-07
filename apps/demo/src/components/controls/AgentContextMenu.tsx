/**
 * AgentContextMenu — right-click / long-press context menu for agents.
 */

import { useEffect, useRef } from "react";

interface AgentContextMenuProps {
  agentId: string;
  agentName: string;
  x: number;
  y: number;
  isPaused: boolean;
  onClose: () => void;
  onViewLogs: (agentId: string) => void;
  onSendMessage: (agentId: string) => void;
  onReassign: (agentId: string) => void;
  onPauseResume: (agentId: string) => void;
  onFire: (agentId: string) => void;
}

interface MenuItem {
  icon: string;
  label: string;
  action: () => void;
  danger?: boolean;
}

export function AgentContextMenu({
  agentId,
  agentName,
  x,
  y,
  isPaused,
  onClose,
  onViewLogs,
  onSendMessage,
  onReassign,
  onPauseResume,
  onFire,
}: AgentContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Clamp to viewport
  const menuWidth = 200;
  const menuHeight = 250;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 8);

  const items: MenuItem[] = [
    {
      icon: "📜",
      label: "View Logs",
      action: () => {
        console.log(`[ContextMenu] view-logs: ${agentId}`);
        onViewLogs(agentId);
      },
    },
    {
      icon: "💬",
      label: "Send Message",
      action: () => {
        console.log(`[ContextMenu] send-message: ${agentId}`);
        onSendMessage(agentId);
      },
    },
    {
      icon: "🔄",
      label: "Reassign",
      action: () => {
        console.log(`[ContextMenu] reassign: ${agentId}`);
        onReassign(agentId);
      },
    },
    {
      icon: isPaused ? "▶️" : "⏸️",
      label: isPaused ? "Resume" : "Pause",
      action: () => {
        console.log(`[ContextMenu] ${isPaused ? "resume" : "pause"}: ${agentId}`);
        onPauseResume(agentId);
      },
    },
    {
      icon: "🔥",
      label: "Fire",
      action: () => {
        console.log(`[ContextMenu] fire: ${agentId}`);
        onFire(agentId);
      },
      danger: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[70] rounded-xl overflow-hidden py-1"
      style={{
        left: clampedX,
        top: clampedY,
        width: menuWidth,
        background: "rgba(6,42,69,0.97)",
        border: "1px solid rgba(74,174,217,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "scale-in 0.12s ease-out",
      }}
    >
      {/* Agent name header */}
      <div className="px-3 py-2 border-b border-[rgba(74,174,217,0.1)]">
        <div
          className="text-xs font-bold truncate"
          style={{ color: "#B8E4F7", fontFamily: '"Baloo 2", cursive' }}
        >
          {agentName}
        </div>
      </div>

      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.action();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left"
          style={{
            color: item.danger ? "#FF4757" : "#B8E4F7",
            fontFamily: "Nunito, sans-serif",
            borderTop: item.danger ? "1px solid rgba(255,71,87,0.1)" : undefined,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = item.danger
              ? "rgba(255,71,87,0.08)"
              : "rgba(74,174,217,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
          }}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
