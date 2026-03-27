import { MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import type { AgentDetailMessage } from "./types";

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

interface MessagesTabProps {
  messages: AgentDetailMessage[];
}

export function MessagesTab({ messages }: MessagesTabProps) {
  if (messages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No messages yet</p>
        </div>
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
      {messages.map((msg, index) => {
        const isSent = msg.type === "sent";
        const style = msg.acpType ? (acpTypeStyles[msg.acpType] ?? acpTypeStyles.ack) : null;

        if (style) {
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
                  <span className={`text-xs font-medium ${style.accent}`}>{msg.acpType}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {isSent
                      ? msg.toName
                        ? `-> ${msg.toName}`
                        : ""
                      : msg.fromName
                        ? `<- ${msg.fromName}`
                        : ""}
                  </span>
                </div>
                <p className="text-sm">{msg.body}</p>
                {msg.pct != null && (
                  <div className="mt-1 text-xs text-muted-foreground">Progress: {msg.pct}%</div>
                )}
                <p className="text-xs mt-2 text-muted-foreground">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: isSent ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${isSent ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                isSent ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
              }`}
            >
              <p className="text-sm">{msg.body}</p>
              <p
                className={`text-xs mt-2 ${
                  isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
