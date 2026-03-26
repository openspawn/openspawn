import { useMemo } from "react";
import { AgentDetailPanel } from "@openspawn/dashboard-ui";
import { useAgents, useTasks } from "../hooks";

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

  if (!agent) return null;

  return (
    <AgentDetailPanel
      agent={agent}
      onClose={onClose}
      parentAgentName={parentAgentName}
      tasks={agentTasks}
      tasksLoading={tasksLoading}
    />
  );
}
