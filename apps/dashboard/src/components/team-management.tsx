/**
 * Team CRUD — create, edit, delete teams from the dashboard.
 * In demo mode, changes persist to localStorage.
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Crown,
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
  Palette,
  type LucideIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import {
  type Team,
  teams as allTeams,
  getParentTeams,
  getTeamColor,
  TEAM_COLOR_MAP,
} from '../demo/teams';
import { useAgents } from '../hooks/use-agents';
import { cn } from '../lib/utils';

// ── Available icons ─────────────────────────────────────────────────────────
const ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Users', icon: Users },
  { name: 'Crown', icon: Crown },
  { name: 'Code2', icon: Code2 },
  { name: 'DollarSign', icon: DollarSign },
  { name: 'Megaphone', icon: Megaphone },
  { name: 'Server', icon: Server },
  { name: 'Monitor', icon: Monitor },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Send', icon: Send },
  { name: 'Handshake', icon: Handshake },
  { name: 'PenTool', icon: PenTool },
  { name: 'BarChart3', icon: BarChart3 },
  { name: 'UserPlus', icon: UserPlus },
  { name: 'Heart', icon: Heart },
  { name: 'MessageCircle', icon: MessageCircle },
  { name: 'Wrench', icon: Wrench },
  { name: 'Headphones', icon: Headphones },
];

const COLOR_OPTIONS = Object.entries(TEAM_COLOR_MAP).map(([name, hex]) => ({
  name,
  hex,
}));

// ── Create/Edit Dialog ──────────────────────────────────────────────────────
interface TeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  parentTeams: Team[];
  onSave: (team: Omit<Team, 'id'> & { id?: string }) => void;
}

export function TeamDialog({
  open,
  onOpenChange,
  team,
  parentTeams,
  onSave,
}: TeamDialogProps) {
  const isEdit = !!team;
  const [name, setName] = useState(team?.name ?? '');
  const [description, setDescription] = useState(team?.description ?? '');
  const [color, setColor] = useState(team?.color ?? 'cyan');
  const [icon, setIcon] = useState(team?.icon ?? 'Users');
  const [parentTeamId, setParentTeamId] = useState(team?.parentTeamId ?? '');
  const { agents } = useAgents();
  const [leadAgentId, setLeadAgentId] = useState(team?.leadAgentId ?? '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...(isEdit && team ? { id: team.id } : {}),
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      parentTeamId: parentTeamId || undefined,
      leadAgentId: leadAgentId || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Team' : 'Create Team'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update ${team?.name} settings`
              : 'Add a new team to your organization'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Engineering"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team do?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Parent Team */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Parent Team</label>
            <select
              value={parentTeamId}
              onChange={(e) => setParentTeamId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">None (top-level team)</option>
              {parentTeams
                .filter((t) => t.id !== team?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Lead Agent */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Team Lead</label>
            <select
              value={leadAgentId}
              onChange={(e) => setLeadAgentId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No lead assigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (L{a.level})
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => setColor(opt.name)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    color === opt.name
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: opt.hex }}
                  title={opt.name}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon;
                const hex = getTeamColor(color);
                return (
                  <button
                    key={opt.name}
                    onClick={() => setIcon(opt.name)}
                    className={cn(
                      'p-2 rounded-lg border transition-all',
                      icon === opt.name
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted',
                    )}
                    title={opt.name}
                  >
                    <IconComp
                      className="h-4 w-4"
                      style={{ color: icon === opt.name ? hex : undefined }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${getTeamColor(color)}20`,
                  color: getTeamColor(color),
                }}
              >
                {(() => {
                  const I = ICON_OPTIONS.find((o) => o.name === icon)?.icon ?? Users;
                  return <I className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: getTeamColor(color) }}>
                  {name || 'Team Name'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {description || 'Team description'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {isEdit ? 'Save Changes' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ── Delete Confirmation ─────────────────────────────────────────────────────
interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  memberCount: number;
  onConfirm: () => void;
}

export function DeleteTeamDialog({
  open,
  onOpenChange,
  team,
  memberCount,
  onConfirm,
}: DeleteTeamDialogProps) {
  const hex = getTeamColor(team.color);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{team.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${hex}20`, color: hex }}
            >
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{team.name}</p>
              <p className="text-xs text-muted-foreground">{team.description}</p>
            </div>
          </div>

          {memberCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Users className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                This team has <strong>{memberCount}</strong> member{memberCount !== 1 ? 's' : ''}.
                They will be unassigned.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Team
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
