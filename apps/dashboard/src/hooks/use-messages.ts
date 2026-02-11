import { useQuery } from '@tanstack/react-query';
import { fetcher } from '../graphql/fetcher';
import { useDemo } from '../demo/DemoProvider';

// GraphQL queries for messages
const MESSAGES_QUERY = `
  query Messages($limit: Int) {
    messages(limit: $limit) {
      id
      fromAgentId
      toAgentId
      fromAgent {
        id
        name
        level
      }
      toAgent {
        id
        name
        level
      }
      content
      type
      taskRef
      read
      createdAt
    }
  }
`;

const CONVERSATIONS_QUERY = `
  query Conversations {
    conversations {
      id
      agents {
        id
        name
        level
      }
      messageCount
      unreadCount
      latestMessage {
        id
        content
        type
        createdAt
      }
      createdAt
    }
  }
`;

const CONVERSATION_MESSAGES_QUERY = `
  query ConversationMessages($agent1Id: ID!, $agent2Id: ID!) {
    conversationMessages(agent1Id: $agent1Id, agent2Id: $agent2Id) {
      id
      fromAgentId
      toAgentId
      fromAgent {
        id
        name
        level
      }
      toAgent {
        id
        name
        level
      }
      content
      type
      taskRef
      read
      createdAt
    }
  }
`;

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

export function useMessages(limit = 50) {
  const { isDemo } = useDemo();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['messages', limit],
    queryFn: fetcher<{ messages: Message[] }, { limit: number }>(
      MESSAGES_QUERY,
      { limit }
    ),
    refetchInterval: isDemo ? false : 10000, // Demo mode refetches on tick
  });

  return {
    messages: data?.messages || [],
    loading: isLoading,
    error: error?.message,
    refetch,
  };
}

export function useConversations() {
  const { isDemo } = useDemo();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetcher<{ conversations: Conversation[] }, Record<string, never>>(
      CONVERSATIONS_QUERY,
      {}
    ),
    refetchInterval: isDemo ? false : 10000,
  });

  return {
    conversations: data?.conversations || [],
    loading: isLoading,
    error: error?.message,
    refetch,
  };
}

export function useConversationMessages(agent1Id: string, agent2Id: string) {
  const { isDemo } = useDemo();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversationMessages', agent1Id, agent2Id],
    queryFn: fetcher<{ conversationMessages: Message[] }, { agent1Id: string; agent2Id: string }>(
      CONVERSATION_MESSAGES_QUERY,
      { agent1Id, agent2Id }
    ),
    enabled: Boolean(agent1Id && agent2Id),
    refetchInterval: isDemo ? false : 5000,
  });

  return {
    messages: data?.conversationMessages || [],
    loading: isLoading,
    error: error?.message,
    refetch,
  };
}
