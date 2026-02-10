/**
 * TeamDetailPanel — shown in the global side panel when clicking a team.
 * Displays team info, stats, members list, and sub-teams.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Coins,
  TrendingUp,
  CheckCircle,
  Crown,
  Pencil,
  Trash2,
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
import { Badge } from './ui/badge';
import { AgentAvatar } from './agent-avatar';
import { AgentModeBadge } from './agent-mode-selector';
import { Progress } from './ui/progress';
import { getStatusVariant, getLevelColor } from '../lib/status-colors';
import {
  type Team,
  getTeamById,
  getSubTeams,
  getParentTeams,
  getTeamColor,
} from '../demo/teams';
import { useAgents } from '../hooks/use-agents';
import { useTeamStats } from '../hooks/use-teams';
import { AgentMode, AgentStatus } from '../graphql/generated/graphql';
import { TeamDialog, DeleteTeamDialog } from './team-management';
import { Button } from './ui/button';

const ICON_MAP: Record<string, LucideIcon> = {
  Crown, Code2, DollarSign, Megaphone, Users, Headphones,
  Server, Monitor, ShieldCheck, Send, Handshake,
  PenTool, BarChart3, UserPlus, Heart, MessageCircle, Wrench,
};

interface TeamDetailPanelProps {
  teamId: string;
  onAgentClick?: (agentId: string) => void;
  onTeamClick?: (teamId: string) => void;
}

export function TeamDetailPanel({ teamId, onAgentClick, onTeamClick }: TeamDetailPanelProps) {
  const team = useMemo(() => getTeamById(teamId), [teamId]);
  const subTeams = useMemo(() => getSubTeams(teamId), [teamId]);
  const { agents } = useAgents();
  const stats = useTeamStats(teamId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const parentTeams = useMemo(() => getParentTeams(), []);

  const members = useMemo(
    () => agents.filter((a) => a.teamId === teamId),
    [agents, teamId],
  );

  const lead = useMemo(
    () => (team?.leadAgentId ? agents.find((a) => a.id === team.leadAgentId) : undefined),
    [agents, team],
  );

  if (!team) return <div className="p-6 text-muted-foreground">Team not found</div>;

  const hex = getTeamColor(team.color);
  const Icon = ICON_MAP[team.icon] || Users;
  const activeCount = members.filter((m) => m.status === AgentStatus.Active).length;
  const totalBalance = members.reduce((sum, m) => sum + m.currentBalance, 0);
  const avgTrust = members.length
    ? Math.round(members.reduce((sum, m) => sum + (m.trustScore ?? 50), 0) / members.length)
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${hex}20`, color: hex }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{team.name}</h2>
          <p className="text-sm text-muted-foreground">{team.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setEditOpen(true)}
            title="Edit team"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Delete team"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Dialogs */}
      <TeamDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        team={team}
        parentTeams={parentTeams}
        onSave={(updated) => {
          // TODO: persist to API when available
          console.log('Team updated:', updated);
        }}
      />
      {team && (
        <DeleteTeamDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          team={team}
          memberCount={members.length}
          onConfirm={() => {
            // TODO: persist to API when available
            console.log('Team deleted:', team.id);
          }}
        />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">Members</span>
          </div>
          <p className="text-xl font-bold">
            {members.length}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({activeCount} active)
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coins className="h-3.5 w-3.5" />
            <span className="text-xs">Total Balance</span>
          </div>
          <p className="text-xl font-bold">{totalBalance.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-xs">Avg Trust</span>
          </div>
          <p className="text-xl font-bold">{avgTrust}/100</p>
          <Progress value={avgTrust} className="mt-1.5 h-1.5" />
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Tasks Done</span>
          </div>
          <p className="text-xl font-bold">
            {members.reduce((sum, m) => sum + (m.tasksCompleted ?? 0), 0)}
          </p>
        </div>
      </div>

      {/* Team Lead */}
      {lead && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Team Lead</h3>
          <button
            onClick={() => onAgentClick?.(lead.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
          >
            <AgentAvatar agentId={lead.agentId} name={lead.name} level={lead.level} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{lead.name}</p>
              <p className="text-xs text-muted-foreground">
                L{lead.level} · {lead.role}
              </p>
            </div>
            <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Sub-teams */}
      {subTeams.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Sub-Teams ({subTeams.length})
          </h3>
          <div className="space-y-2">
            {subTeams.map((sub) => {
              const SubIcon = ICON_MAP[sub.icon] || Users;
              const subHex = getTeamColor(sub.color);
              const subMembers = agents.filter((a) => a.teamId === sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => onTeamClick?.(sub.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${subHex}20`, color: subHex }}
                  >
                    <SubIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {subMembers.length}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Members list */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Members ({members.length})
        </h3>
        <div className="space-y-1.5">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No agents assigned to this team yet
            </p>
          ) : (
            members.map((agent, i) => (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onAgentClick?.(agent.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <AgentAvatar
                  agentId={agent.agentId}
                  name={agent.name}
                  level={agent.level}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{agent.agentId} · L{agent.level}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <AgentModeBadge mode={agent.mode ?? AgentMode.Worker} size="sm" />
                  <Badge variant={getStatusVariant(agent.status)} className="text-[10px]">
                    {agent.status}
                  </Badge>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
