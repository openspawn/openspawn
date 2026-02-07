import { useState } from "react";
import { Bot, MoreVertical, Plus, X, Coins, Edit, Eye, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../components/ui/dialog";
import { useAgents } from "../hooks/use-agents";

interface Agent {
  id: string;
  agentId: string;
  name: string;
  status: string;
  role: string;
  level: number;
  currentBalance: number;
  lifetimeEarnings: number;
  model: string;
  createdAt: string;
}

type DialogMode = "view" | "edit" | "credits" | null;

function getStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "suspended":
    case "revoked":
      return "destructive";
    default:
      return "secondary";
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case "hr":
      return "bg-purple-500";
    case "manager":
      return "bg-blue-500";
    case "senior":
      return "bg-teal-500";
    case "worker":
      return "bg-slate-500";
    default:
      return "bg-gray-500";
  }
}

function AgentDetailsDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-secondary">
                <Bot className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
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
            <Badge variant="secondary">Level {agent.level}</Badge>
          </div>
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

function EditAgentDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [name, setName] = useState(agent.name);
  const [model, setModel] = useState(agent.model);
  const [status, setStatus] = useState(agent.status);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
  }

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setModel(e.target.value);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setStatus(e.target.value);
  }

  function handleSave() {
    // TODO: Implement mutation
    console.log("Save agent:", { name, model, status });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Update agent details for @{agent.agentId}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <select
              value={model}
              onChange={handleModelChange}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="claude-3-opus">claude-3-opus</option>
              <option value="claude-3-sonnet">claude-3-sonnet</option>
              <option value="claude-3-haiku">claude-3-haiku</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={handleStatusChange}
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

function AdjustCreditsDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"add" | "deduct">("add");
  const [reason, setReason] = useState("");

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
  }

  function handleReasonChange(e: React.ChangeEvent<HTMLInputElement>) {
    setReason(e.target.value);
  }

  function handleSubmit() {
    // TODO: Implement mutation
    console.log("Adjust credits:", { amount: Number(amount), type, reason });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Adjust Credits</DialogTitle>
          <DialogDescription>
            Modify credit balance for {agent.name}
          </DialogDescription>
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
              <Plus className="mr-2 h-4 w-4" />
              Add Credits
            </Button>
            <Button
              variant={type === "deduct" ? "destructive" : "outline"}
              onClick={() => setType("deduct")}
              className="w-full"
            >
              <Coins className="mr-2 h-4 w-4" />
              Deduct Credits
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
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
              onChange={handleReasonChange}
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

export function AgentsPage() {
  const { agents, loading, error } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  function handleAction(agent: Agent, mode: DialogMode) {
    setSelectedAgent(agent);
    setDialogMode(mode);
  }

  function handleCloseDialog() {
    setSelectedAgent(null);
    setDialogMode(null);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading agents</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Manage your AI agents and their permissions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register Agent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {agents.filter((a) => a.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + a.currentBalance, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length
                ? (agents.reduce((sum, a) => sum + a.level, 0) / agents.length).toFixed(1)
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="relative overflow-hidden">
            <div className={`absolute left-0 top-0 h-1 w-full ${getRoleColor(agent.role)}`} />
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-secondary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">@{agent.agentId}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAction(agent, "view")}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction(agent, "edit")}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAction(agent, "credits")}>
                    <Coins className="mr-2 h-4 w-4" />
                    Adjust Credits
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Ban className="mr-2 h-4 w-4" />
                    Revoke Access
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
                <Badge variant="outline">{agent.role}</Badge>
                <Badge variant="secondary">Lv. {agent.level}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-medium">{agent.currentBalance.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">{agent.model}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Register your first agent to get started with the multi-agent system.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Register Agent
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {selectedAgent && dialogMode === "view" && (
        <AgentDetailsDialog agent={selectedAgent} onClose={handleCloseDialog} />
      )}
      {selectedAgent && dialogMode === "edit" && (
        <EditAgentDialog agent={selectedAgent} onClose={handleCloseDialog} />
      )}
      {selectedAgent && dialogMode === "credits" && (
        <AdjustCreditsDialog agent={selectedAgent} onClose={handleCloseDialog} />
      )}
    </div>
  );
}
