/**
 * Sandbox control panel — restart button + status indicator.
 * Shows the current LLM provider and model dynamically.
 * Only visible in sandbox mode.
 */
import { useState } from 'react';
import { RotateCcw, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { isSandboxMode } from '../graphql/fetcher';
import { useQueryClient } from '@tanstack/react-query';
import { SANDBOX_URL } from '../lib/sandbox-url';

interface ModelInfo {
  provider: string;
  providerInfo: string;
  currentModel: string;
  locked: boolean;
}

/** Groq lightning bolt SVG — brand recognition */
function GroqLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2L4.09 12.64a1 1 0 0 0 .78 1.63H11l-1 7.73 8.91-10.64a1 1 0 0 0-.78-1.63H13l1-7.73Z" 
            fill="currentColor" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

/** Provider icon based on the active provider */
function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'groq') {
    return <GroqLogo className="w-3 h-3 text-orange-400" />;
  }
  return <Radio className="w-3 h-3 text-green-500 animate-pulse" />;
}

/** Format model name for display */
function formatModel(model: string): string {
  // Strip provider prefixes for cleaner display
  const short = model.replace(/^(meta-llama|google|openai|qwen|nvidia)\//g, '');
  // Capitalize nicely
  return short
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/(\d+[bB])\b/, (_, s) => s.toUpperCase()); // 8b → 8B
}

export function SandboxControls() {
  const [restarting, setRestarting] = useState(false);
  const queryClient = useQueryClient();

  const { data: modelInfo } = useQuery<ModelInfo>({
    queryKey: ['sandbox-models'],
    queryFn: async () => {
      const res = await fetch(`${SANDBOX_URL}/api/models`);
      if (!res.ok) throw new Error('Failed to fetch model info');
      return res.json();
    },
    staleTime: 60_000, // Cache for 1 min — model doesn't change at runtime
    enabled: isSandboxMode,
  });

  if (!isSandboxMode) return null;

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await fetch(`${SANDBOX_URL}/api/restart`, { method: 'POST' });
      setTimeout(() => {
        queryClient.invalidateQueries();
        setRestarting(false);
      }, 1000);
    } catch {
      setRestarting(false);
    }
  };

  const provider = modelInfo?.provider ?? 'sandbox';
  const model = modelInfo?.currentModel ?? '...';
  const providerLabel = provider === 'groq' ? 'Groq' 
    : provider === 'openrouter' ? 'OpenRouter' 
    : provider === 'ollama' ? 'Ollama' 
    : 'Sandbox';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 border border-border">
        <ProviderIcon provider={provider} />
        <span className="font-medium">{providerLabel}</span>
        <span className="text-muted-foreground/60">· {formatModel(model)}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestart}
        disabled={restarting}
        className="gap-1.5"
      >
        <RotateCcw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
        {restarting ? 'Restarting...' : 'Restart (COO only)'}
      </Button>
    </div>
  );
}
