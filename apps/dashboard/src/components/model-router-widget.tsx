import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { isSandboxMode } from "../graphql/fetcher";
import { SANDBOX_URL } from "../lib/sandbox-url";

interface RouterMetrics {
  totalRequests: number;
  totalCost: number;
  requestsByProvider: Record<string, number>;
  costByProvider: Record<string, number>;
  avgLatencyByProvider: Record<string, number>;
  failuresByProvider: Record<string, number>;
  fallbacksTriggered: number;
  localRoutedCount: number;
  cloudOnlyCostEstimate: number;
}

interface RouteDecision {
  provider: string;
  model: string;
  reason: string;
  estimatedCost: number;
  latencyEstimate: number;
  timestamp: number;
  agentId?: string;
  taskType: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "text-emerald-400",
  groq: "text-amber-400",
  openrouter: "text-violet-400",
  openai: "text-slate-400",
  anthropic: "text-orange-400",
};

const PROVIDER_BG: Record<string, string> = {
  ollama: "bg-emerald-500/20",
  groq: "bg-amber-500/20",
  openrouter: "bg-violet-500/20",
};

const PROVIDER_BAR: Record<string, string> = {
  ollama: "bg-emerald-500",
  groq: "bg-amber-500",
  openrouter: "bg-violet-500",
};

const PROVIDER_DOT: Record<string, string> = {
  ollama: "bg-emerald-400",
  groq: "bg-amber-400",
  openrouter: "bg-violet-400",
};

export function ModelRouterWidget() {
  const [metrics, setMetrics] = useState<RouterMetrics | null>(null);
  const [decisions, setDecisions] = useState<RouteDecision[]>([]);

  useEffect(() => {
    if (!isSandboxMode) return;
    const fetchData = () => {
      fetch(`${SANDBOX_URL}/api/router/metrics`).then(r => r.json()).then(setMetrics).catch(() => { /* ignore */ });
      fetch(`${SANDBOX_URL}/api/router/decisions?limit=5`).then(r => r.json()).then(setDecisions).catch(() => { /* ignore */ });
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!isSandboxMode || !metrics) return null;

  const totalByProvider = metrics.requestsByProvider;
  const total = metrics.totalRequests || 1;
  const localPct = Math.round((metrics.localRoutedCount / total) * 100);
  const saved = metrics.cloudOnlyCostEstimate - metrics.totalCost;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">🔀 Model Router</h3>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400/70 border border-amber-500/15">sim</span>
          <span className="text-xs text-white/40">{metrics.totalRequests} requests</span>
        </div>
      </div>

      {/* Provider status */}
      <div className="flex gap-3">
        {["ollama", "groq", "openrouter"].map(id => (
          <div key={id} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", PROVIDER_DOT[id] || "bg-gray-400")} />
            <span className={cn("text-xs capitalize", PROVIDER_COLORS[id])}>{id}</span>
          </div>
        ))}
      </div>

      {/* Distribution bars */}
      <div className="space-y-1">
        {Object.entries(totalByProvider).sort((a, b) => b[1] - a[1]).map(([id, count]) => (
          <div key={id} className="flex items-center gap-2">
            <span className={cn("text-xs w-20 truncate", PROVIDER_COLORS[id])}>{id}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", PROVIDER_BAR[id] || "bg-gray-500")}
                style={{ width: `${Math.max(2, (count / total) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-white/40 w-8 text-right">{Math.round((count / total) * 100)}%</span>
          </div>
        ))}
      </div>

      {/* Cost tracker */}
      <div className="flex justify-between text-xs">
        <span className="text-white/40">Cost: <span className={metrics.totalCost === 0 ? "text-emerald-400" : "text-amber-400"}>${metrics.totalCost.toFixed(4)}</span></span>
        {saved > 0 && <span className="text-emerald-400">Saved ${saved.toFixed(4)}</span>}
      </div>
      {localPct > 0 && (
        <div className="text-xs text-emerald-400/70">{localPct}% routed locally ($0)</div>
      )}

      {/* Recent decisions */}
      {decisions.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/5">
          <div className="text-xs text-white/30">Recent routes</div>
          {decisions.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className={cn("font-mono", PROVIDER_COLORS[d.provider])}>{d.provider}</span>
              <span className="text-white/30">→</span>
              <span className="text-white/50 truncate flex-1">{d.model.split('/').pop()}</span>
              <span className={d.estimatedCost === 0 ? "text-emerald-400" : "text-amber-400"}>
                {d.estimatedCost === 0 ? "$0" : `$${d.estimatedCost.toFixed(4)}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
