import { MessageSquare } from "lucide-react";
import { PageHeader, EmptyState } from "@openspawn/dashboard-ui";
import { useMessages } from "../hooks";

export function MessagesPage() {
  const { messages, loading } = useMessages();

  return (
    <div className="space-y-6 h-full p-4 md:p-6">
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
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 space-y-1.5"
            >
              {/* Header: sender + timestamp — stack on mobile */}
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span className="text-sm font-medium text-white truncate">
                    {msg.fromAgent?.name ?? msg.fromAgentId}
                  </span>
                </div>
                <span className="text-xs text-white/30 shrink-0 sm:ml-2">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-white/60 leading-relaxed">{msg.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
