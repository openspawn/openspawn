/**
 * TeamBadge — small colored pill showing team name.
 * Uses the team color from demo/teams.ts.
 */
import { useMemo } from 'react';
import { getTeamById, getTeamColor, type Team } from '../demo/teams';
import { cn } from '../lib/utils';

interface TeamBadgeProps {
  teamId: string | undefined | null;
  className?: string;
  /** Show compact version (icon only on mobile) */
  compact?: boolean;
}

export function TeamBadge({ teamId, className, compact }: TeamBadgeProps) {
  const team = useMemo(() => (teamId ? getTeamById(teamId) : undefined), [teamId]);

  if (!team) return null;

  const hex = getTeamColor(team.color);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] md:text-xs font-medium border whitespace-nowrap',
        compact && 'px-1.5',
        className,
      )}
      style={{
        backgroundColor: `${hex}18`,
        color: hex,
        borderColor: `${hex}40`,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: hex }}
      />
      {!compact && team.name}
    </span>
  );
}

/**
 * TeamFilterDropdown — reusable team filter for pages.
 */
interface TeamFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  teams: Team[];
  className?: string;
}

export function TeamFilterDropdown({
  value,
  onChange,
  teams,
  className,
}: TeamFilterDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0',
        className,
      )}
    >
      <option value="all">All Teams</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
