/**
 * Agent Avatar component with auto-generated unique avatars.
 * Uses DiceBear by default; renders emoji avatars when provided via API.
 * Theme-agnostic — all character/emoji data comes from the API (ORG.md config).
 */

import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAgentAvatarUrl, getAvatarSettings } from '../lib/avatar';
import { Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { PresenceGlow, StatusDot } from './presence';
import { StatusRing } from './ui/status-ring';
import type { PresenceStatus } from '../hooks/use-presence';

interface AgentAvatarProps {
  agentId: string;
  name?: string;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
  /** Emoji avatar from API (e.g. from ORG.md Avatar field) */
  avatar?: string | null;
  /** Background color for emoji avatar from API (e.g. from ORG.md Avatar Color field) */
  avatarColor?: string | null;
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

// Level colors for ring (fallback when no avatarColor provided)
const LEVEL_COLORS: Record<number, string> = {
  10: '#f472b6', 9: '#a78bfa',
  8: '#22c55e', 7: '#22c55e',
  6: '#06b6d4', 5: '#06b6d4',
  4: '#fbbf24', 3: '#fbbf24',
  2: '#71717a', 1: '#71717a',
};

export function AgentAvatar({
  agentId,
  name,
  level = 5,
  size = 'md',
  className,
  showRing = true,
  avatar: avatarProp,
  avatarColor,
  presenceStatus,
  completionRate,
  creditUsage,
}: AgentAvatarProps) {
  const sizeConfig = SIZE_MAP[size];
  const levelColor = LEVEL_COLORS[level] || '#71717a';
  const bgColor = avatarColor || levelColor;
  
  // Track avatar settings changes (style, background color, background type)
  const [avatarSettings, setAvatarSettings] = useState(getAvatarSettings);
  
  useEffect(() => {
    const handleStyleChange = () => {
      setAvatarSettings(getAvatarSettings());
    };
    window.addEventListener('avatar-style-changed', handleStyleChange as EventListener);
    return () => window.removeEventListener('avatar-style-changed', handleStyleChange as EventListener);
  }, []);

  // Memoize avatar generation - regenerate when any setting changes
  const avatarUrl = useMemo(
    () => avatarProp ? null : getAgentAvatarUrl(agentId, level, sizeConfig.px * 2),
    [agentId, level, sizeConfig.px, avatarSettings, avatarProp]
  );

  const emojiSizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl', xl: 'text-3xl' };

  const avatar = avatarProp ? (
    <Avatar
      className={cn(
        sizeConfig.class,
        showRing && !presenceStatus && 'ring-2',
        className
      )}
      style={{
        backgroundColor: bgColor,
        ...(showRing && !presenceStatus ? { '--tw-ring-color': bgColor } as React.CSSProperties : {}),
      }}
    >
      <AvatarFallback
        className={cn('flex items-center justify-center', emojiSizes[size])}
        style={{ backgroundColor: bgColor }}
      >
        {avatarProp}
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
