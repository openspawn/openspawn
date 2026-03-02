import { useMemo } from "react";
import { PageHeader, StatCard } from "@openspawn/dashboard-ui";
import { Users, CheckSquare, Activity } from "lucide-react";
import { useAgents, useTasks, useEvents } from "../hooks";
import { AgentStatus } from "@openspawn/dashboard-data";

export function DashboardPage() {
  const { agents } = useAgents();
  const { tasks } = useTasks();
  const { events } = useEvents();

  const stats = useMemo(() => ({
    agents: agents.length,
    activeAgents: agents.filter((a) => a.status === AgentStatus.Active).length,
    tasks: tasks.length,
    events: events.length,
  }), [agents, tasks, events]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your OpenSpawn deployment" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Agents" value={stats.agents} icon={Users} description={`${stats.activeAgents} active`} />
        <StatCard title="Active Agents" value={stats.activeAgents} icon={Users} />
        <StatCard title="Tasks" value={stats.tasks} icon={CheckSquare} />
        <StatCard title="Events" value={stats.events} icon={Activity} />
      </div>
    </div>
  );
}
