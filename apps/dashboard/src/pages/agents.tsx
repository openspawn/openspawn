import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MoreVertical, Plus, Coins, Edit, Eye, Ban, Filter, ArrowUpDown, Search, Users, Wallet, Zap, Trophy } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAgents } from "../hooks/use-agents";
import { AgentOnboarding } from "../components/agent-onboarding";
import { BudgetManager } from "../components/budget-manager";
import { CapabilityManager } from "../components/capability-manager";
import { TrustLeaderboard } from "../components/trust-leaderboard";
import { ReputationCard } from "../components/reputation-card";
import { Progress } from "../components/ui/progress";

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
  // Trust & Reputation
  trustScore?: number;
  reputationLevel?: string;
  tasksCompleted?: number;
  tasksSuccessful?: number;
  lastActivityAt?: string;
}

type DialogMode = "view" | "edit" | "credits" | null;

// Level colors matching network page
const levelColors: Record<number, string> = {
  10: "#f472b6", // COO - pink
  9: "#a78bfa",  // HR - purple
  8: "#22c55e",  // Manager - green
  7: "#22c55e",
  6: "#06b6d4",  // Senior - cyan
  5: "#06b6d4",
  4: "#fbbf24",  // Worker - yellow
  3: "#fbbf24",
  2: "#71717a",  // Probation - gray
  1: "#71717a",
};

function getLevelColor(level: number): string {
  return levelColors[level] || "#71717a";
}

function getLevelLabel(level: number): string {
  if (level >= 10) return "COO";
  if (level >= 9) return "HR";
  if (level >= 7) return "Manager";
  if (level >= 5) return "Senior";
  if (level >= 3) return "Worker";
  return "Probation";
}

function getStatusVariant(status: string) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "PENDING":
      return "warning";
    case "PAUSED":
      return "warning";
    case "SUSPENDED":
    case "REVOKED":
      return "destructive";
    default:
      return "secondary";
  }
}

type SortField = "name" | "level" | "balance" | "status" | "created";
type SortDirection = "asc" | "desc";

function AgentDetailsDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const trustScore = agent.trustScore ?? 50;
  const repLevel = agent.reputationLevel || 'TRUSTED';
  const tasksCompleted = agent.tasksCompleted ?? 0;
  const tasksSuccessful = agent.tasksSuccessful ?? 0;
  const successRate = tasksCompleted > 0 ? Math.round((tasksSuccessful / tasksCompleted) * 100) : 0;

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
            <Badge className={REPUTATION_COLORS[repLevel] || 'bg-blue-500'}>
              {REPUTATION_EMOJI[repLevel] || '✅'} {repLevel}
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
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., gpt-4o, claude-sonnet-4"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
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

// Reputation level colors
const REPUTATION_COLORS: Record<string, string> = {
  NEW: "bg-gray-500",
  PROBATION: "bg-orange-500",
  TRUSTED: "bg-blue-500",
  VETERAN: "bg-purple-500",
  ELITE: "bg-yellow-500",
};

const REPUTATION_EMOJI: Record<string, string> = {
  NEW: "🆕",
  PROBATION: "⚠️",
  TRUSTED: "✅",
  VETERAN: "🏆",
  ELITE: "👑",
};

