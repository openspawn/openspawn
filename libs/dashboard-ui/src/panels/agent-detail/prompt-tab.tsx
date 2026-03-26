import { Terminal } from "lucide-react";
import { motion } from "motion/react";

interface PromptTabProps {
  systemPrompt: string | null;
}

export function PromptTab({ systemPrompt }: PromptTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {systemPrompt ? (
        <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap break-words">
            {systemPrompt}
          </pre>
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
          <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>System prompt not available</p>
        </div>
      )}
    </motion.div>
  );
}
