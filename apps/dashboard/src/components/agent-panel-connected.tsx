import { useMemo } from "react";
import { useUpdateAgent } from "@openspawn/dashboard-data";
import { AgentDetailPanel } from "@openspawn/dashboard-ui";
import type { AgentDetailAgent } from "@openspawn/dashboard-ui";
import { useAgents } from "../hooks/use-agents";
import { useTasks } from "../hooks/use-tasks";
import { useCredits } from "../hooks/use-credits";
import { useAgentMessages } from "../hooks/use-agent-messages";
import { useAgentSystemPrompt } from "../hooks/use-agent-system-prompt";
import { getTeamById } from "../demo/teams";
import { AgentAvatar } from "./agent-avatar";

interface Props {
  agentId: string;
  onClose: () => void;
}

export function ConnectedAgentDetailPanel({ agentId, onClose }: Props) {
  const { agents } = useAgents();
  const { tasks, loading: tasksLoading } = useTasks();

  const agent = useMemo(() => agents.find((a) => a.id === agentId), [agents, agentId]);

  const agentTasks = useMemo(
    () => tasks.filter((t) => t.assigneeId === agentId || t.assigneeId === agent?.agentId),
    [tasks, agentId, agent?.agentId],
  );

  const parentAgentName = useMemo(() => {
    if (!agent?.parentId) return undefined;
    return agents.find((a) => a.id === agent.parentId)?.name;
  }, [agents, agent?.parentId]);

  const teamName = useMemo(() => {
    if (!agent?.teamId) return undefined;
    return getTeamById(agent.teamId)?.name;
  }, [agent?.teamId]);

  const { transactions, loading: transactionsLoading } = useCredits(undefined, agent?.id, 20);
  const messages = useAgentMessages(agent, agents);
  const systemPrompt = useAgentSystemPrompt(agent?.agentId);
  const updateAgent = useUpdateAgent(agent?.id ?? "");

  const handleSaveSettings = (payload: { default_autonomy_level: number }) => {
    updateAgent.mutate(payload);
  };

  const handleRenderAvatar = (a: AgentDetailAgent) => (
    <AgentAvatar
      agentId={a.agentId}
      name={a.name}
      level={a.level}
      size="lg"
      avatar={a.avatar}
      avatarUrl={a.avatar}
      avatarColor={a.avatarColor}
    />
  );

  if (!agent) return null;

  return (
    <AgentDetailPanel
      agent={agent}
      onClose={onClose}
      parentAgentName={parentAgentName}
      teamName={teamName}
      tasks={agentTasks}
      tasksLoading={tasksLoading}
      transactions={transactions}
      transactionsLoading={transactionsLoading}
      messages={messages}
      systemPrompt={systemPrompt}
      onSaveSettings={handleSaveSettings}
      renderAvatar={handleRenderAvatar}
    />
  );
}
