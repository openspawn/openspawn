/**
 * Agent Avatar component with auto-generated unique avatars
 * Uses DiceBear to generate consistent avatars based on agent ID.
 * In sandbox mode, renders SpongeBob character emoji avatars.
 */

import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAgentAvatarUrl, getAvatarSettings } from '../lib/avatar';
import { Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { PresenceGlow, StatusDot } from './presence';
import { StatusRing } from './ui/status-ring';
import { isSandboxMode } from '../graphql/fetcher';
import type { PresenceStatus } from '../hooks/use-presence';

// ── SpongeBob Character Emoji Map ───────────────────────────────────────────
// Maps character names/IDs to emoji + background colors for sandbox mode

const SPONGEBOB_CHARS: Record<string, { emoji: string; bg: string }> = {
  // COO
  'mr-krabs':           { emoji: '🦀', bg: '#dc2626' },  // Red crab
  'mr. krabs':          { emoji: '🦀', bg: '#dc2626' },
  // Engineering
  'sandy':              { emoji: '🐿️', bg: '#a16207' },  // Land critter in the sea
  'sandy cheeks':       { emoji: '🐿️', bg: '#a16207' },
  'spongebob':          { emoji: '🧽', bg: '#eab308' },  // Yellow sponge
  'patrick':            { emoji: '⭐', bg: '#ec4899' },  // Pink starfish
  'patrick star':       { emoji: '⭐', bg: '#ec4899' },
  'squidward':          { emoji: '🦑', bg: '#06b6d4' },  // Squid!
  'pearl':              { emoji: '🐋', bg: '#f472b6' },  // Whale
  'pearl krabs':        { emoji: '🐋', bg: '#f472b6' },
  'gary':               { emoji: '🐌', bg: '#a78bfa' },  // Sea snail
  'plankton jr':        { emoji: '🦠', bg: '#16a34a' },  // Microbe
  // Security
  'karen':              { emoji: '🖥️', bg: '#6366f1' },  // Computer
  'mermaid man':        { emoji: '🧜‍♂️', bg: '#f97316' },  // Merman!
  // Marketing
  'perch':              { emoji: '🐟', bg: '#0ea5e9' },  // Fish reporter
  'perch perkins':      { emoji: '🐟', bg: '#0ea5e9' },
  'larry':              { emoji: '🦞', bg: '#dc2626' },  // Lobster!
  'larry the lobster':  { emoji: '🦞', bg: '#dc2626' },
  'bubble bass':        { emoji: '🐡', bg: '#65a30d' },  // Pufferfish (big guy)
  'dennis':             { emoji: '🦈', bg: '#374151' },  // Shark — the enforcer
  // Finance
  'squilliam':          { emoji: '🦑', bg: '#7c3aed' },  // Fancy squid
  'plankton':           { emoji: '🦠', bg: '#16a34a' },  // Plankton microbe
  'mrs. puff':          { emoji: '🐡', bg: '#f59e0b' },  // Pufferfish
  'mrs puff':           { emoji: '🐡', bg: '#f59e0b' },
  // Support
  'barnacle boy':       { emoji: '🐚', bg: '#0d9488' },  // Barnacle/shell
  'flying dutchman':    { emoji: '👻', bg: '#4b5563' },  // Ghost (spooky sea legend)
  'fred':               { emoji: '🐠', bg: '#d97706' },  // Generic fish (x3)
};

/** Try to match an agent to a SpongeBob character */
function getCharacterEmoji(agentId: string, name?: string): { emoji: string; bg: string } | null {
  if (!isSandboxMode) return null;

  const idLower = agentId.toLowerCase();
  const nameLower = (name || '').toLowerCase();

  // Try exact matches first, then partial
  for (const [key, val] of Object.entries(SPONGEBOB_CHARS)) {
    if (idLower.includes(key.replace(/[. ]/g, '-')) || nameLower.includes(key)) {
      return val;
    }
  }
  return null;
}

interface AgentAvatarProps {
  agentId: string;
  name?: string;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
  /** Emoji avatar from API (e.g. from ORG.md Avatar field) — overrides hardcoded map */
  avatar?: string | null;
  /** When provided, wraps the avatar with a presence glow ring and status dot */
  presenceStatus?: PresenceStatus;
  /** StatusRing health data — when provided, uses ring instead of glow */
  completionRate?: number;
  creditUsage?: number;
}

const SIZE_MAP = {
  sm: { class: 'h-8 w-8', px: 32 },
  md: { class: 'h-10 w-10', px: 40 },
  lg: { class: 'h-12 w-12', px: 48 },
  xl: { class: 'h-16 w-16', px: 64 },
} as const;

// Level colors for ring
const LEVEL_COLORS: Record<number, string> = {
  10: '#f472b6', // COO - pink
  9: '#a78bfa',  // HR - purple
  8: '#22c55e',  // Manager - green
  7: '#22c55e',
  6: '#06b6d4',  // Senior - cyan
  5: '#06b6d4',
  4: '#fbbf24',  // Worker - yellow
  3: '#fbbf24',
  2: '#71717a',  // Probation - gray
  1: '#71717a',
};

export function AgentAvatar({
  agentId,
  name,
  level = 5,
  size = 'md',
  className,
  showRing = true,
  avatar: avatarProp,
  presenceStatus,
  completionRate,
  creditUsage,
}: AgentAvatarProps) {
  const sizeConfig = SIZE_MAP[size];
  const levelColor = LEVEL_COLORS[level] || '#71717a';
  
  // Track avatar settings changes (style, background color, background type)
  const [avatarSettings, setAvatarSettings] = useState(getAvatarSettings);
  
  useEffect(() => {
    const handleStyleChange = () => {
      setAvatarSettings(getAvatarSettings());
    };
    window.addEventListener('avatar-style-changed', handleStyleChange as EventListener);
    return () => window.removeEventListener('avatar-style-changed', handleStyleChange as EventListener);
  }, []);
  
  // Check for SpongeBob character emoji (sandbox mode)
  // Prefer API-provided avatar, fall back to hardcoded map
  const charEmoji = useMemo(
    () => {
      if (avatarProp) {
        // API-provided emoji — pick a bg color from the hardcoded map or default
        const fromMap = getCharacterEmoji(agentId, name);
        return { emoji: avatarProp, bg: fromMap?.bg ?? (LEVEL_COLORS[level] || '#71717a') };
      }
      return getCharacterEmoji(agentId, name);
    },
    [agentId, name, avatarProp, level]
  );

  // Memoize avatar generation - regenerate when any setting changes
  const avatarUrl = useMemo(
    () => charEmoji ? null : getAgentAvatarUrl(agentId, level, sizeConfig.px * 2),
    [agentId, level, sizeConfig.px, avatarSettings, charEmoji]
  );

  const emojiSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' };

  const avatar = charEmoji ? (
    <Avatar
      className={cn(
        sizeConfig.class,
        showRing && !presenceStatus && 'ring-2',
        className
      )}
      style={{
        backgroundColor: charEmoji.bg,
        ...(showRing && !presenceStatus ? { '--tw-ring-color': charEmoji.bg } as React.CSSProperties : {}),
      }}
    >
      <AvatarFallback
        className={cn('flex items-center justify-center', emojiSizes[size])}
        style={{ backgroundColor: charEmoji.bg }}
      >
        {charEmoji.emoji}
      </AvatarFallback>
    </Avatar>
  ) : (
    <Avatar
      className={cn(
        sizeConfig.class,
        showRing && !presenceStatus && 'ring-2',
        className
      )}
      style={showRing && !presenceStatus ? { '--tw-ring-color': levelColor } as React.CSSProperties : undefined}
    >
      <AvatarImage src={avatarUrl!} alt={name || agentId} />
      <AvatarFallback
        style={{ backgroundColor: `${levelColor}20` }}
      >
        <Bot className="h-1/2 w-1/2" style={{ color: levelColor }} />
      </AvatarFallback>
    </Avatar>
  );

  if (presenceStatus && completionRate != null && creditUsage != null) {
    const ringSize = size === 'xl' ? 'lg' : size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
    return (
      <div className="relative inline-flex">
        <StatusRing
          completionRate={completionRate}
          creditUsage={creditUsage}
          status={presenceStatus}
          size={ringSize}
        >
          {avatar}
        </StatusRing>
        <StatusDot
          status={presenceStatus}
          size="sm"
          className="absolute -bottom-0.5 -right-0.5 z-10"
        />
      </div>
    );
  }

  if (presenceStatus) {
    return (
      <div className="relative inline-flex">
        <PresenceGlow status={presenceStatus}>
          {avatar}
        </PresenceGlow>
        <StatusDot
          status={presenceStatus}
          size="sm"
          className="absolute -bottom-0.5 -right-0.5 z-10"
        />
      </div>
    );
  }

  return avatar;
}
