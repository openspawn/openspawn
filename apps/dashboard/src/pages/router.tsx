import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { isSandboxMode } from "../graphql/fetcher";
import { SANDBOX_URL } from "../lib/sandbox-url";

interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  models: { id: string; name: string; costPer1kInput: number; costPer1kOutput: number; contextWindow: number; capabilities: string[]; maxTokens: number }[];
  rateLimit?: { rpm: number; tpm: number };
  enabled: boolean;
  priority: number;
}

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
  fallbackChain: string[];
  estimatedCost: number;
  latencyEstimate: number;
  timestamp: number;
  agentId?: string;
  taskType: string;
}

const PROVIDER_COLORS: Record<string, { text: string; bg: string; border: string; bar: string; dot: string }> = {
  ollama: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bar: "bg-emerald-500", dot: "bg-emerald-400" },
  groq: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bar: "bg-amber-500", dot: "bg-amber-400" },
  openrouter: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", bar: "bg-violet-500", dot: "bg-violet-400" },
  openai: { text: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/20", bar: "bg-slate-500", dot: "bg-slate-400" },
  anthropic: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", bar: "bg-orange-500", dot: "bg-orange-400" },
};

function getColors(id: string) {
  return PROVIDER_COLORS[id] || PROVIDER_COLORS.openai;
}

function formatLatency(ms: number) {
  if (ms < 100) return { text: `${Math.round(ms)}ms`, color: "text-emerald-400" };
  if (ms < 500) return { text: `${Math.round(ms)}ms`, color: "text-amber-400" };
  return { text: `${Math.round(ms)}ms`, color: "text-red-400" };
}

function formatCost(cost: number) {
  if (cost === 0) return { text: "$0", color: "text-emerald-400" };
  if (cost < 0.01) return { text: `$${cost.toFixed(4)}`, color: "text-amber-400" };
  return { text: `$${cost.toFixed(4)}`, color: "text-red-400" };
}

export function RouterPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [metrics, setMetrics] = useState<RouterMetrics | null>(null);
  const [decisions, setDecisions] = useState<RouteDecision[]>([]);

  useEffect(() => {
    if (!isSandboxMode) return;
    const fetchAll = () => {
      fetch(`${SANDBOX_URL}/api/router/config`).then(r => r.json()).then(d => setProviders(d.providers || [])).catch(() => {});
      fetch(`${SANDBOX_URL}/api/router/metrics`).then(r => r.json()).then(setMetrics).catch(() => {});
      fetch(`${SANDBOX_URL}/api/router/decisions?limit=30`).then(r => r.json()).then(setDecisions).catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!isSandboxMode) {
    return <div className="p-8 text-white/50">Model Router is only available in sandbox mode.</div>;
  }

  const total = metrics?.totalRequests || 1;
  const localPct = metrics ? Math.round((metrics.localRoutedCount / total) * 100) : 0;
  const saved = metrics ? (metrics.cloudOnlyCostEstimate - metrics.totalCost) : 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Model Router</h1>
        <p className="text-sm text-white/50 mt-1">Intelligent LLM routing with provider fallback chains and cost tracking</p>
      </div>

      {/* Cost savings banner */}
      {metrics && metrics.totalRequests > 0 && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <span className="text-emerald-400 font-semibold">{localPct}% of requests routed locally ($0)</span>
            <span className="text-white/40 text-sm ml-2">— saved {formatCost(saved).text} vs cloud-only</span>
          </div>
          <div className="text-sm text-white/40">
            {metrics.totalRequests} total requests · {metrics.fallbacksTriggered} fallbacks triggered
          </div>
        </div>
      )}

      {/* Metrics summary */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Requests", value: String(metrics.totalRequests) },
            { label: "Total Cost", value: formatCost(metrics.totalCost).text, color: formatCost(metrics.totalCost).color },
            { label: "Local Routes", value: String(metrics.localRoutedCount), color: "text-emerald-400" },
            { label: "Fallbacks", value: String(metrics.fallbacksTriggered), color: metrics.fallbacksTriggered > 0 ? "text-amber-400" : undefined },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-xs text-white/40">{item.label}</div>
              <div className={cn("text-xl font-bold mt-1", item.color || "text-white")}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Provider cards */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Providers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map(p => {
            const c = getColors(p.id);
            const requests = metrics?.requestsByProvider[p.id] || 0;
            const cost = metrics?.costByProvider[p.id] || 0;
            const avgLatency = metrics?.avgLatencyByProvider[p.id] || 0;
            const failures = metrics?.failuresByProvider[p.id] || 0;
            const lat = formatLatency(avgLatency);

            return (
              <div key={p.id} className={cn("rounded-xl border p-4 space-y-3", c.border, c.bg)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full", p.enabled ? c.dot : "bg-gray-600")} />
                    <span className={cn("font-semibold", c.text)}>{p.name}</span>
                  </div>
                  <span className="text-xs text-white/30">P{p.priority}</span>
                </div>

                <div className="text-xs text-white/40 font-mono truncate">{p.baseUrl}</div>

                {/* Models */}
                <div className="space-y-1">
                  {p.models.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-white/60 truncate mr-2">{m.name}</span>
                      <span className={m.costPer1kInput === 0 ? "text-emerald-400" : "text-white/40"}>
                        {m.costPer1kInput === 0 ? "Free" : `$${m.costPer1kInput}/1k`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rate limits */}
                {p.rateLimit && (
                  <div className="text-xs text-white/30">
                    Rate limit: {p.rateLimit.rpm} RPM · {p.rateLimit.tpm} TPM
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                  <span className="text-white/40">{requests} reqs</span>
                  <span className={formatCost(cost).color}>{formatCost(cost).text}</span>
                  {avgLatency > 0 && <span className={lat.color}>{lat.text}</span>}
                  {failures > 0 && <span className="text-red-400">{failures} fails</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live routing log */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Live Routing Log</h2>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {decisions.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">
              No routing decisions yet. Start the simulation to see live routes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-white/40">
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Agent</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Provider</th>
                    <th className="text-left p-3 font-medium">Model</th>
                    <th className="text-left p-3 font-medium">Reason</th>
                    <th className="text-right p-3 font-medium">Cost</th>
                    <th className="text-right p-3 font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.slice().reverse().map((d, i) => {
                    const c = getColors(d.provider);
                    const cost = formatCost(d.estimatedCost);
                    const lat = formatLatency(d.latencyEstimate);
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3 text-white/30 font-mono">{new Date(d.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 text-white/60">{d.agentId || "—"}</td>
                        <td className="p-3 text-white/40">{d.taskType}</td>
                        <td className={cn("p-3 font-medium", c.text)}>{d.provider}</td>
                        <td className="p-3 text-white/50 font-mono">{d.model.split('/').pop()}</td>
                        <td className="p-3 text-white/40 max-w-[200px] truncate">{d.reason}</td>
                        <td className={cn("p-3 text-right", cost.color)}>{cost.text}</td>
                        <td className={cn("p-3 text-right", lat.color)}>{lat.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
