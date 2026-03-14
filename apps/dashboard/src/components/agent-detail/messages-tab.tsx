import type { AgentFieldsFragment } from "@openspawn/dashboard-data";
import { isSandboxMode } from "@openspawn/dashboard-data";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useAgents } from "../../hooks/use-agents";
import { SANDBOX_URL } from "../../lib/sandbox-url";

type Agent = AgentFieldsFragment;

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

const acpTypeStyles: Record<string, { icon: string; accent: string; bg: string }> = {
  ack: {
    icon: "\u{1F44D}",
    accent: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
  },
  delegation: {
    icon: "\u{1F4CB}",
    accent: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  progress: {
    icon: "\u{1F4CA}",
    accent: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
  },
  escalation: {
    icon: "\u26A0\uFE0F",
    accent: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  completion: {
    icon: "\u2705",
    accent: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/30",
  },
  status_request: {
    icon: "\u{1F4AC}",
    accent: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
  },
};

export function MessagesTab({ agent }: { agent: Agent }) {
  const { agents: allAgents } = useAgents();
  const parent = allAgents.find((a) => a.id === agent.parentId);
  const reports = allAgents.filter((a) => a.parentId === agent.id);
  const firstReport = reports[0];

  const { data: sandboxMessages } = useQuery<SandboxMessage[]>({
    queryKey: ["sandbox-agent-messages", agent.agentId],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/agent/${agent.agentId}/messages`);
      return res.json() as Promise<SandboxMessage[]>;
    },
    enabled: isSandboxMode,
  });

  const generatedMessages = useMemo(() => {
    if (isSandboxMode) return [];
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

  if (isSandboxMode) {
    const msgs = sandboxMessages || [];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {msgs.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No messages yet</p>
          </div>
        ) : (
          msgs.map((msg, index) => {
            const isSent = msg.from === agent.agentId;
            const style = acpTypeStyles[msg.type] || acpTypeStyles.ack;
            const fromAgent = allAgents.find((a) => a.agentId === msg.from);
            const toAgent = allAgents.find((a) => a.agentId === msg.to);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: isSent ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] p-3 rounded-lg border ${style.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{style.icon}</span>
                    <span className={`text-xs font-medium ${style.accent}`}>{msg.type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {isSent ? `→ ${toAgent?.name || msg.to}` : `← ${fromAgent?.name || msg.from}`}
                    </span>
                  </div>
                  <p className="text-sm">{msg.body || msg.summary || msg.type}</p>
                  {msg.pct !== undefined && msg.pct !== null && (
                    <div className="mt-1 text-xs text-muted-foreground">Progress: {msg.pct}%</div>
                  )}
                  <p className="text-xs mt-2 text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {generatedMessages.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No messages yet</p>
        </div>
      ) : (
        generatedMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, x: message.type === "sent" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.type === "sent" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.type === "sent"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted border border-border"
              }`}
            >
              <p className="text-sm">{message.body}</p>
              <p
                className={`text-xs mt-2 ${
                  message.type === "sent" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
