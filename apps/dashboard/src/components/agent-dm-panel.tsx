import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, ChevronLeft, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";
import { getAgentAvatarUrl } from "../lib/avatar";
import { useConversations, useDirectMessages, type Conversation, type DirectMessage } from "../hooks";

interface AgentDMPanelProps {
  orgId: string;
  currentAgentId: string;
  currentAgentName: string;
  isOpen: boolean;
  onClose: () => void;
  initialPeerId?: string;
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function ConversationList({
  conversations,
  onSelect,
  loading,
}: {
  conversations: Conversation[];
  onSelect: (conv: Conversation) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start a conversation from an agent card</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1 p-2">
        {conversations.map((conv) => (
          <motion.button
            key={conv.channelId}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(conv)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
              "hover:bg-slate-800/50 text-left",
              conv.unreadCount > 0 && "bg-indigo-500/10 border border-indigo-500/30"
            )}
          >
            <img
              src={getAgentAvatarUrl(conv.otherAgentId, conv.otherAgentLevel)}
              alt={conv.otherAgentName}
              className="w-10 h-10 rounded-full ring-2 ring-slate-700"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate">{conv.otherAgentName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(conv.lastMessageAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {conv.lastMessage || "No messages yet"}
              </p>
            </div>
            {conv.unreadCount > 0 && (
              <Badge variant="default" className="bg-indigo-500 text-white text-xs px-2">
                {conv.unreadCount}
              </Badge>
            )}
          </motion.button>
        ))}
      </div>
    </ScrollArea>
  );
}

function MessageThread({
  orgId,
  currentAgentId,
  peerId,
  peerName,
  peerLevel,
  onBack,
  onSend,
}: {
  orgId: string;
  currentAgentId: string;
  peerId: string;
  peerName: string;
  peerLevel: number;
  onBack: () => void;
  onSend: (body: string) => Promise<void>;
}) {
  const { messages, loading } = useDirectMessages(orgId, currentAgentId, peerId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(input.trim());
      setInput("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-700">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <img
          src={getAgentAvatarUrl(peerId, peerLevel)}
          alt={peerName}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <span className="font-medium text-sm">{peerName}</span>
          <Badge variant="outline" className="ml-2 text-xs">L{peerLevel}</Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Start the conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isMe = msg.fromAgentId === currentAgentId;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn("flex gap-2", isMe && "flex-row-reverse")}
                  >
                    <img
                      src={getAgentAvatarUrl(
                        msg.fromAgentId,
                        msg.fromAgent?.level || 5
                      )}
                      alt=""
                      className="w-7 h-7 rounded-full flex-shrink-0"
                    />
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                        isMe
                          ? "bg-indigo-500 text-white rounded-br-md"
                          : "bg-slate-700 text-slate-100 rounded-bl-md"
                      )}
                    >
                      <p>{msg.body}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isMe ? "text-indigo-200" : "text-slate-400"
                        )}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border-slate-600"
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="sm"
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AgentDMPanel({
  orgId,
  currentAgentId,
  currentAgentName,
  isOpen,
  onClose,
  initialPeerId,
}: AgentDMPanelProps) {
  const { conversations, loading } = useConversations(orgId, currentAgentId);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  // Handle initial peer (when clicking "Message" on an agent card)
  useEffect(() => {
    if (initialPeerId && isOpen) {
      const existing = conversations.find((c) => c.otherAgentId === initialPeerId);
      if (existing) {
        setSelectedConv(existing);
      } else {
        // Create a temporary conversation object
        setSelectedConv({
          channelId: "new",
          otherAgentId: initialPeerId,
          otherAgentName: "Agent", // Would be resolved from agent data
          otherAgentLevel: 5,
          lastMessage: "",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 0,
        });
      }
    }
  }, [initialPeerId, isOpen, conversations]);

  const handleBack = () => setSelectedConv(null);

  const handleSend = async (body: string) => {
    // TODO: Implement actual send mutation
    console.log("Sending:", body, "to:", selectedConv?.otherAgentId);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700 z-50 flex flex-col"
          >
            {/* Header */}
            {!selectedConv && (
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-indigo-400" />
                  <h2 className="font-semibold">Messages</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {selectedConv ? (
                <MessageThread
                  orgId={orgId}
                  currentAgentId={currentAgentId}
                  peerId={selectedConv.otherAgentId}
                  peerName={selectedConv.otherAgentName}
                  peerLevel={selectedConv.otherAgentLevel}
                  onBack={handleBack}
                  onSend={handleSend}
                />
              ) : (
                <ConversationList
                  conversations={conversations}
                  onSelect={setSelectedConv}
                  loading={loading}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AgentDMPanel;