function ReputationTab({ agents }: { agents: Agent[] }) {
  // Sort agents by trust score for leaderboard
  const leaderboardData = useMemo(() => {
    return [...agents]
      .filter(a => a.status?.toLowerCase() === 'active')
      .sort((a, b) => (b.trustScore ?? 50) - (a.trustScore ?? 50))
      .slice(0, 10)
      .map(a => ({
        id: a.id,
        agentId: a.agentId,
        name: a.name,
        level: a.level,
        trustScore: a.trustScore ?? 50,
        reputationLevel: a.reputationLevel || 'TRUSTED',
        tasksCompleted: a.tasksCompleted ?? 0,
      }));
  }, [agents]);

  // Calculate reputation distribution
  const distribution = useMemo(() => {
    const counts: Record<string, number> = { NEW: 0, PROBATION: 0, TRUSTED: 0, VETERAN: 0, ELITE: 0 };
    agents.forEach(a => {
      const level = a.reputationLevel || 'TRUSTED';
      if (counts[level] !== undefined) counts[level]++;
    });
    return counts;
  }, [agents]);

  // Calculate average trust score
  const avgTrustScore = useMemo(() => {
    if (agents.length === 0) return 0;
    const sum = agents.reduce((acc, a) => acc + (a.trustScore ?? 50), 0);
    return Math.round(sum / agents.length);
  }, [agents]);

  // Total tasks completed
  const totalTasks = useMemo(() => {
    return agents.reduce((acc, a) => acc + (a.tasksCompleted ?? 0), 0);
  }, [agents]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTrustScore}/100</div>
            <Progress value={avgTrustScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Elite Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              👑 {distribution.ELITE}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Veteran Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              🏆 {distribution.VETERAN}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution and Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reputation Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Reputation Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(distribution).map(([level, count]) => (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{REPUTATION_EMOJI[level]}</span>
                    <span>{level}</span>
                  </span>
                  <span className="font-medium">{count} agents</span>
                </div>
                <Progress 
                  value={agents.length > 0 ? (count / agents.length) * 100 : 0} 
                  className={`h-2 ${REPUTATION_COLORS[level]}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <TrustLeaderboard entries={leaderboardData} />
      </div>

      {/* All Agents Trust Overview */}
      <Card>
        <CardHeader>
          <CardTitle>All Agents Trust Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents
              .sort((a, b) => (b.trustScore ?? 50) - (a.trustScore ?? 50))
              .map((agent) => {
                const trustScore = agent.trustScore ?? 50;
                const repLevel = agent.reputationLevel || 'TRUSTED';
                const successRate = agent.tasksCompleted && agent.tasksCompleted > 0
                  ? Math.round(((agent.tasksSuccessful ?? 0) / agent.tasksCompleted) * 100)
                  : 0;
                
                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback style={{ backgroundColor: getLevelColor(agent.level) + '30' }}>
                          <Bot className="h-5 w-5" style={{ color: getLevelColor(agent.level) }} />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          L{agent.level} · {agent.tasksCompleted ?? 0} tasks · {successRate}% success
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold">{trustScore}</div>
                        <div className="text-xs text-muted-foreground">trust</div>
                      </div>
                      <Badge className={REPUTATION_COLORS[repLevel]}>
                        {REPUTATION_EMOJI[repLevel]} {repLevel}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
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
  const [activeTab, setActiveTab] = useState("agents");
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("level");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = [...agents];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.name.toLowerCase().includes(query) || 
        a.agentId.toLowerCase().includes(query)
      );
    }
    
    // Status filter (normalize to uppercase for comparison)
    if (statusFilter !== "all") {
      result = result.filter(a => a.status?.toUpperCase() === statusFilter.toUpperCase());
    }
    
    // Level filter
    if (levelFilter !== "all") {
      const [min, max] = levelFilter.split("-").map(Number);
      result = result.filter(a => a.level >= min && a.level <= max);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "level":
          comparison = a.level - b.level;
          break;
        case "balance":
          comparison = a.currentBalance - b.currentBalance;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "created":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });
    
    return result;
  }, [agents, searchQuery, statusFilter, levelFilter, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

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
            Manage your AI agents, onboarding, and budgets
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Spawn Agent
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">All Agents</span>
            <span className="sm:hidden">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Reputation</span>
            <span className="sm:hidden">Trust</span>
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Onboarding</span>
            <span className="sm:hidden">Onboard</span>
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Capabilities</span>
            <span className="sm:hidden">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Budgets
          </TabsTrigger>
        </TabsList>

        {/* All Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="paused">Paused</option>
          <option value="suspended">Suspended</option>
        </select>
        
        {/* Level Filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Levels</option>
          <option value="9-10">L9-10 (Leadership)</option>
          <option value="7-8">L7-8 (Manager)</option>
          <option value="5-6">L5-6 (Senior)</option>
          <option value="3-4">L3-4 (Worker)</option>
          <option value="1-2">L1-2 (Probation)</option>
        </select>
        
        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          {(["level", "name", "balance", "created"] as SortField[]).map((field) => (
            <Button
              key={field}
              variant={sortField === field ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleSort(field)}
              className="capitalize"
            >
              {field}
              {sortField === field && (
                <ArrowUpDown className={`ml-1 h-3 w-3 ${sortDirection === "desc" ? "rotate-180" : ""}`} />
              )}
            </Button>
          ))}
        </div>
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

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAgents.length} of {agents.length} agents
      </div>

      {/* Agents grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredAgents.map((agent) => {
            const levelColor = getLevelColor(agent.level);
            return (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Level color bar */}
              <div 
                className="absolute left-0 top-0 h-1 w-full" 
                style={{ backgroundColor: levelColor }}
              />
              {/* Level indicator */}
              <div 
                className="absolute top-3 right-12 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: levelColor }}
              >
                L{agent.level}
              </div>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="ring-2" style={{ ringColor: levelColor }}>
                    <AvatarFallback 
                      className="text-white"
                      style={{ backgroundColor: `${levelColor}30` }}
                    >
                      <Bot className="h-4 w-4" style={{ color: levelColor }} />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {getLevelLabel(agent.level)} • @{agent.agentId}
                    </p>
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
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-medium flex items-center gap-1">
                      <span style={{ color: levelColor }}>💰</span>
                      {agent.currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p className="font-medium truncate text-xs">{agent.model}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAgents.length === 0 && agents.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matching agents</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your filters or search query.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setLevelFilter("all");
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

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
        </TabsContent>

        {/* Reputation Tab */}
        <TabsContent value="reputation" className="space-y-6">
          <ReputationTab agents={agents} />
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <AgentOnboarding />
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="space-y-6">
          <CapabilityManager />
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <BudgetManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
