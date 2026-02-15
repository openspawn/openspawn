/**
 * Team Stats Cards — compact overview of each top-level team.
 * Shown on the dashboard page as a "Teams" section.
 */
import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Crown,
  Code2,
  DollarSign,
  Megaphone,
  Users,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import { Card } from './ui/card';
import { getParentTeams, getTeamColor, type Team } from '../demo/teams';
import { useTeamStats } from '../hooks/use-teams';

// ── Icon map (top-level only) ───────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Code2,
  DollarSign,
  Megaphone,
  Users,
  Headphones,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Users;
}

// ── Health indicator ────────────────────────────────────────────────────────
function HealthDot({ rate }: { rate: number }) {
  const color =
    rate >= 85 ? '#10b981' : rate >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
      title={`${rate}% success`}
    />
  );
}

// ── Single card ─────────────────────────────────────────────────────────────
function TeamCard({
  team,
  onClick,
}: {
  team: Team;
  onClick?: (teamId: string) => void;
}) {
  const stats = useTeamStats(team.id);
  const color = getTeamColor(team.color);
  const Icon = getIcon(team.icon);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onClick?.(team.id)}
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <div
          className="flex items-center justify-center rounded-md p-1.5"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{team.name}</span>
            <HealthDot rate={stats.taskCompletionRate} />
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.agentCount} agents · {stats.activeCount} active
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function TeamStatsCards({
  onTeamClick,
}: {
  onTeamClick?: (teamId: string) => void;
}) {
  const parentTeams = useMemo(() => getParentTeams(), []);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Teams
        </h3>
      </div>

      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {parentTeams.map((team) => (
          <TeamCard key={team.id} team={team} onClick={onTeamClick} />
        ))}
      </div>
    </Card>
  );
}
