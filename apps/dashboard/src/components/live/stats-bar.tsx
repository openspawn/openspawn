import type { Stats } from './replay-data';

interface StatsBarProps {
  stats: Stats;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(74,174,217,0.1)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  const queueColor =
    stats.queueSize > 2000 ? '#FF4757' :
    stats.queueSize > 1000 ? '#F4C542' :
    '#4AE88A';

  const budgetColor =
    stats.budgetUsed > 85 ? '#FF4757' :
    stats.budgetUsed > 65 ? '#F4C542' :
    '#4AE88A';

  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-3 text-xs shrink-0 flex-wrap"
      style={{
        background: 'rgba(6,42,69,0.9)',
        borderTop: '1px solid rgba(74,174,217,0.2)',
        backdropFilter: 'blur(12px)',
        fontFamily: 'Nunito, sans-serif',
      }}
    >
      <div className="flex items-center gap-2">
        <span>🔥</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Kitchen:</span>
        <span className="font-bold" style={{ color: '#F4C542', fontFamily: '"Baloo 2", cursive', fontSize: '0.875rem' }}>
          {stats.kitchenRate}/tick
        </span>
        <MiniBar value={stats.kitchenRate} max={50} color="#F4C542" />
      </div>
      <div className="flex items-center gap-2">
        <span>📦</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Queue:</span>
        <span className="font-bold" style={{ color: queueColor, fontFamily: '"Baloo 2", cursive', fontSize: '0.875rem' }}>
          {stats.queueSize > 100 ? `${stats.queueSize.toLocaleString()} 😅` : stats.queueSize.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>🚚</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Delivery:</span>
        <span className="font-bold" style={{ color: '#4AE88A', fontFamily: '"Baloo 2", cursive', fontSize: '0.875rem' }}>
          {stats.deliveryRate}/tick
        </span>
        <MiniBar value={stats.deliveryRate} max={25} color="#4AE88A" />
      </div>
      <div className="flex items-center gap-2">
        <span>💰</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Revenue:</span>
        <span className="font-bold" style={{ color: '#F4C542', fontFamily: '"Baloo 2", cursive', fontSize: '0.875rem' }}>
          {stats.revenue.toLocaleString()} cr
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>📊</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Margin:</span>
        <span className="font-bold" style={{ color: '#B8E4F7', fontFamily: '"Baloo 2", cursive', fontSize: '0.875rem' }}>
          {stats.margin.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>🦀</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>
          {stats.budgetUsed > 85 ? "Mr. Krabs is sweating:" : "Budget:"}
        </span>
        <span className="font-bold" style={{ color: budgetColor, fontFamily: '"Baloo 2", cursive', fontSize: '0.875rem' }}>
          {stats.budgetUsed}%
        </span>
      </div>
    </div>
  );
}
