import type { AgentFieldsFragment } from "@openspawn/dashboard-data";
import { isSandboxMode } from "@openspawn/dashboard-data";
import { useQuery } from "@tanstack/react-query";
import { Terminal } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { SANDBOX_URL } from "../../lib/sandbox-url";

type Agent = AgentFieldsFragment;

interface SandboxAgent {
  id: string;
  agentId: string;
  systemPrompt?: string;
}

export function PromptTab({ agent }: { agent: Agent }) {
  const { data: sandboxAgents } = useQuery<SandboxAgent[]>({
    queryKey: ["sandbox-agents-for-prompt"],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/agents`);
      return res.json() as Promise<SandboxAgent[]>;
    },
    enabled: isSandboxMode,
  });

  const systemPrompt = useMemo(() => {
    if (!isSandboxMode || !sandboxAgents) return null;
    const match = sandboxAgents.find((a) => a.agentId === agent.agentId || a.id === agent.agentId);
    return match?.systemPrompt || null;
  }, [sandboxAgents, agent.agentId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {isSandboxMode && systemPrompt ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap break-words">
            {systemPrompt}
          </pre>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>System prompt not available in this mode</p>
        </div>
      )}
    </motion.div>
  );
}
