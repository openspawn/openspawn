import { MessageSquare } from "lucide-react";
import { PageHeader, EmptyState } from "@openspawn/dashboard-ui";
import { useMessages } from "../hooks";

export function MessagesPage() {
  const { messages, loading } = useMessages();

  return (
    <div className="space-y-6 h-full">
      <PageHeader title="Messages" description="Agent communication feed" />

      {loading ? (
        <div className="text-white/40 text-sm">Loading messages...</div>
      ) : messages.length === 0 ? (
        <EmptyState title="No messages" description="Messages between agents will appear here." />
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {msg.fromAgent?.name ?? msg.fromAgentId}
                </span>
                <span className="text-xs text-white/30">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-white/60">{msg.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
