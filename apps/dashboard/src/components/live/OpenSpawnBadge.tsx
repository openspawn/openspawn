import { ExternalLink } from "lucide-react";
import type { SpawnedAgent } from "./replay-data";

interface OpenSpawnBadgeProps {
  spawnedAgents: SpawnedAgent[];
  pattiesDelivered: number;
  finished: boolean;
  /** 'desktop' renders as sticky top banner; 'mobile' renders as full-width strip */
  variant: "desktop" | "mobile";
}

export function OpenSpawnBadge({
  spawnedAgents,
  pattiesDelivered,
  finished,
  variant,
}: OpenSpawnBadgeProps) {
  const baseAgentCount = 22;
  const totalAgents = baseAgentCount + spawnedAgents.length;

  const agentText =
    spawnedAgents.length > 0
      ? `${baseAgentCount} + ${spawnedAgents.length} agents`
      : `${totalAgents} agents`;

  const suffix = finished
    ? `${pattiesDelivered.toLocaleString()} patties delivered 🎉`
    : `${agentText} · 5 departments · 0 humans`;

  // Both variants now render as full-width sticky banner
  return (
    <a
      href="https://openspawn.ai"
      target="_blank"
      rel="noopener noreferrer"
      className="openspawn-banner shrink-0 flex items-center justify-center gap-3 px-4"
      style={{
        background: "rgba(6,42,69,0.95)",
        borderBottom: "1px solid rgba(74,174,217,0.15)",
        textDecoration: "none",
        height: variant === "desktop" ? 40 : 36,
        backdropFilter: "blur(8px)",
        zIndex: 20,
      }}
    >
      <span className="text-sm">🪸</span>
      <span
        className="text-xs font-bold"
        style={{ color: "#4AAED9", fontFamily: "Nunito, sans-serif" }}
      >
        {suffix}
      </span>
      <span
        className="text-[10px]"
        style={{ color: "rgba(184,228,247,0.35)", fontFamily: "Nunito, sans-serif" }}
      >
        · Powered by OpenSpawn
      </span>
      <ExternalLink
        className="w-3 h-3 openspawn-banner-icon"
        style={{ color: "rgba(74,174,217,0.3)", transition: "color 0.3s" }}
      />
      <style>{`
        .openspawn-banner:hover {
          background: rgba(6, 50, 82, 0.95) !important;
        }
        .openspawn-banner:hover .openspawn-banner-icon {
          color: rgba(74,174,217,0.8) !important;
        }
      `}</style>
    </a>
  );
}
