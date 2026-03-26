import { isSandboxMode, SANDBOX_URL } from "@openspawn/dashboard-data";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface SandboxAgent {
  id: string;
  agentId: string;
  systemPrompt?: string;
}

export function useAgentSystemPrompt(agentId: string | undefined): string | null {
  const { data: sandboxAgents } = useQuery<SandboxAgent[]>({
    queryKey: ["sandbox-agents-for-prompt"],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/agents`);
      return res.json() as Promise<SandboxAgent[]>;
    },
    enabled: isSandboxMode && !!agentId,
  });

  return useMemo(() => {
    if (!isSandboxMode || !sandboxAgents || !agentId) return null;
    const match = sandboxAgents.find((a) => a.agentId === agentId || a.id === agentId);
    return match?.systemPrompt ?? null;
  }, [sandboxAgents, agentId]);
}
