/**
 * Mock agent health data for StatusRing indicators.
 * Maps agent IDs to completion rates and credit usage.
 */

import { useMemo } from 'react';
import { usePresence, type PresenceStatus } from './use-presence';

export interface AgentHealth {
  completionRate: number;
  creditUsage: number;
  ringStatus: PresenceStatus;
}

/** Deterministic pseudo-random from string seed */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(id: string, offset: number): number {
  return ((hash(id + String(offset)) % 1000) / 1000);
}

export function useAgentHealth(): Map<string, AgentHealth> {
  const { presenceMap } = usePresence();

  return useMemo(() => {
    const map = new Map<string, AgentHealth>();

    for (const [id, presence] of presenceMap) {
      const s = presence.status;
      let completionRate: number;
      let creditUsage: number;

      switch (s) {
        case 'active':
          completionRate = 0.65 + seededRandom(id, 1) * 0.3;  // 0.65-0.95
          creditUsage = 0.3 + seededRandom(id, 2) * 0.35;     // 0.30-0.65
          break;
        case 'busy':
          completionRate = 0.5 + seededRandom(id, 1) * 0.3;
          creditUsage = 0.4 + seededRandom(id, 2) * 0.3;
          break;
        case 'error':
          completionRate = 0.1 + seededRandom(id, 1) * 0.25;  // 0.10-0.35
          creditUsage = 0.75 + seededRandom(id, 2) * 0.2;     // 0.75-0.95
          break;
        default: // idle
          completionRate = 0.2 + seededRandom(id, 1) * 0.3;   // 0.20-0.50
          creditUsage = 0.05 + seededRandom(id, 2) * 0.2;     // 0.05-0.25
          break;
      }

      map.set(id, { completionRate, creditUsage, ringStatus: s });
    }

    return map;
  }, [presenceMap]);
}
