/**
 * AgentVirtualGrid — virtualized responsive grid of agent cards.
 * Extracted from agents.tsx to reduce file size.
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "motion/react";
import { MoreVertical, Coins, Edit, Eye, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Sparkline, generateSparklineData } from "../components/ui/sparkline";
import { AgentAvatar } from "../components/agent-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { AgentModeBadge } from "../components/agent-mode-selector";
import { usePresence, useAgentHealth } from "../hooks";
import { getStatusVariant, getLevelColor, getLevelLabel } from "../lib/status-colors";
import { TeamBadge } from "../components/team-badge";
import { AgentMode, AgentStatus } from "../graphql/generated/graphql";
import type { AgentFieldsFragment } from "../graphql/generated/graphql";

type Agent = AgentFieldsFragment;
type DialogMode = "view" | "edit" | "credits" | null;

interface AgentVirtualGridProps {
  filteredAgents: Agent[];
  onCardClick: (id: string) => void;
  onAction: (agent: Agent, mode: DialogMode) => void;
}

export function AgentVirtualGrid({ filteredAgents, onCardClick, onAction }: AgentVirtualGridProps) {
  const { presenceMap } = usePresence();
  const healthMap = useAgentHealth();
  const parentRef = useRef<HTMLDivElement>(null);

  // Responsive columns based on container width
  const [colCount, setColCount] = useState(3);
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w < 500) setColCount(1);
      else if (w < 800) setColCount(2);
      else setColCount(3);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rows = useMemo(() => {
    const result: Agent[][] = [];
    for (let i = 0; i < filteredAgents.length; i += colCount) {
      result.push(filteredAgents.slice(i, i + colCount));
    }
    return result;
  }, [filteredAgents, colCount]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-26rem)] min-h-[400px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowAgents = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              }}
              className="grid gap-3 sm:gap-4 pb-4"
            >
              <AnimatePresence mode="popLayout">
                {rowAgents.map((agent) => {
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
                      <Card
                        data-testid="agent-card"
                        className="relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => onCardClick(agent.id)}
                      >
                        <div
                          className="absolute left-0 top-0 h-1 w-full"
                          style={{ backgroundColor: levelColor }}
                        />
                        <div
                          className="absolute top-3 right-12 px-2 py-0.5 rounded-full text-xs font-bold text-foreground"
                          style={{ backgroundColor: levelColor }}
                        >
                          L{agent.level}
                        </div>

                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                          <div className="flex items-center gap-3">
                            <AgentAvatar
                              agentId={agent.agentId}
                              name={agent.name}
                              level={agent.level}
                              size="md"
                              avatar={agent.avatar}
                              avatarUrl={agent.avatarUrl}
                              avatarColor={agent.avatarColor}
                              presenceStatus={presenceMap.get(agent.id)?.status}
                              completionRate={healthMap.get(agent.id)?.completionRate}
                              creditUsage={healthMap.get(agent.id)?.creditUsage}
                            />
                            <div>
                              <CardTitle className="text-base">{agent.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {getLevelLabel(agent.level)} • @{agent.agentId}
                              </p>
                              {presenceMap.get(agent.id)?.currentTask && (
                                <p className="text-[10px] text-emerald-400 truncate max-w-[160px]">
                                  working on: {presenceMap.get(agent.id)!.currentTask}
                                </p>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onAction(agent, "view")}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAction(agent, "edit")}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAction(agent, "credits")}>
                                <Coins className="mr-2 h-4 w-4" /> Adjust Credits
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Ban className="mr-2 h-4 w-4" /> Revoke Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>

                        <CardContent>
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant={getStatusVariant(agent.status)}>{agent.status}</Badge>
                            <AgentModeBadge mode={agent.mode ?? AgentMode.Worker} size="sm" />
                            <TeamBadge teamId={agent.teamId} />
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
                              <p className="text-muted-foreground">Activity</p>
                              <Sparkline
                                data={generateSparklineData(
                                  7,
                                  agent.status === AgentStatus.Active ? "up" : "stable",
                                )}
                                width={56}
                                height={18}
                                color={levelColor}
                                showDot
                                showTrend
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
