/**
 * AgentsPage — main agents management view.
 *
 * Sub-components have been extracted to keep this file manageable:
 *   agent-dialogs.tsx        – AgentDetailsDialog, EditAgentDialog, AdjustCreditsDialog
 *   agent-reputation-tab.tsx – ReputationTab
 *   agent-virtual-grid.tsx   – AgentVirtualGrid
 */
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Bot,
  Plus,
  Filter,
  ArrowUpDown,
  Search,
  Users,
  Wallet,
  Zap,
  Trophy,
  Network,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { generateSparklineData } from "../components/ui/sparkline";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { PhaseChip } from "../components/phase-chip";
import { cn } from "../lib/utils";
import { SpawnAgentModal } from "../components/spawn-agent-modal";
import { useAgents, useCurrentPhase, usePresence } from "../hooks";
import { AgentOnboarding } from "../components/agent-onboarding";
import { BudgetManager } from "../components/budget-manager";
import { CapabilityManager } from "../components/capability-manager";
import { TeamView } from "../components/team-view";
import { EmptyState } from "../components/ui/empty-state";
import { AgentDetailPanel } from "../components/agent-detail-panel";
import { TeamDetailPanel } from "../components/team-detail-panel";
import { TeamDialog } from "../components/team-management";
import { getParentTeams } from "../demo/teams";
import { useSidePanel } from "../contexts";
import { TeamFilterDropdown } from "../components/team-badge";
import { useTeams } from "../hooks";
import { AgentStatus } from "@openspawn/dashboard-data";
import { AgentStatus as SharedAgentStatus } from "@openspawn/shared-types";
import type { AgentFieldsFragment } from "@openspawn/dashboard-data";

// Extracted sub-components
import { AgentDetailsDialog, EditAgentDialog, AdjustCreditsDialog } from "./agent-dialogs";
import { ReputationTab } from "./agent-reputation-tab";
import { AgentVirtualGrid } from "./agent-virtual-grid";

type Agent = AgentFieldsFragment;

import { DialogModeValue, type DialogMode, SortDirection } from "../lib/enums";

// Suppress unused-variable warning for usePresence (destructured but not used directly in JSX)
void usePresence;

