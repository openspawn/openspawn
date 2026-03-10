/**
 * MissionControlFeed — chronological mission control message stream.
 * FeedVirtualList and ComposingIndicators are internal helpers.
 * Extracted from messages.tsx to reduce file size.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TypingIndicator } from "../components/presence";
import { usePresence, useTeams, useAgents } from "../hooks";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";
import { isSandboxMode } from "@openspawn/dashboard-data";
import { TeamFilterDropdown } from "../components/team-badge";
import type { Agent, Message } from "../hooks";
import { InlineAvatar, formatTime, typeColors, typeIcons } from "./message-utils";

// ─── FeedVirtualList ──────────────────────────────────────────────────────────

interface FeedVirtualListProps {
  filtered: Message[];
  allMessages: Message[];
  onViewThread: (convoKey: string) => void;
  agents: Agent[];
}

function FeedVirtualList({ filtered, onViewThread, agents }: FeedVirtualListProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-30" />
      <ScrollArea className="h-[600px]">
        <div className="space-y-0">
          <AnimatePresence mode="popLayout">
            {filtered.map((msg) => {
              const sender = msg.fromAgent;
              const receiver = msg.toAgent;
              const convoKey = [msg.fromAgentId, msg.toAgentId].sort().join("::");
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 md:gap-4 pb-3 pl-8 md:pl-12 relative"
                >
                  <div className="absolute left-2 md:left-4 w-3 h-3 md:w-4 md:h-4 rounded-full bg-card border-2 border-primary top-3" />
                  <Card
                    className={cn(
                      "flex-1 border-l-4",
                      isSandboxMode && msg.acpType === "delegation" && "border-l-blue-500",
                      isSandboxMode &&
                        msg.acpType === "escalation" &&
                        "border-l-red-500 bg-red-500/5",
                      isSandboxMode &&
                        msg.acpType === "completion" &&
                        "border-l-emerald-500 bg-emerald-500/5",
                      isSandboxMode && msg.acpType === "progress" && "border-l-slate-400",
                      isSandboxMode && msg.acpType === "ack" && "border-l-transparent",
                      !isSandboxMode && msg.type === "TASK" && "border-l-blue-500",
                      !isSandboxMode && msg.type === "STATUS" && "border-l-green-500",
                      !isSandboxMode && msg.type === "REPORT" && "border-l-purple-500",
                      !isSandboxMode && msg.type === "QUESTION" && "border-l-yellow-500",
                      !isSandboxMode && msg.type === "ESCALATION" && "border-l-red-500",
                    )}
                  >
                    <CardContent className="p-2 md:p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <InlineAvatar
                            agentId={msg.fromAgentId}
                            agents={agents}
                            className="w-5 h-5 md:w-6 md:h-6"
                          />
                          <span className="font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">
                            {sender?.name || "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <InlineAvatar
                            agentId={msg.toAgentId}
                            agents={agents}
                            className="w-5 h-5 md:w-6 md:h-6"
                          />
                          <span className="font-medium text-xs md:text-sm truncate max-w-[80px] md:max-w-none">
                            {receiver?.name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] md:text-[10px]",
                              typeColors[msg.type] || typeColors.GENERAL,
                            )}
                          >
                            {typeIcons[msg.type] || "💬"}
                          </Badge>
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {msg.taskRef && (
                          <Badge variant="outline" className="text-[9px] md:text-[10px]">
                            🔗 {msg.taskRef}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[9px] md:text-[10px] text-primary hover:text-primary/80 ml-auto"
                          onClick={() => onViewThread(convoKey)}
                        >
                          View thread →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── ComposingIndicators ──────────────────────────────────────────────────────

function ComposingIndicators() {
  const { presenceMap } = usePresence();
  const composing = Array.from(presenceMap.values()).filter((p) => p.isComposing);
  if (composing.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 px-2 py-1.5 border-t border-border/40">
      {composing.slice(0, 3).map((p) => (
        <TypingIndicator key={p.agentId} agentName={p.agentId} />
      ))}
    </div>
  );
}

// ─── MissionControlFeed ───────────────────────────────────────────────────────

interface MissionControlFeedProps {
  messages: Message[];
  onViewThread: (convoKey: string) => void;
}

export function MissionControlFeed({ messages, onViewThread }: MissionControlFeedProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const { teams: allTeams } = useTeams();
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const { agents } = useAgents();

  const filtered = useMemo(() => {
    let result = messages;
    if (filter) result = result.filter((m) => m.type === filter);
    if (teamFilter !== "all") {
      const teamAgentIds = new Set(agents.filter((a) => a.teamId === teamFilter).map((a) => a.id));
      result = result.filter(
        (m) => teamAgentIds.has(m.fromAgentId) || teamAgentIds.has(m.toAgentId),
      );
    }
    return result;
  }, [messages, filter, teamFilter, agents]);

  return (
    <div className="space-y-4">
      {/* Horizontal filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide items-center">
        <Button
          variant={filter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter(null)}
          className="shrink-0"
        >
          All
        </Button>
        {Object.keys(typeColors).map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(type)}
            className="shrink-0"
          >
            {typeIcons[type]} <span className="hidden sm:inline ml-1">{type.toLowerCase()}</span>
          </Button>
        ))}
        <div className="w-px h-6 bg-border shrink-0" />
        <TeamFilterDropdown
          value={teamFilter}
          onChange={setTeamFilter}
          teams={allTeams.filter((t) => !t.parentTeamId)}
          className="shrink-0 h-8 text-xs min-h-0"
        />
      </div>

      <FeedVirtualList
        filtered={filtered}
        allMessages={messages}
        onViewThread={onViewThread}
        agents={agents}
      />
      <ComposingIndicators />
    </div>
  );
}
