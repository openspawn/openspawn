/**
 * Team View — collapsible team sections with agent cards.
 * Used on the Agents page as an alternative view to grid/list.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Crown,
  Users,
  CheckCircle,
  Coins,
  Code2,
  DollarSign,
  Megaphone,
  Server,
  Monitor,
  ShieldCheck,
  Send,
  Handshake,
  PenTool,
  BarChart3,
  UserPlus,
  Heart,
  MessageCircle,
  Wrench,
  Headphones,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { AgentAvatar } from './agent-avatar';
import { AgentModeBadge } from './agent-mode-selector';
import { getStatusVariant } from '../lib/status-colors';
import { cn } from '../lib/utils';
import {
  teams,
  type Team,
  getParentTeams,
  getSubTeams,
  getTeamColor,
  TEAM_COLOR_MAP,
} from '../demo/teams';
import { useAgents } from '../hooks/use-agents';
import { useTeamStats } from '../hooks/use-teams';
import { usePresence } from '../hooks/use-presence';
import { useAgentHealth } from '../hooks/use-agent-health';
import { AgentMode, AgentStatus } from '../graphql/generated/graphql';
import type { AgentFieldsFragment } from '../graphql/generated/graphql';

type Agent = AgentFieldsFragment;

// ── Icon resolver ───────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Crown,
  Code2,
  DollarSign,
  Megaphone,
  Users,
  Headphones,
  Server,
  Monitor,
  ShieldCheck,
  Send,
  Handshake,
  PenTool,
  BarChart3,
  UserPlus,
  Heart,
  MessageCircle,
  Wrench,
};

function getTeamIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Users;
}

// ── Compact agent card inside team section ──────────────────────────────────
function TeamAgentCard({
  agent,
  isLead,
  onClick,
}: {
  agent: Agent;
  isLead: boolean;
  onClick?: (id: string) => void;
}) {
  const { presenceMap } = usePresence();
  const healthMap = useAgentHealth();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/40 transition-colors cursor-pointer',
        isLead && 'ring-1 ring-amber-500/40 bg-amber-500/5',
      )}
      onClick={() => onClick?.(agent.id)}
    >
      <AgentAvatar
        agentId={agent.agentId}
        name={agent.name}
        level={agent.level}
        size="md"
        presenceStatus={presenceMap.get(agent.id)?.status}
        completionRate={healthMap.get(agent.id)?.completionRate}
        creditUsage={healthMap.get(agent.id)?.creditUsage}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{agent.name}</span>
          {isLead && (
            <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          L{agent.level} · @{agent.agentId}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant={getStatusVariant(agent.status)} className="text-[10px]">
          {agent.status}
        </Badge>
        <AgentModeBadge mode={agent.mode ?? AgentMode.Worker} size="sm" />
      </div>
    </motion.div>
  );
}

// ── Stats pill ──────────────────────────────────────────────────────────────
function TeamStatsPill({ teamId }: { teamId: string }) {
  const stats = useTeamStats(teamId);
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {stats.agentCount}
      </span>
      <span className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3 text-emerald-500" />
        {stats.activeCount} active
      </span>
      <span className="flex items-center gap-1">
        <Coins className="h-3 w-3 text-amber-500" />
        {stats.totalCredits.toLocaleString()}
      </span>
      <span className="hidden sm:flex items-center gap-1">
        {stats.taskCompletionRate}% success
      </span>
    </div>
  );
}

// ── Single team section ─────────────────────────────────────────────────────
function TeamSection({
  team,
  agents,
  depth = 0,
  defaultOpen = true,
  onAgentClick,
  onTeamClick,
}: {
  team: Team;
  agents: Agent[];
  depth?: number;
  defaultOpen?: boolean;
  onAgentClick?: (id: string) => void;
  onTeamClick?: (teamId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const subTeams = useMemo(() => getSubTeams(team.id), [team.id]);
  const color = getTeamColor(team.color);
  const Icon = getTeamIcon(team.icon);

  // Agents directly assigned to this team (not sub-teams)
  const directAgents = useMemo(
    () =>
      agents.filter((a) => a.teamId === team.id),
    [agents, team.id],
  );

  return (
    <div className={cn(depth > 0 && 'ml-4 sm:ml-6')}>
      {/* Team header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left',
          'hover:bg-accent/40 transition-colors group',
        )}
      >
        <div
          className="flex items-center justify-center rounded-md p-1.5 hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
          style={{ backgroundColor: `${color}20`, color }}
          onClick={(e) => {
            if (onTeamClick) {
              e.stopPropagation();
              onTeamClick(team.id);
            }
          }}
          title="View team details"
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm" style={{ color }}>
              {team.name}
            </span>
            <TeamStatsPill teamId={team.id} />
          </div>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            {team.description}
          </p>
        </div>

        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-2 pb-2">
              {/* Direct agents */}
              {directAgents.map((agent) => (
                <TeamAgentCard
                  key={agent.id}
                  agent={agent}
                  isLead={agent.id === team.leadAgentId}
                  onClick={onAgentClick}
                />
              ))}

              {/* Sub-teams */}
              {subTeams.map((sub) => (
                <TeamSection
                  key={sub.id}
                  team={sub}
                  agents={agents}
                  depth={depth + 1}
                  defaultOpen={false}
                  onAgentClick={onAgentClick}
                  onTeamClick={onTeamClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function TeamView({
  onAgentClick,
  onTeamClick,
}: {
  onAgentClick?: (id: string) => void;
  onTeamClick?: (teamId: string) => void;
}) {
  const { agents } = useAgents();
  const parentTeams = useMemo(() => getParentTeams(), []);

  return (
    <div className="space-y-2">
      {parentTeams.map((team) => (
        <Card key={team.id} className="overflow-hidden">
          <CardContent className="p-2">
            <TeamSection
              team={team}
              agents={agents}
              defaultOpen
              onAgentClick={onAgentClick}
              onTeamClick={onTeamClick}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
