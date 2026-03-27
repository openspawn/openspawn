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

export function useMessages(channelId?: string) {
  const rest = useRestMessages(channelId ?? "", { enabled: !!channelId });

  const raw = rest.data;
  const messages: Message[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown> | undefined)?.data)
      ? ((raw as Record<string, unknown>).data as Message[])
      : [];

  return {
    messages,
    loading: rest.isLoading,
    error: rest.error?.message,
    refetch: rest.refetch,
  };
}

interface ConversationsResult {
  conversations: Conversation[];
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
}

export function useConversations(): ConversationsResult {
  return {
    conversations: [],
    loading: false,
    error: undefined,
    refetch: () => Promise.resolve(),
  };
}

interface ConversationMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | undefined;
  refetch: () => Promise<void>;
}

export function useConversationMessages(
  _agent1Id: string,
  _agent2Id: string,
): ConversationMessagesResult {
  return {
    messages: [],
    loading: false,
    error: undefined,
    refetch: () => Promise.resolve(),
  };
}
