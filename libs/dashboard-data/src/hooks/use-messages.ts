import { useRestMessages } from "../rest/hooks/use-messages";

export interface Message {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  fromAgent: { id: string; name: string; level: number } | null;
  toAgent: { id: string; name: string; level: number } | null;
  content: string;
  type: string;
  acpType?: string;
  reason?: string;
  summary?: string;
  pct?: number;
  taskRef: string | null;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  agents: { id: string; name: string; level: number }[];
  messageCount: number;
  unreadCount: number;
  latestMessage: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
  };
  createdAt: string;
}

export function useMessages() {
  const rest = useRestMessages();

  return {
    messages: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error?.message,
    refetch: rest.refetch,
  };
}

export function useConversations() {
  return {
    conversations: [] as Conversation[],
    loading: false,
    error: undefined as string | undefined,
    refetch: () => Promise.resolve({} as ReturnType<typeof useRestMessages>),
  };
}

export function useConversationMessages(_agent1Id: string, _agent2Id: string) {
  return {
    messages: [] as Message[],
    loading: false,
    error: undefined as string | undefined,
    refetch: () => Promise.resolve({} as ReturnType<typeof useRestMessages>),
  };
}
