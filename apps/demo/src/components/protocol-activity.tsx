import { useEffect, useState, useRef } from 'react';
import { Link2, Plug } from 'lucide-react';
import { isSandboxMode } from '../graphql/fetcher';
import { SANDBOX_URL } from '../lib/sandbox-url';

export function ProtocolActivity() {
  const [a2aCount, setA2aCount] = useState(0);
  const [mcpCount, setMcpCount] = useState(0);
  const [a2aPulse, setA2aPulse] = useState(false);
  const [mcpPulse, setMcpPulse] = useState(false);
  const a2aTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mcpTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isSandboxMode) return;

    const source = new EventSource(`${SANDBOX_URL}/api/stream`);

    source.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'connected') return;

        const isA2A = event.type?.startsWith('a2a') || event.type === 'human_order' ||
          event.message?.includes('A2A');
        const isMCP = event.type?.startsWith('mcp') || event.message?.includes('MCP');

        if (isA2A) {
          setA2aCount(c => c + 1);
          setA2aPulse(true);
          clearTimeout(a2aTimer.current);
          a2aTimer.current = setTimeout(() => setA2aPulse(false), 2000);
        }
        if (isMCP) {
          setMcpCount(c => c + 1);
          setMcpPulse(true);
          clearTimeout(mcpTimer.current);
          mcpTimer.current = setTimeout(() => setMcpPulse(false), 2000);
        }
      } catch { /* ignore */ }
    };

    return () => {
      source.close();
      clearTimeout(a2aTimer.current);
      clearTimeout(mcpTimer.current);
    };
  }, []);

  if (!isSandboxMode) return null;

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className={`flex items-center gap-1.5 text-cyan-400 transition-all ${a2aPulse ? 'scale-110' : ''}`}>
        <div className="relative">
          <Link2 className="h-3.5 w-3.5" />
          {a2aPulse && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          )}
        </div>
        <span>A2A: {a2aCount}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-violet-400 transition-all ${mcpPulse ? 'scale-110' : ''}`}>
        <div className="relative">
          <Plug className="h-3.5 w-3.5" />
          {mcpPulse && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-400 animate-ping" />
          )}
        </div>
        <span>MCP: {mcpCount}</span>
      </div>
    </div>
  );
}
