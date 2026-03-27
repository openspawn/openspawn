/**
 * Agent dialog components: AgentDetailsDialog, EditAgentDialog, AdjustCreditsDialog.
 * Extracted from agents.tsx to reduce file size.
 */
import { useState } from "react";
import { Plus, Coins } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { AgentAvatar } from "../components/agent-avatar";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../components/ui/dialog";
import { AgentModeBadge, AgentModeSelector } from "../components/agent-mode-selector";
import { getStatusVariant } from "../lib/status-colors";
import { REPUTATION_COLORS, REPUTATION_EMOJI } from "./agent-reputation-tab";
import { AgentMode, AgentStatus } from "@openspawn/shared-types";
import type { AgentFieldsFragment } from "@openspawn/dashboard-data";

type Agent = AgentFieldsFragment;

// ─── AgentDetailsDialog ───────────────────────────────────────────────────────

export function AgentDetailsDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const trustScore = agent.trustScore ?? 50;
  const repLevel = agent.reputationLevel || "TRUSTED";
  const tasksCompleted = agent.tasksCompleted ?? 0;
  const tasksSuccessful = agent.tasksSuccessful ?? 0;
  const successRate = tasksCompleted > 0 ? Math.round((tasksSuccessful / tasksCompleted) * 100) : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AgentAvatar
              agentId={agent.agentId}
              name={agent.name}
              level={agent.level}
              size="lg"
              avatar={agent.avatar}
              avatarUrl={agent.avatarUrl}
              avatarColor={agent.avatarColor}
            />
            <div>
              <DialogTitle>{agent.name}</DialogTitle>
              <DialogDescription>@{agent.agentId}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
            <Badge variant="outline">{agent.role}</Badge>
            <AgentModeBadge mode={(agent.mode as AgentMode) ?? AgentMode.WORKER} size="md" />
            <Badge variant="secondary">Level {agent.level}</Badge>
            <Badge className={REPUTATION_COLORS[repLevel] || "bg-blue-500"}>
              {REPUTATION_EMOJI[repLevel] || "✅"} {repLevel}
            </Badge>
          </div>

          {/* Trust Score */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Trust Score</span>
              <span className="text-lg font-bold">{trustScore}/100</span>
            </div>
            <Progress value={trustScore} className="h-2" />
          </div>

          {/* Task Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{tasksCompleted}</div>
              <div className="text-xs text-muted-foreground">Tasks</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{tasksSuccessful}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <div className="text-lg font-bold">{successRate}%</div>
              <div className="text-xs text-muted-foreground">Rate</div>
            </div>
          </div>

          {/* Credits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">{agent.currentBalance.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lifetime Earnings</p>
              <p className="text-2xl font-bold">{agent.lifetimeEarnings.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{agent.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(agent.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── EditAgentDialog ──────────────────────────────────────────────────────────

export function EditAgentDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [name, setName] = useState(agent.name);
  const [model, setModel] = useState(agent.model);
  const [status, setStatus] = useState(agent.status);
  const [mode, setMode] = useState<AgentMode>((agent.mode as AgentMode) ?? AgentMode.WORKER);

  function handleSave() {
    // DEFERRED: Agent edits are not yet persisted to the backend.
    // Wire to the updateAgent GraphQL mutation when available:
    //   updateAgent({ variables: { id: agent.id, name, model, status, mode } })
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>Update agent details for @{agent.agentId}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., gpt-4o, claude-sonnet-4"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent Mode</label>
            <AgentModeSelector value={mode} onChange={setMode} size="md" showDescription />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AgentStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ─── AdjustCreditsDialog ──────────────────────────────────────────────────────

export function AdjustCreditsDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"add" | "deduct">("add");
  const [reason, setReason] = useState("");

  function handleSubmit() {
    // DEFERRED: Credit adjustments are not yet persisted to the backend.
    // Wire to the adjustAgentCredits GraphQL mutation when available:
    //   adjustAgentCredits({ variables: { agentId: agent.id, amount: Number(amount), type, reason } })
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Adjust Credits</DialogTitle>
          <DialogDescription>Modify credit balance for {agent.name}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className="text-2xl font-bold">{agent.currentBalance.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={type === "add" ? "default" : "outline"}
              onClick={() => setType("add")}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Credits
            </Button>
            <Button
              variant={type === "deduct" ? "destructive" : "outline"}
              onClick={() => setType("deduct")}
              className="w-full"
            >
              <Coins className="mr-2 h-4 w-4" /> Deduct Credits
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Task completion bonus"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {amount && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <span className="text-sm text-muted-foreground">New Balance</span>
              <span className="text-2xl font-bold">
                {(type === "add"
                  ? agent.currentBalance + Number(amount)
                  : agent.currentBalance - Number(amount)
                ).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!amount || !reason}>
            Confirm Adjustment
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
