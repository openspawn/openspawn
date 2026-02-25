/**
 * Scenario Event Toasts — slide-in alerts for scenario events.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { isSandboxMode } from '../graphql/fetcher';
import { useSandboxSSE, type SandboxSSEEvent } from '../hooks/use-sandbox-sse';

interface EventToast {
  id: string;
  message: string;
  type: 'interrupt' | 'disruption' | 'expansion' | 'default';
  timestamp: number;
}

const TYPE_STYLES: Record<string, string> = {
  interrupt: 'border-red-500/50 bg-red-950/80 text-red-200',
  disruption: 'border-yellow-500/50 bg-yellow-950/80 text-yellow-200',
  expansion: 'border-blue-500/50 bg-blue-950/80 text-blue-200',
  default: 'border-slate-500/50 bg-slate-900/80 text-slate-200',
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 6000;

export function ScenarioEventToasts() {
  const [toasts, setToasts] = useState<EventToast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: EventToast['type'] = 'default') => {
    const id = `toast-${++toastIdRef.current}`;
    setToasts(prev => {
      const next = [...prev, { id, message, type, timestamp: Date.now() }];
      return next.slice(-MAX_TOASTS);
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => {
      const remaining = AUTO_DISMISS_MS - (Date.now() - t.timestamp);
      if (remaining <= 0) {
        removeToast(t.id);
        return null;
      }
      return setTimeout(() => removeToast(t.id), remaining);
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [toasts, removeToast]);

  // Listen for scenario events via SSE
  useSandboxSSE(useCallback((event: SandboxSSEEvent) => {
    if (!isSandboxMode) return;
    if (event.type === 'scenario_event') {
      const msg = event.message ?? 'Scenario event occurred';
      // Guess type from message content
      let type: EventToast['type'] = 'default';
      if (msg.includes('🔥') || msg.includes('outage') || msg.includes('down') || msg.includes('critical') || msg.includes('🚨')) {
        type = 'interrupt';
      } else if (msg.includes('dispute') || msg.includes('sick') || msg.includes('breaks') || msg.includes('🦠')) {
        type = 'disruption';
      } else if (msg.includes('scope') || msg.includes('new') || msg.includes('expansion')) {
        type = 'expansion';
      }
      addToast(msg, type);
    }
  }, [addToast]));

  if (!isSandboxMode) return null;

  return (
    <div className="fixed top-12 right-4 z-[65] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`rounded-lg border px-3 py-2.5 text-sm shadow-lg backdrop-blur-sm flex items-start gap-2 ${TYPE_STYLES[toast.type]}`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
