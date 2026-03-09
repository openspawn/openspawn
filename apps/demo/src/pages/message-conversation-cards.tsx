/**
 * ConversationCards — expandable conversation card grid view.
 * Extracted from messages.tsx to reduce file size.
 */
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";
import { isSandboxMode } from "../graphql/fetcher";
import { TeamBadge } from "../components/team-badge";
import type { Agent, Message } from "../hooks";
import { InlineAvatar, formatTime, acpTypeRenderers } from "./message-utils";

interface ConversationCardsProps {
  messages: Message[];
  agents: Agent[];
  onViewThread: (convoKey: string) => void;
}

export function ConversationCards({ messages, agents, onViewThread }: ConversationCardsProps) {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  const agentMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; level: number; teamId?: string }>();
    agents.forEach((a) =>
      map.set(a.id, { id: a.id, name: a.name, level: a.level, teamId: a.teamId }),
    );
    return map;
  }, [agents]);

  const conversations = useMemo(() => {
    const groups = messages.reduce(
      (acc, msg) => {
        const key = [msg.fromAgentId, msg.toAgentId].sort().join("::");
        if (!acc[key]) acc[key] = [];
        acc[key].push(msg);
        return acc;
      },
      {} as Record<string, Message[]>,
    );

    return Object.entries(groups).sort((a, b) => {
      const aLatest = Math.max(...a[1].map((m) => new Date(m.createdAt).getTime()));
      const bLatest = Math.max(...b[1].map((m) => new Date(m.createdAt).getTime()));
      return bLatest - aLatest;
    });
  }, [messages]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {conversations.slice(0, 12).map(([key, msgs]) => {
        const [agent1Id, agent2Id] = key.split("::");
        const agent1 =
          agentMap.get(agent1Id) ||
          msgs.find((m) => m.fromAgentId === agent1Id)?.fromAgent ||
          msgs.find((m) => m.toAgentId === agent1Id)?.toAgent;
        const agent2 =
          agentMap.get(agent2Id) ||
          msgs.find((m) => m.fromAgentId === agent2Id)?.fromAgent ||
          msgs.find((m) => m.toAgentId === agent2Id)?.toAgent;
        const latestMsg = [...msgs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];
        const isExpanded = selectedConvo === key;

        return (
          <motion.div key={key} layout>
            <Card
              className={cn(
                "cursor-pointer transition-all active:scale-[0.98] hover:border-primary/50",
                isExpanded && "sm:col-span-2 lg:col-span-2 border-primary",
              )}
              onClick={() => setSelectedConvo(isExpanded ? null : key)}
            >
              <CardHeader className="pb-2 p-3 md:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex -space-x-2 shrink-0">
                      <InlineAvatar
                        agentId={agent1Id}
                        agents={agents}
                        className="w-7 h-7 md:w-8 md:h-8 border-2 border-card"
                        fontSize="text-sm md:text-base"
                      />
                      <InlineAvatar
                        agentId={agent2Id}
                        agents={agents}
                        className="w-7 h-7 md:w-8 md:h-8 border-2 border-card"
                        fontSize="text-sm md:text-base"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium truncate">
                        {agent1?.name || "Unknown"} ↔ {agent2?.name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {msgs.length} messages
                        </p>
                        {agent1?.teamId && (
                          <TeamBadge teamId={agent1.teamId} compact className="text-[8px]" />
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] md:text-[10px] shrink-0">
                    {formatTime(latestMsg.createdAt)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-3 md:p-4 pt-0">
                {!isExpanded ? (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {latestMsg.content}
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-48 md:h-64 mt-2">
                      <div className="space-y-2">
                        {[...msgs]
                          .sort(
                            (a, b) =>
                              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                          )
                          .slice(-10)
                          .map((msg) => {
                            const isAgent1 = msg.fromAgentId === agent1Id;
                            const acpType = msg.acpType;
                            const renderer =
                              acpType && isSandboxMode ? acpTypeRenderers[acpType] : undefined;
                            const acpResult = renderer?.(msg);

                            if (acpResult?.compact) {
                              return (
                                <div key={msg.id} className="flex justify-center my-0.5">
                                  <span className={acpResult.className}>{acpResult.label}</span>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex gap-2",
                                  isAgent1 ? "flex-row" : "flex-row-reverse",
                                )}
                              >
                                <InlineAvatar
                                  agentId={msg.fromAgentId}
                                  agents={agents}
                                  className="w-5 h-5 md:w-6 md:h-6 shrink-0"
                                />
                                <div
                                  className={cn(
                                    "max-w-[80%] p-2 rounded-lg text-xs md:text-sm",
                                    acpResult
                                      ? acpResult.className
                                      : isAgent1
                                        ? "bg-muted"
                                        : "bg-primary/10",
                                  )}
                                >
                                  {acpResult ? acpResult.label : msg.content}
                                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">
                                    {formatTime(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 h-7 text-xs text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewThread(key);
                      }}
                    >
                      Open full thread →
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
