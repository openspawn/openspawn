import type { Stats } from './replay-data';

interface StatsBarProps {
  stats: Stats;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  const queueColor = stats.queueSize > 2000 ? '#ef4444' : stats.queueSize > 1000 ? '#eab308' : '#22d3ee';

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white/[0.03] border-t border-white/10 text-xs shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <span>🔥</span>
        <span className="text-white/40">Kitchen:</span>
        <span className="text-cyan-400 font-bold">{stats.kitchenRate}/tick</span>
        <MiniBar value={stats.kitchenRate} max={50} color="#22d3ee" />
      </div>
      <div className="flex items-center gap-2">
        <span>📦</span>
        <span className="text-white/40">Queue:</span>
        <span className="font-bold" style={{ color: queueColor }}>{stats.queueSize.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>🪑</span>
        <span className="text-white/40">Delivery:</span>
        <span className="text-emerald-400 font-bold">{stats.deliveryRate}/tick</span>
        <MiniBar value={stats.deliveryRate} max={25} color="#34d399" />
      </div>
      <div className="flex items-center gap-2">
        <span>💰</span>
        <span className="text-white/40">Revenue:</span>
        <span className="text-amber-400 font-bold">{stats.revenue.toLocaleString()} cr</span>
      </div>
      <div className="flex items-center gap-2">
        <span>📊</span>
        <span className="text-white/40">Margin:</span>
        <span className="text-white font-bold">{stats.margin.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span>💵</span>
        <span className="text-white/40">Budget:</span>
        <span className="text-white font-bold">{stats.budgetUsed}%</span>
      </div>
    </div>
  );
}
