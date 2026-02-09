/**
 * Generate unique agent avatars using DiceBear
 * Each agent gets a consistent avatar based on their ID
 */

import { createAvatar } from '@dicebear/core';
import { 
  bottts, 
  botttsNeutral, 
  shapes, 
  rings, 
  glass, 
  identicon,
  pixelArt,
  pixelArtNeutral,
  thumbs,
  lorelei,
  loreleiNeutral,
  notionists,
  notionistsNeutral,
  openPeeps,
  personas,
  funEmoji,
  dylan,
  micah,
  miniavs,
  adventurer,
  adventurerNeutral,
  bigEars,
  bigEarsNeutral,
  bigSmile,
  croodles,
  croodlesNeutral,
  icons,
  initials,
} from '@dicebear/collection';

// Available avatar styles with display names
export const AVATAR_STYLES = {
  bottts: { style: bottts, name: 'Bottts', description: 'Classic robot avatars' },
  botttsNeutral: { style: botttsNeutral, name: 'Bottts Neutral', description: 'Neutral robot avatars' },
  glass: { style: glass, name: 'Glass', description: 'Sleek glass orbs' },
  shapes: { style: shapes, name: 'Shapes', description: 'Geometric shapes' },
  rings: { style: rings, name: 'Rings', description: 'Colorful ring patterns' },
  identicon: { style: identicon, name: 'Identicon', description: 'GitHub-style patterns' },
  pixelArt: { style: pixelArt, name: 'Pixel Art', description: '8-bit style characters' },
  pixelArtNeutral: { style: pixelArtNeutral, name: 'Pixel Neutral', description: 'Neutral pixel characters' },
  thumbs: { style: thumbs, name: 'Thumbs', description: 'Thumbs up characters' },
  lorelei: { style: lorelei, name: 'Lorelei', description: 'Illustrated portraits' },
  loreleiNeutral: { style: loreleiNeutral, name: 'Lorelei Neutral', description: 'Neutral illustrated portraits' },
  notionists: { style: notionists, name: 'Notionists', description: 'Notion-style avatars' },
  notionistsNeutral: { style: notionistsNeutral, name: 'Notionists Neutral', description: 'Neutral Notion-style' },
  openPeeps: { style: openPeeps, name: 'Open Peeps', description: 'Hand-drawn people' },
  personas: { style: personas, name: 'Personas', description: 'Character personas' },
  funEmoji: { style: funEmoji, name: 'Fun Emoji', description: 'Expressive emoji faces' },
  dylan: { style: dylan, name: 'Dylan', description: 'Friendly illustrated faces' },
  micah: { style: micah, name: 'Micah', description: 'Minimalist portraits' },
  miniavs: { style: miniavs, name: 'Miniavs', description: 'Tiny cute avatars' },
  adventurer: { style: adventurer, name: 'Adventurer', description: 'RPG-style characters' },
  adventurerNeutral: { style: adventurerNeutral, name: 'Adventurer Neutral', description: 'Neutral RPG characters' },
  bigEars: { style: bigEars, name: 'Big Ears', description: 'Cartoon characters' },
  bigEarsNeutral: { style: bigEarsNeutral, name: 'Big Ears Neutral', description: 'Neutral cartoon characters' },
  bigSmile: { style: bigSmile, name: 'Big Smile', description: 'Happy smiling faces' },
  croodles: { style: croodles, name: 'Croodles', description: 'Doodle-style avatars' },
  croodlesNeutral: { style: croodlesNeutral, name: 'Croodles Neutral', description: 'Neutral doodles' },
  icons: { style: icons, name: 'Icons', description: 'Simple icon avatars' },
  initials: { style: initials, name: 'Initials', description: 'Letter initials' },
} as const;

export type AvatarStyleKey = keyof typeof AVATAR_STYLES;

// LocalStorage key for avatar style preference
const AVATAR_STYLE_KEY = 'openspawn-avatar-style';

// Get saved avatar style or default
export function getAvatarStyle(): AvatarStyleKey {
  if (typeof window === 'undefined') return 'bottts';
  const saved = localStorage.getItem(AVATAR_STYLE_KEY);
  if (saved && saved in AVATAR_STYLES) {
    return saved as AvatarStyleKey;
  }
  return 'bottts';
}

// Save avatar style preference
export function setAvatarStyle(style: AvatarStyleKey): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AVATAR_STYLE_KEY, style);
  // Dispatch event so components can react
  window.dispatchEvent(new CustomEvent('avatar-style-changed', { detail: style }));
}

// Get the DiceBear style object
function getStyle(styleKey: AvatarStyleKey) {
  return AVATAR_STYLES[styleKey]?.style || AVATAR_STYLES.bottts.style;
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
  styleOverride?: AvatarStyleKey;
}

/**
 * Generate an SVG avatar for an agent
 * @param options.seed - Unique identifier (agent ID or name)
 * @param options.level - Agent level (1-10) for background color
 * @param options.size - Avatar size in pixels
 * @param options.styleOverride - Override the saved style preference
 * @returns SVG data URI
 */
export function generateAgentAvatar({ seed, level = 5, size = 64, styleOverride }: AvatarOptions): string {
  const styleKey = styleOverride || getAvatarStyle();
  const style = getStyle(styleKey);
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

/**
 * Generate a preview avatar for a specific style
 */
export function generateStylePreview(styleKey: AvatarStyleKey, seed: string = 'preview', size: number = 64): string {
  const style = getStyle(styleKey);
  
  const avatar = createAvatar(style, {
    seed,
    size,
    backgroundColor: ['c4b5fd', 'a78bfa', '8b5cf6'], // Purple gradient
    backgroundType: ['gradientLinear'],
  });

  return avatar.toDataUri();
}
