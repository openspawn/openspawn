import type { AgentFields } from "@openspawn/dashboard-data";
import { isSandboxMode, SANDBOX_URL } from "@openspawn/dashboard-data";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { AgentDetailMessage } from "@openspawn/dashboard-ui";

interface SandboxMessage {
  id: string;
  type: string;
  from: string;
  to: string;
  body?: string;
  summary?: string;
  pct?: number | null;
  timestamp: string;
}

export function useAgentMessages(
  agent: AgentFields | undefined,
  agents: AgentFields[],
): AgentDetailMessage[] {
  const parent = agent ? agents.find((a) => a.id === agent.parentId) : undefined;
  const reports = agent ? agents.filter((a) => a.parentId === agent.id) : [];
  const firstReport = reports[0];

  const { data: sandboxMessages } = useQuery<SandboxMessage[]>({
    queryKey: ["sandbox-agent-messages", agent?.agentId],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/agent/${agent?.agentId}/messages`);
      return res.json() as Promise<SandboxMessage[]>;
    },
    enabled: isSandboxMode && !!agent,
  });

  const sandboxMapped = useMemo<AgentDetailMessage[]>(() => {
    if (!isSandboxMode || !sandboxMessages || !agent) return [];
    return sandboxMessages.map((msg) => {
      const isSent = msg.from === agent.agentId;
      const fromAgent = agents.find((a) => a.agentId === msg.from);
      const toAgent = agents.find((a) => a.agentId === msg.to);
      return {
        id: msg.id,
        type: msg.type,
        body: msg.body || msg.summary || msg.type,
        fromName: isSent ? agent.name : (fromAgent?.name ?? msg.from),
        toName: isSent ? (toAgent?.name ?? msg.to) : agent.name,
        acpType: msg.type,
        pct: msg.pct ?? null,
        createdAt: msg.timestamp,
      };
    });
  }, [sandboxMessages, agent, agents]);

  const generatedMessages = useMemo<AgentDetailMessage[]>(() => {
    if (isSandboxMode || !agent) return [];
    const domain = agent.domain ?? "operations";
    const reportName = firstReport?.name;
    const now = Date.now();

    const pool: Array<{ type: string; body: string; offset: number }> = [];

    if (parent) {
      pool.push({
        type: "received",
        body: `${agent.name}, please prioritize the ${domain} backlog items.`,
        offset: 1,
      });
      pool.push({
        type: "sent",
        body: `Acknowledged. Working on ${domain} tasks now.`,
        offset: 2,
      });
    }
    if (agent.tasksCompleted > 0) {
      pool.push({
        type: "sent",
        body: `Completed ${agent.tasksCompleted} task${agent.tasksCompleted > 1 ? "s" : ""} so far. Ready for more.`,
        offset: 3,
      });
    }
    if (reportName) {
      pool.push({
        type: "sent",
        body: `Delegated the latest ${domain} task to ${reportName}.`,
        offset: 4,
      });
      pool.push({
        type: "received",
        body: `${reportName} finished the subtask. Results look good.`,
        offset: 5,
      });
    }
    if (domain === "engineering" || domain === "code") {
      pool.push({
        type: "sent",
        body: "PR review complete. All checks passing.",
        offset: 6,
      });
    } else if (domain === "security") {
      pool.push({
        type: "sent",
        body: "Security scan finished. No critical vulnerabilities found.",
        offset: 7,
      });
    } else {
      pool.push({
        type: "sent",
        body: `${domain.charAt(0).toUpperCase() + domain.slice(1)} tasks are on track.`,
        offset: 6,
      });
    }
    if (agent.trustScore >= 90) {
      pool.push({
        type: "received",
        body: `Great reliability, ${agent.name}. Keep it up.`,
        offset: 10,
      });
    } else if (agent.trustScore < 50) {
      pool.push({
        type: "received",
        body: "Please improve task completion rate. Let me know if you need support.",
        offset: 11,
      });
    }

    return pool.slice(0, 5).map((m, i) => ({
      id: String(i + 1),
      type: m.type,
      body: m.body,
      createdAt: new Date(now - m.offset * 3600000).toISOString(),
    }));
  }, [agent, parent, firstReport]);

  if (isSandboxMode) return sandboxMapped;
  return generatedMessages;
}
