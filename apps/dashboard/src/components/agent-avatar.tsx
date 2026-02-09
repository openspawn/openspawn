/**
 * Agent Avatar component with auto-generated unique avatars
 * Uses DiceBear to generate consistent avatars based on agent ID
 */

import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAgentAvatarUrl, getAvatarStyle, type AvatarStyleKey } from '../lib/avatar';
import { Bot } from 'lucide-react';
import { cn } from '../lib/utils';

interface AgentAvatarProps {
  agentId: string;
  name?: string;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
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
}: AgentAvatarProps) {
  const sizeConfig = SIZE_MAP[size];
  const levelColor = LEVEL_COLORS[level] || '#71717a';
  
  // Track avatar style changes
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyleKey>(getAvatarStyle());
  
  useEffect(() => {
    const handleStyleChange = (e: CustomEvent<AvatarStyleKey>) => {
      setAvatarStyle(e.detail);
    };
    window.addEventListener('avatar-style-changed', handleStyleChange as EventListener);
    return () => window.removeEventListener('avatar-style-changed', handleStyleChange as EventListener);
  }, []);
  
  // Memoize avatar generation - regenerate when style changes
  const avatarUrl = useMemo(
    () => getAgentAvatarUrl(agentId, level, sizeConfig.px * 2), // 2x for retina
    [agentId, level, sizeConfig.px, avatarStyle]
  );

  return (
    <Avatar
      className={cn(
        sizeConfig.class,
        showRing && 'ring-2',
        className
      )}
      style={showRing ? { '--tw-ring-color': levelColor } as React.CSSProperties : undefined}
    >
      <AvatarImage src={avatarUrl} alt={name || agentId} />
      <AvatarFallback
        style={{ backgroundColor: `${levelColor}20` }}
      >
        <Bot className="h-1/2 w-1/2" style={{ color: levelColor }} />
      </AvatarFallback>
    </Avatar>
  );
}
