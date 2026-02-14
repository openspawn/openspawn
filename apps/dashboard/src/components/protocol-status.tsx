import { useState, useRef, useEffect } from 'react';
import { Link2, Plug } from 'lucide-react';

interface ProtocolBadgeProps {
  label: string;
  icon: typeof Link2;
  color: string;
  hoverColor: string;
  details: { version: string; info: string; link: string; linkLabel: string };
}

function ProtocolBadge({ label, icon: Icon, color, hoverColor, details }: ProtocolBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${color} hover:${hoverColor}`}
      >
        <Icon className="h-3 w-3" />
        {label} ✓
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-56 rounded-lg border border-border bg-popover p-3 shadow-lg text-xs space-y-2">
          <div className="font-medium text-foreground">{details.version}</div>
          <div className="text-muted-foreground">{details.info}</div>
          <a
            href={details.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 ${color.includes('cyan') ? 'text-cyan-400' : 'text-violet-400'} hover:underline`}
          >
            {details.linkLabel}
          </a>
        </div>
      )}
    </div>
  );
}

export function ProtocolStatus({ compact }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
      <ProtocolBadge
        label="A2A"
        icon={Link2}
        color="text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
        hoverColor="bg-cyan-500/20"
        details={{
          version: 'A2A v0.3 — 22 agents discoverable',
          info: 'Agent-to-Agent protocol for cross-system task delegation',
          link: '/.well-known/agent.json',
          linkLabel: '/.well-known/agent.json',
        }}
      />
      <ProtocolBadge
        label="MCP"
        icon={Plug}
        color="text-violet-400 border-violet-500/30 bg-violet-500/10"
        hoverColor="bg-violet-500/20"
        details={{
          version: 'MCP — 7 tools available',
          info: 'Model Context Protocol for tool-based agent interaction',
          link: '/mcp',
          linkLabel: '/mcp',
        }}
      />
    </div>
  );
}