export function AgentsPage() {
  const { agents, loading, error } = useAgents();
  const { currentPhase } = useCurrentPhase();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeTab, setActiveTab] = useState("agents");
  const { openSidePanel, closeSidePanel } = useSidePanel();
  const [spawnModalOpen, setSpawnModalOpen] = useState(false);

  const openAgentDetail = (agentId: string) => {
    openSidePanel(<AgentDetailPanel agentId={agentId} onClose={closeSidePanel} />, { width: 520 });
  };

  const openTeamDetail = (teamId: string) => {
    openSidePanel(
      <TeamDetailPanel
        teamId={teamId}
        onAgentClick={openAgentDetail}
        onTeamClick={openTeamDetail}
      />,
      { width: 480, title: "Team Details" },
    );
  };

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const parentTeamsForDialog = useMemo(() => getParentTeams(), []);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const agentSparklines = useMemo(
    () => ({
      total: generateSparklineData(7, "up"),
      active: generateSparklineData(7, "up"),
      balance: generateSparklineData(7, "stable"),
      level: generateSparklineData(7, "up"),
    }),
    [],
  );

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [teamFilterValue, setTeamFilterValue] = useState<string>("all");
  const { teams: allTeams } = useTeams();

  // Sorting state
  const [sortField, setAgentSortField] = useState<AgentSortField>(AgentSortField.Level);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Desc);

  const filteredAgents = useMemo(() => {
    let result = [...agents];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.name.toLowerCase().includes(q) || a.agentId.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status?.toUpperCase() === statusFilter.toUpperCase());
    }
    if (levelFilter !== "all") {
      const [min, max] = levelFilter.split("-").map(Number);
      result = result.filter((a) => a.level >= min && a.level <= max);
    }
    if (teamFilterValue !== "all") {
      result = result.filter((a) => a.teamId === teamFilterValue);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case AgentSortField.Name:
          cmp = a.name.localeCompare(b.name);
          break;
        case AgentSortField.Level:
          cmp = a.level - b.level;
          break;
        case AgentSortField.Balance:
          cmp = a.currentBalance - b.currentBalance;
          break;
        case AgentSortField.Status:
          cmp = a.status.localeCompare(b.status);
          break;
        case AgentSortField.Created:
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === SortDirection.Desc ? -cmp : cmp;
    });

    return result;
  }, [agents, searchQuery, statusFilter, levelFilter, teamFilterValue, sortField, sortDirection]);

  function handleSort(field: AgentSortField) {
    if (sortField === field)
      setSortDirection((d) => (d === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc));
    else {
      setAgentSortField(field);
      setSortDirection(SortDirection.Desc);
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
      <PageHeader
        title="Agents"
        description="Manage your AI agents, onboarding, and budgets"
        actions={
          <div className="flex items-center gap-3">
            {currentPhase && <PhaseChip phase={currentPhase} />}
            <Button onClick={() => setSpawnModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Spawn Agent
            </Button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex overflow-x-auto sm:grid sm:w-full sm:grid-cols-6 lg:w-[720px] scrollbar-hide">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">All Agents</span>
            <span className="sm:hidden">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span>Teams</span>
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

        {/* ── All Agents Tab ─────────────────────────────────────────────── */}
        <TabsContent value="agents">
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1 min-w-0 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
                  />
                </div>
                <Button
                  variant={filtersOpen ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="sm:hidden min-h-[44px] min-w-[44px]"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </div>

              <div
                className={cn(
                  "flex-wrap gap-3 items-center",
                  filtersOpen ? "flex" : "hidden sm:flex",
                )}
              >
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
                >
                  <option value="all">All Status</option>
                  <option value={SharedAgentStatus.ACTIVE}>Active</option>
                  <option value={SharedAgentStatus.PENDING}>Pending</option>
                  <option value={SharedAgentStatus.PAUSED}>Paused</option>
                  <option value={SharedAgentStatus.SUSPENDED}>Suspended</option>
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] sm:min-h-0"
                >
                  <option value="all">All Levels</option>
                  <option value="9-10">L9-10 (Leadership)</option>
                  <option value="7-8">L7-8 (Manager)</option>
                  <option value="5-6">L5-6 (Senior)</option>
                  <option value="3-4">L3-4 (Worker)</option>
                  <option value="1-2">L1-2 (Probation)</option>
                </select>

                <TeamFilterDropdown
                  value={teamFilterValue}
                  onChange={setTeamFilterValue}
                  teams={allTeams}
                />

                <div className="flex items-center gap-1 sm:ml-auto overflow-x-auto">
                  <span className="text-sm text-muted-foreground shrink-0">Sort:</span>
                  {[
                    AgentSortField.Level,
                    AgentSortField.Name,
                    AgentSortField.Balance,
                    AgentSortField.Created,
                  ].map((field) => (
                    <Button
                      key={field}
                      variant={sortField === field ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => handleSort(field)}
                      className="capitalize min-h-[44px] sm:min-h-0 shrink-0"
                    >
                      {field}
                      {sortField === field && (
                        <ArrowUpDown
                          className={`ml-1 h-3 w-3 ${sortDirection === SortDirection.Desc ? "rotate-180" : ""}`}
                        />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Agents"
                value={agents.length}
                sparklineData={agentSparklines.total}
                sparklineColor="#06b6d4"
              />
              <StatCard
                title="Active"
                value={agents.filter((a) => a.status === AgentStatus.Active).length}
                sparklineData={agentSparklines.active}
                sparklineColor="#10b981"
              />
              <StatCard
                title="Total Balance"
                value={agents.reduce((s, a) => s + a.currentBalance, 0).toLocaleString()}
                sparklineData={agentSparklines.balance}
                sparklineColor="#f59e0b"
              />
              <StatCard
                title="Avg Level"
                value={
                  agents.length
                    ? (agents.reduce((s, a) => s + a.level, 0) / agents.length).toFixed(1)
                    : "—"
                }
                sparklineData={agentSparklines.level}
                sparklineColor="#8b5cf6"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredAgents.length} of {agents.length} agents
            </div>

            <AgentVirtualGrid
              filteredAgents={filteredAgents}
              onCardClick={openAgentDetail}
              onAction={handleAction}
            />

            {filteredAgents.length === 0 && agents.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-border">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No matching agents</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your filters or search query.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setLevelFilter("all");
                    setTeamFilterValue("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {agents.length === 0 && (
              <EmptyState
                variant="agents"
                title="No agents registered yet"
                description="Register your first agent to get started with the multi-agent system."
                ctaLabel="Register your first agent →"
                onCta={() => {
                  /* noop */
                }}
              />
            )}

            {/* Dialogs */}
            {selectedAgent && dialogMode === DialogModeValue.View && (
              <AgentDetailsDialog agent={selectedAgent} onClose={handleCloseDialog} />
            )}
            {selectedAgent && dialogMode === DialogModeValue.Edit && (
              <EditAgentDialog agent={selectedAgent} onClose={handleCloseDialog} />
            )}
            {selectedAgent && dialogMode === DialogModeValue.Credits && (
              <AdjustCreditsDialog agent={selectedAgent} onClose={handleCloseDialog} />
            )}
          </div>
        </TabsContent>

        {/* ── Teams Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="teams" className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setCreateTeamOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create Team
            </Button>
          </div>
          <TeamView onAgentClick={openAgentDetail} onTeamClick={openTeamDetail} />
          <TeamDialog
            open={createTeamOpen}
            onOpenChange={setCreateTeamOpen}
            parentTeams={parentTeamsForDialog}
            onSave={(t) => {
              console.log("Team created:", t);
              setCreateTeamOpen(false);
            }}
          />
        </TabsContent>

        {/* ── Reputation Tab ─────────────────────────────────────────────── */}
        <TabsContent value="reputation" className="space-y-6">
          <ReputationTab agents={agents} onAgentClick={openAgentDetail} />
        </TabsContent>

        {/* ── Onboarding Tab ─────────────────────────────────────────────── */}
        <TabsContent value="onboarding" className="space-y-6">
          <AgentOnboarding />
        </TabsContent>

        {/* ── Capabilities Tab ───────────────────────────────────────────── */}
        <TabsContent value="capabilities" className="space-y-6">
          <CapabilityManager onAgentClick={openAgentDetail} />
        </TabsContent>

        {/* ── Budgets Tab ────────────────────────────────────────────────── */}
        <TabsContent value="budgets" className="space-y-6">
          <BudgetManager onAgentClick={openAgentDetail} />
        </TabsContent>
      </Tabs>

      <SpawnAgentModal
        open={spawnModalOpen}
        onOpenChange={setSpawnModalOpen}
        onSpawned={(agent) => {
          console.log(`🐣 ${agent.name} has joined the team!`);
        }}
      />
    </div>
  );
}

// Suppress unused motion import warning (used in sub-components in same file historically)
void motion;
