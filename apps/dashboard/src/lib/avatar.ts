/**
 * Generate unique agent avatars using DiceBear
 * Each agent gets a consistent avatar based on their ID
 */

import { createAvatar } from '@dicebear/core';
import { bottts, botttsNeutral, shapes, rings, glass, identicon } from '@dicebear/collection';

// Avatar style based on agent level
const LEVEL_STYLES = {
  // Leadership (L9-10): Premium glass style
  leadership: glass,
  // Managers (L7-8): Bottts neutral
  manager: botttsNeutral,
  // Seniors (L5-6): Bottts classic
  senior: bottts,
  // Workers (L3-4): Shapes
  worker: shapes,
  // Probation (L1-2): Rings
  probation: rings,
  // Fallback
  default: identicon,
} as const;

// Get avatar style based on level
function getStyleForLevel(level: number) {
  if (level >= 9) return LEVEL_STYLES.leadership;
  if (level >= 7) return LEVEL_STYLES.manager;
  if (level >= 5) return LEVEL_STYLES.senior;
  if (level >= 3) return LEVEL_STYLES.worker;
  if (level >= 1) return LEVEL_STYLES.probation;
  return LEVEL_STYLES.default;
}

// Level-based background colors (matching the level color scheme)
const LEVEL_BACKGROUNDS: Record<number, string[]> = {
  10: ['f9a8d4', 'f472b6', 'ec4899'], // COO - pink
  9: ['c4b5fd', 'a78bfa', '8b5cf6'],  // HR - purple
  8: ['86efac', '4ade80', '22c55e'],  // Manager - green
  7: ['86efac', '4ade80', '22c55e'],
  6: ['67e8f9', '22d3ee', '06b6d4'],  // Senior - cyan
  5: ['67e8f9', '22d3ee', '06b6d4'],
  4: ['fde047', 'facc15', 'eab308'],  // Worker - yellow
  3: ['fde047', 'facc15', 'eab308'],
  2: ['d4d4d8', 'a1a1aa', '71717a'],  // Probation - gray
  1: ['d4d4d8', 'a1a1aa', '71717a'],
};

export interface AvatarOptions {
  seed: string;
  level?: number;
  size?: number;
}

/**
 * Generate an SVG avatar for an agent
 * @param options.seed - Unique identifier (agent ID or name)
 * @param options.level - Agent level (1-10) for style selection
 * @param options.size - Avatar size in pixels
 * @returns SVG data URI
 */
export function generateAgentAvatar({ seed, level = 5, size = 64 }: AvatarOptions): string {
  const style = getStyleForLevel(level);
  const backgrounds = LEVEL_BACKGROUNDS[level] || LEVEL_BACKGROUNDS[5];
  
  const avatar = createAvatar(style, {
    seed,
    size,
    backgroundColor: backgrounds,
    backgroundType: ['gradientLinear'],
    backgroundRotation: [0, 90, 180, 270],
  });

  return avatar.toDataUri();
}

/**
 * Get avatar URL as a direct data URI
 * Use this in img src or Avatar components
 */
export function getAgentAvatarUrl(agentId: string, level: number = 5, size: number = 64): string {
  return generateAgentAvatar({ seed: agentId, level, size });
}
