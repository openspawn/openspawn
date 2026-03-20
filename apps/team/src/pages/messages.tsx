import React, { useState, useRef, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Hash,
  Plus,
  Send,
  X,
  MessageSquare,
  User,
} from "lucide-react";
import {
  ScrollArea,
  Button,
  Input,
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  EmptyState,
} from "@openspawn/dashboard-ui";
import {
  useChannels,
  useCreateChannel,
  useChannelMessages,
  useSendMessage,
  useMessageThread,
  useSendDM,
  useDMHistory,
  useAgents,
} from "@openspawn/dashboard-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-yellow-500",
  "bg-red-500",
];

function agentColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AgentAvatar({ id, name }: { id: string; name?: string }) {
  const letter = (name ?? id).charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${agentColor(id)}`}
    >
      {letter}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types (from API response shape)
// ---------------------------------------------------------------------------

interface MessageItem {
  id: string;
  channel_id: string;
  sender_id: string;
  recipient_id: string | null;
  type: string;
  body: string;
  parent_message_id: string | null;
  metadata_: Record<string, unknown>;
  created_at: string;
}

interface ChannelItem {
  id: string;
  name: string;
  type: string;
  task_id: string | null;
  created_at: string;
}

interface AgentItem {
  id: string;
  agent_id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Create Channel Dialog
// ---------------------------------------------------------------------------

function CreateChannelDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("general");
  const createChannel = useCreateChannel();

  const handleCreate = () => {
    if (!name.trim()) return;
    createChannel.mutate(
      { name: name.trim(), type: type as "general" | "task" | "agent" | "broadcast" },
      {
        onSuccess: () => {
          setName("");
          setType("general");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <button className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>Create a new channel for agent communication.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Name</label>
            <Input
              placeholder="e.g. general, project-alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="task">Task-specific</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="broadcast">Broadcast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim() || createChannel.isPending}>
            {createChannel.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({
  channels,
  agents,
  activeChannel,
  activeDM,
  onSelectChannel,
  onSelectDM,
}: {
  channels: ChannelItem[];
  agents: AgentItem[];
  activeChannel: string | undefined;
  activeDM: string | undefined;
  onSelectChannel: (id: string) => void;
  onSelectDM: (agentId: string) => void;
}) {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-white/5 bg-white/[0.01]">
      {/* Channels */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Channels
          </span>
          <CreateChannelDialog />
        </div>
      </div>
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-0.5 px-2">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                activeChannel === ch.id
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
          {channels.length === 0 && (
            <p className="px-2 py-3 text-xs text-white/30">No channels yet</p>
          )}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-white/5" />

        {/* Direct Messages */}
        <div className="px-2 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Direct Messages
          </span>
        </div>
        <div className="space-y-0.5 px-2 pb-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelectDM(agent.id)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                activeDM === agent.id
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <AgentAvatar id={agent.id} name={agent.name} />
              <span className="truncate">{agent.name}</span>
            </button>
          ))}
          {agents.length === 0 && (
            <p className="px-2 py-3 text-xs text-white/30">No agents</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  agents,
  onThreadClick,
}: {
  msg: MessageItem;
  agents: AgentItem[];
  onThreadClick?: (messageId: string) => void;
}) {
  const sender = agents.find((a) => a.id === msg.sender_id);
  const senderName = sender?.name ?? msg.sender_id.slice(0, 8);

  return (
    <div className="group flex items-start gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors">
      <AgentAvatar id={msg.sender_id} name={senderName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-white">{senderName}</span>
          <span className="text-xs text-white/30">{relativeTime(msg.created_at)}</span>
        </div>
        <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
          {msg.body}
        </p>
        {onThreadClick && (
          <button
            onClick={() => onThreadClick(msg.id)}
            className="mt-1 flex items-center gap-1 text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Reply in thread</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message Input
// ---------------------------------------------------------------------------

function MessageInput({
  onSend,
  placeholder,
  disabled,
}: {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex items-center gap-2 border-t border-white/5 px-4 py-3">
      <Input
        className="flex-1"
        placeholder={placeholder ?? "Type a message..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        disabled={disabled}
      />
      <Button size="sm" onClick={handleSend} disabled={!text.trim() || disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread Panel
// ---------------------------------------------------------------------------

function ThreadPanel({
  messageId,
  agents,
  channelId,
  onClose,
}: {
  messageId: string;
  agents: AgentItem[];
  channelId: string;
  onClose: () => void;
}) {
  const { data: threadData } = useMessageThread(messageId);
  const sendMessage = useSendMessage();
  const feedEndRef = useRef<HTMLDivElement>(null);

  const messages = (threadData as { data?: MessageItem[] })?.data ?? [];

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (text: string) => {
    sendMessage.mutate({
      channel_id: channelId,
      body: text,
      type: "text",
      parent_message_id: messageId,
    });
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-white/5 bg-white/[0.01]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-semibold text-white">Thread</span>
        <button onClick={onClose} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white/70">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} agents={agents} />
          ))}
          <div ref={feedEndRef} />
        </div>
      </ScrollArea>
      <MessageInput onSend={handleSend} placeholder="Reply in thread..." disabled={sendMessage.isPending} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Channel View
// ---------------------------------------------------------------------------

function ChannelView({
  channelId,
  channelName,
  agents,
  onThreadClick,
}: {
  channelId: string;
  channelName: string;
  agents: AgentItem[];
  onThreadClick: (messageId: string) => void;
}) {
  const { data: msgData, isLoading } = useChannelMessages(channelId);
  const sendMessage = useSendMessage();
  const feedEndRef = useRef<HTMLDivElement>(null);

  const messages: MessageItem[] = (msgData as { data?: MessageItem[] })?.data ?? [];

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (text: string) => {
    sendMessage.mutate({ channel_id: channelId, body: text, type: "text" });
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <Hash className="h-4 w-4 text-white/40" />
        <span className="text-sm font-semibold text-white">{channelName}</span>
      </div>

      {/* Feed */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {isLoading && (
            <p className="px-4 py-8 text-center text-sm text-white/30">Loading messages...</p>
          )}
          {!isLoading && messages.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-white/30">
              No messages yet. Say something!
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              agents={agents}
              onThreadClick={onThreadClick}
            />
          ))}
          <div ref={feedEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        placeholder={`Message #${channelName}`}
        disabled={sendMessage.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// DM View
// ---------------------------------------------------------------------------

function DMView({
  agentId,
  agents,
}: {
  agentId: string;
  agents: AgentItem[];
}) {
  const { data: dmData, isLoading } = useDMHistory(agentId);
  const sendDM = useSendDM();
  const feedEndRef = useRef<HTMLDivElement>(null);

  const messages: MessageItem[] = (dmData as { data?: MessageItem[] })?.data ?? [];
  const agent = agents.find((a) => a.id === agentId);
  const agentName = agent?.name ?? agentId.slice(0, 8);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (text: string) => {
    sendDM.mutate({ recipient_id: agentId, body: text });
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <User className="h-4 w-4 text-white/40" />
        <span className="text-sm font-semibold text-white">DM with {agentName}</span>
      </div>

      {/* Feed */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {isLoading && (
            <p className="px-4 py-8 text-center text-sm text-white/30">Loading messages...</p>
          )}
          {!isLoading && messages.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-white/30">
              No messages yet. Start a conversation!
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} agents={agents} />
          ))}
          <div ref={feedEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        placeholder={`Message ${agentName}`}
        disabled={sendDM.isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function MessagesPage() {
  const searchParams = useSearch({ strict: false }) as {
    channel?: string;
    dm?: string;
    thread?: string;
  };
  const navigate = useNavigate();

  const { data: channelsData } = useChannels();
  const { data: agentsData } = useAgents();

  const channels: ChannelItem[] = (channelsData as { data?: ChannelItem[] })?.data ?? [];
  const agents: AgentItem[] = (agentsData as { data?: AgentItem[] })?.data ?? [];

  const activeChannel = searchParams.channel;
  const activeDM = searchParams.dm;
  const activeThread = searchParams.thread;

  // Find channel name for active channel
  const activeChannelObj = channels.find((c) => c.id === activeChannel);

  const handleSelectChannel = (id: string) => {
    navigate({ search: { channel: id } as Record<string, unknown> });
  };

  const handleSelectDM = (agentId: string) => {
    navigate({ search: { dm: agentId } as Record<string, unknown> });
  };

  const handleThreadClick = (messageId: string) => {
    navigate({
      search: {
        ...(activeChannel ? { channel: activeChannel } : {}),
        thread: messageId,
      } as Record<string, unknown>,
    });
  };

  const handleCloseThread = () => {
    navigate({
      search: {
        ...(activeChannel ? { channel: activeChannel } : {}),
        ...(activeDM ? { dm: activeDM } : {}),
      } as Record<string, unknown>,
    });
  };

  const hasSelection = activeChannel || activeDM;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <Sidebar
        channels={channels}
        agents={agents}
        activeChannel={activeChannel}
        activeDM={activeDM}
        onSelectChannel={handleSelectChannel}
        onSelectDM={handleSelectDM}
      />

      {/* Main area */}
      {!hasSelection ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            title="No messages yet"
            description="Create a channel or select a conversation to start collaborating."
          />
        </div>
      ) : activeChannel && activeChannelObj ? (
        <ChannelView
          channelId={activeChannel}
          channelName={activeChannelObj.name}
          agents={agents}
          onThreadClick={handleThreadClick}
        />
      ) : activeDM ? (
        <DMView agentId={activeDM} agents={agents} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            title="Channel not found"
            description="Select a channel or conversation from the sidebar."
          />
        </div>
      )}

      {/* Thread panel */}
      {activeThread && activeChannel && (
        <ThreadPanel
          messageId={activeThread}
          agents={agents}
          channelId={activeChannel}
          onClose={handleCloseThread}
        />
      )}
    </div>
  );
}
