/**
 * ContextLinkedMessages — context-driven message filter view (by agent, task, team).
 * Extracted from messages.tsx to reduce file size.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";
import { useTeams } from "../hooks";
import { TeamFilterDropdown } from "../components/team-badge";
import type { Message } from "../hooks";
import { InlineAvatar, formatTime, typeColors, typeIcons } from "./message-utils";

interface ContextLinkedMessagesProps {
  messages: Message[];
  agents: any[];
  onViewThread: (convoKey: string) => void;
}

export function ContextLinkedMessages({
  messages,
  agents,
  onViewThread,
}: ContextLinkedMessagesProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const { teams: allTeams } = useTeams();
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const tasks = useMemo(() => {
    const refs = new Set<string>();
    messages.forEach((m) => {
      if (m.taskRef) refs.add(m.taskRef);
    });
    return Array.from(refs);
  }, [messages]);

  const teamAgentIds = useMemo(() => {
    if (teamFilter === "all") return null;
    return new Set(agents.filter((a: any) => a.teamId === teamFilter).map((a: any) => a.id));
  }, [agents, teamFilter]);

  const filteredMessages = messages.filter((msg) => {
    if (selectedAgent && msg.fromAgentId !== selectedAgent && msg.toAgentId !== selectedAgent)
      return false;
    if (selectedTask && msg.taskRef !== selectedTask) return false;
    if (teamAgentIds && !teamAgentIds.has(msg.fromAgentId) && !teamAgentIds.has(msg.toAgentId))
      return false;
    return true;
  });

  const hasFilters = selectedAgent || selectedTask || teamFilter !== "all";
  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="space-y-3">
      {/* Compact horizontal filter bar */}
      <motion.div
        initial={false}
        animate={{ height: filtersExpanded ? "auto" : "40px" }}
        className={filtersExpanded ? "overflow-visible" : "overflow-hidden"}
      >
        <div className="flex items-center gap-2 flex-wrap bg-muted/50 border border-border rounded-lg p-2 overflow-visible">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="h-7 px-2 text-xs"
          >
            {filtersExpanded ? "▼" : "▶"} Filters
          </Button>

          <AnimatePresence mode="wait">
            {filtersExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 flex-wrap flex-1"
              >
                {/* Agent filter */}
                <div className="relative">
                  <Button
                    variant={selectedAgent ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowAgentDropdown(!showAgentDropdown);
                      setShowTaskDropdown(false);
                    }}
                    className="h-7 px-2 text-xs gap-1.5"
                  >
                    {selectedAgentData ? (
                      <>
                        <InlineAvatar
                          agentId={selectedAgent!}
                          agents={agents}
                          className="w-4 h-4"
                          fontSize="text-[8px]"
                        />
                        <span className="max-w-[100px] truncate">{selectedAgentData.name}</span>
                      </>
                    ) : (
                      <>👤 Agent</>
                    )}
                    {showAgentDropdown ? "▲" : "▼"}
                  </Button>
                  <AnimatePresence>
                    {showAgentDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl min-w-[200px] max-h-[280px] overflow-hidden"
                      >
                        <ScrollArea className="max-h-[280px]">
                          <div className="p-1">
                            <Button
                              variant={selectedAgent === null ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start text-xs h-8"
                              onClick={() => {
                                setSelectedAgent(null);
                                setShowAgentDropdown(false);
                              }}
                            >
                              All Agents
                            </Button>
                            {agents.map((agent) => (
                              <Button
                                key={agent.id}
                                variant={selectedAgent === agent.id ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start gap-2 text-xs h-8"
                                onClick={() => {
                                  setSelectedAgent(agent.id);
                                  setShowAgentDropdown(false);
                                }}
                              >
                                <InlineAvatar
                                  agentId={agent.id}
                                  agents={agents}
                                  className="w-4 h-4"
                                  fontSize="text-[8px]"
                                />
                                <span className="truncate">{agent.name}</span>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Task filter */}
                {tasks.length > 0 && (
                  <div className="relative">
                    <Button
                      variant={selectedTask ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setShowTaskDropdown(!showTaskDropdown);
                        setShowAgentDropdown(false);
                      }}
                      className="h-7 px-2 text-xs gap-1.5"
                    >
                      {selectedTask ? (
                        <>
                          📋 <span className="max-w-[100px] truncate">{selectedTask}</span>
                        </>
                      ) : (
                        <>📋 Task</>
                      )}
                      {showTaskDropdown ? "▲" : "▼"}
                    </Button>
                    <AnimatePresence>
                      {showTaskDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-xl min-w-[200px] max-h-[280px] overflow-hidden"
                        >
                          <ScrollArea className="max-h-[280px]">
                            <div className="p-1">
                              <Button
                                variant={selectedTask === null ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-xs h-8"
                                onClick={() => {
                                  setSelectedTask(null);
                                  setShowTaskDropdown(false);
                                }}
                              >
                                All Tasks
                              </Button>
                              {tasks.map((task) => (
                                <Button
                                  key={task}
                                  variant={selectedTask === task ? "secondary" : "ghost"}
                                  size="sm"
                                  className="w-full justify-start text-xs h-8"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskDropdown(false);
                                  }}
                                >
                                  📋 {task}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <TeamFilterDropdown
                  value={teamFilter}
                  onChange={setTeamFilter}
                  teams={allTeams.filter((t) => !t.parentTeamId)}
                  className="h-7 text-xs min-h-0"
                />

                {hasFilters && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(null);
                        setSelectedTask(null);
                        setTeamFilter("all");
                      }}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      ✕ Clear
                    </Button>
                  </motion.div>
                )}

                <span className="text-xs text-muted-foreground ml-auto">
                  {filteredMessages.length} message{filteredMessages.length !== 1 ? "s" : ""}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="space-y-2 md:space-y-3">
        {filteredMessages.length === 0 ? (
          <Card className="p-6 md:p-8 text-center">
            <p className="text-muted-foreground text-sm">No messages match the current filters</p>
          </Card>
        ) : (
          filteredMessages.slice(0, 20).map((msg) => {
            const sender = msg.fromAgent;
            const receiver = msg.toAgent;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:border-muted-foreground/30 transition-colors">
                  <CardContent className="p-2 md:p-3">
                    <div className="flex items-start gap-2 md:gap-3">
                      <InlineAvatar
                        agentId={msg.fromAgentId}
                        agents={agents}
                        className="w-8 h-8 md:w-10 md:h-10 shrink-0"
                        fontSize="text-lg md:text-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-xs md:text-sm">
                            {sender?.name || "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="font-medium text-xs md:text-sm">
                            {receiver?.name || "Unknown"}
                          </span>
                          <span className="text-[10px] md:text-xs text-muted-foreground ml-auto">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">{msg.content}</p>
                        <div className="flex gap-1 md:gap-2 mt-2 flex-wrap items-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] md:text-[10px]",
                              typeColors[msg.type] || typeColors.GENERAL,
                            )}
                          >
                            {typeIcons[msg.type] || "💬"} {msg.type?.toLowerCase()}
                          </Badge>
                          {msg.taskRef && (
                            <Badge
                              variant="outline"
                              className="text-[9px] md:text-[10px] cursor-pointer hover:bg-muted transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(msg.taskRef!);
                              }}
                            >
                              🔗 {msg.taskRef}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1.5 text-[9px] md:text-[10px] text-primary hover:text-primary/80 ml-auto"
                            onClick={() =>
                              onViewThread([msg.fromAgentId, msg.toAgentId].sort().join("::"))
                            }
                          >
                            View thread →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
