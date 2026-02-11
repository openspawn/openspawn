/**
 * Sandbox control panel — restart button + status indicator.
 * Only visible in sandbox mode.
 */
import { useState } from 'react';
import { RotateCcw, Radio } from 'lucide-react';
import { Button } from './ui/button';
import { isSandboxMode } from '../graphql/fetcher';
import { useQueryClient } from '@tanstack/react-query';

import { SANDBOX_URL } from '../lib/sandbox-url';

export function SandboxControls() {
  const [restarting, setRestarting] = useState(false);
  const queryClient = useQueryClient();

  if (!isSandboxMode) return null;

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await fetch(`${SANDBOX_URL}/api/restart`, { method: 'POST' });
      // Wait a moment for the sim to reset, then refetch everything
      setTimeout(() => {
        queryClient.invalidateQueries();
        setRestarting(false);
      }, 1000);
    } catch {
      setRestarting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 border border-border">
        <Radio className="w-3 h-3 text-green-500 animate-pulse" />
        <span className="font-medium">Sandbox Live</span>
        <span className="text-muted-foreground/60">· qwen3:0.6b</span>
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
