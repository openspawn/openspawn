/**
 * Command bar for sending orders to the org in sandbox mode.
 * Fixed at the bottom of the viewport with order input + restart button.
 */
import { useState, useRef } from 'react';
import { Send, Crown, CheckCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSandboxMode } from '../graphql/fetcher';
import { SANDBOX_URL } from '../lib/sandbox-url';
import { Button } from './ui/button';

interface OrderHistoryItem {
  message: string;
  timestamp: number;
  status: 'sent' | 'sending' | 'error';
}

export function SandboxCommandBar() {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isSandboxMode) return null;

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3000);
  };

  const sendOrder = async () => {
    const message = input.trim();
    if (!message || sending) return;

    setSending(true);
    setHistory(prev => [...prev, { message, timestamp: Date.now(), status: 'sending' }]);
    setInput('');

    try {
      const res = await fetch(`${SANDBOX_URL}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (res.ok) {
        setHistory(prev =>
          prev.map((h, i) => i === prev.length - 1 ? { ...h, status: 'sent' } : h)
        );
        showFlash('📢 Order delivered to Agent Dennis');
      } else {
        setHistory(prev =>
          prev.map((h, i) => i === prev.length - 1 ? { ...h, status: 'error' } : h)
        );
      }
    } catch {
      setHistory(prev =>
        prev.map((h, i) => i === prev.length - 1 ? { ...h, status: 'error' } : h)
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const restartOrg = async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      const res = await fetch(`${SANDBOX_URL}/api/restart`, { method: 'POST' });
      if (res.ok) {
        showFlash('🔄 Org reset — COO will rebuild from scratch');
      }
    } catch {
      // ignore
    } finally {
      setRestarting(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-zinc-950/95 backdrop-blur-sm">
      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium whitespace-nowrap"
          >
            {flash}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Order input */}
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendOrder()}
            placeholder="Give an order to Agent Dennis..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
            disabled={sending}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={sendOrder}
          disabled={!input.trim() || sending}
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
        >
          <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
          Send
        </Button>

        {/* Restart button */}
        <Button
          onClick={restartOrg}
          disabled={restarting}
          variant="outline"
          size="sm"
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2"
        >
          <RotateCcw className={`w-4 h-4 ${restarting ? 'animate-spin' : ''}`} />
          🔄 Restart Org
        </Button>
      </div>

      {/* Recent orders (compact) */}
      {history.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-2">
          <div className="flex gap-3 overflow-x-auto text-xs text-zinc-500">
            {history.slice(-3).reverse().map((item) => (
              <span key={item.timestamp} className="flex items-center gap-1 shrink-0">
                {item.status === 'sending' && '⏳'}
                {item.status === 'sent' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                {item.status === 'error' && '✗'}
                <span className="truncate max-w-[200px]">{item.message}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
