import { ExternalLink } from 'lucide-react';
import type { SpawnedAgent } from './replay-data';

interface OpenSpawnBadgeProps {
  spawnedAgents: SpawnedAgent[];
  pattiesDelivered: number;
  finished: boolean;
  /** 'desktop' renders as absolute-positioned corner badge; 'mobile' renders as full-width strip */
  variant: 'desktop' | 'mobile';
}

export function OpenSpawnBadge({ spawnedAgents, pattiesDelivered, finished, variant }: OpenSpawnBadgeProps) {
  const baseAgentCount = 22;
  const totalAgents = baseAgentCount + spawnedAgents.length;

  // Dynamic subtitle text
  const subtitle = finished
    ? `${pattiesDelivered.toLocaleString()} patties · ${totalAgents} agents · 0 humans 🎉`
    : spawnedAgents.length > 0
      ? `${baseAgentCount} + ${spawnedAgents.length} agents · 5 depts · 0 humans`
      : `${totalAgents} agents · 5 departments · 0 humans`;

  if (variant === 'desktop') {
    return (
      <a
        href="https://openspawn.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="openspawn-badge-desktop group flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 20,
          background: 'rgba(6, 42, 69, 0.85)',
          border: '1px solid rgba(74, 174, 217, 0.25)',
          backdropFilter: 'blur(8px)',
          textDecoration: 'none',
          transition: 'border-color 0.3s, background 0.3s',
        }}
      >
        <span className="text-base">🪸</span>
        <div className="flex flex-col">
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
          >
            Orchestrated by OpenSpawn
          </span>
          <span
            className="text-[10px]"
            style={{ color: 'rgba(184,228,247,0.5)', fontFamily: 'Nunito, sans-serif' }}
          >
            {subtitle}
          </span>
        </div>
        <ExternalLink
          className="w-3 h-3 openspawn-badge-icon"
          style={{ color: '#4AAED9', opacity: 0.3, transition: 'opacity 0.3s' }}
        />
        <style>{`
          .openspawn-badge-desktop:hover {
            border-color: rgba(74, 174, 217, 0.6) !important;
            background: rgba(6, 50, 82, 0.9) !important;
          }
          .openspawn-badge-desktop:hover .openspawn-badge-icon {
            opacity: 0.8 !important;
          }
        `}</style>
      </a>
    );
  }

  // Mobile: full-width strip
  return (
    <a
      href="https://openspawn.ai"
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 px-4 py-2 flex items-center justify-between"
      style={{
        background: 'rgba(6,42,69,0.9)',
        borderBottom: '1px solid rgba(74,174,217,0.12)',
        textDecoration: 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span>🪸</span>
        <span
          className="text-xs font-bold"
          style={{ color: '#4AAED9', fontFamily: 'Nunito, sans-serif' }}
        >
          Orchestrated by OpenSpawn
        </span>
        <span
          className="text-[10px]"
          style={{ color: 'rgba(184,228,247,0.4)', fontFamily: 'Nunito, sans-serif' }}
        >
          · {subtitle}
        </span>
      </div>
      <ExternalLink className="w-3 h-3" style={{ color: 'rgba(74,174,217,0.4)' }} />
    </a>
  );
}
