/**
 * StatsBar — bottom stats bar for the live dashboard.
 * POLISH PASS: Animated number transitions using CSS key-based remounting,
 * color-coded states, crisis jitter, mini progress bars.
 * CSS animations only — no motion/react.
 */

import React, { useRef, useState, useEffect } from 'react';
import type { Stats } from './replay-data';

interface StatsBarProps {
  stats: Stats;
}

// CSS animations injected once
const STATS_STYLES = `
  @keyframes stat-tick-flash {
    0%   { color: #fff; text-shadow: 0 0 20px rgba(244,197,66,1), 0 0 40px rgba(244,197,66,0.5); }
    40%  { color: #F4C542; text-shadow: 0 0 10px rgba(244,197,66,0.5); }
    100% { color: #F4C542; text-shadow: none; }
  }
  @keyframes stat-tick-crisis {
    0%   { color: #fff; text-shadow: 0 0 20px rgba(255,71,87,0.9), 0 0 40px rgba(255,71,87,0.4); }
    40%  { color: #FF4757; text-shadow: 0 0 8px rgba(255,71,87,0.5); }
    100% { color: #FF4757; text-shadow: none; }
  }
  @keyframes stat-tick-warning {
    0%   { color: #fff; text-shadow: 0 0 20px rgba(244,197,66,0.8); }
    100% { color: #F4C542; text-shadow: none; }
  }
  @keyframes stat-tick-kelp {
    0%   { color: #fff; text-shadow: 0 0 20px rgba(74,232,138,0.8); }
    100% { color: #4AE88A; text-shadow: none; }
  }
  .stat-flash        { animation: stat-tick-flash  0.55s ease forwards; }
  .stat-flash-crisis { animation: stat-tick-crisis 0.55s ease forwards; }
  .stat-flash-warn   { animation: stat-tick-warning 0.55s ease forwards; }
  .stat-flash-kelp   { animation: stat-tick-kelp 0.55s ease forwards; }

  @media (prefers-reduced-motion: reduce) {
    .stat-flash, .stat-flash-crisis, .stat-flash-warn, .stat-flash-kelp {
      animation: none !important;
    }
  }
`;

/**
 * StatValue — flashes a CSS animation when the displayed value changes.
 * Uses useRef + setState to detect changes without needing a remount key.
 */
function StatValue({
  value,
  color,
  flashClass,
  suffix = '',
}: {
  value: string | number;
  color: string;
  flashClass: string;
  suffix?: string;
}) {
  const prevRef = useRef(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 650);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={`font-bold ${animating ? flashClass : ''}`}
      style={{
        color,
        fontFamily: '"Baloo 2", cursive',
        fontSize: '0.875rem',
      }}
    >
      {value}{suffix}
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(74,174,217,0.1)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: pct > 80 ? `0 0 6px ${color}80` : undefined,
        }}
      />
    </div>
  );
}

export function StatsBar({ stats }: StatsBarProps) {
  const queueColor =
    stats.queueSize > 2000 ? '#FF4757' :
    stats.queueSize > 1000 ? '#F4C542' :
    '#4AE88A';

  const queueFlash =
    stats.queueSize > 2000 ? 'stat-flash-crisis' :
    stats.queueSize > 1000 ? 'stat-flash-warn' :
    'stat-flash-kelp';

  const budgetColor =
    stats.budgetUsed > 85 ? '#FF4757' :
    stats.budgetUsed > 65 ? '#F4C542' :
    '#4AE88A';

  const budgetFlash =
    stats.budgetUsed > 85 ? 'stat-flash-crisis' :
    stats.budgetUsed > 65 ? 'stat-flash-warn' :
    'stat-flash-kelp';

  // Crisis pulse on queue (was jitter — replaced per UX feedback)
  const queueJitter = stats.queueSize > 2000
    ? { animation: 'bb-pulse-ring 1.5s ease-in-out infinite', '--bb-ring-color': 'rgba(255, 71, 87, 0.4)' } as React.CSSProperties
    : {} as React.CSSProperties;

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
      <style>{STATS_STYLES}</style>

      {/* Kitchen rate */}
      <div className="flex items-center gap-2">
        <span>🔥</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Kitchen:</span>
        <StatValue value={`${stats.kitchenRate}/tick`} color="#F4C542" flashClass="stat-flash" />
        <MiniBar value={stats.kitchenRate} max={50} color="#F4C542" />
      </div>

      {/* Queue — crisis jitter */}
      <div className="flex items-center gap-2" style={queueJitter}>
        <span>📦</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Queue:</span>
        <StatValue
          value={stats.queueSize > 100
            ? `${stats.queueSize.toLocaleString()} 😅`
            : stats.queueSize.toLocaleString()}
          color={queueColor}
          flashClass={queueFlash}
        />
      </div>

      {/* Delivery rate */}
      <div className="flex items-center gap-2">
        <span>🚚</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Delivery:</span>
        <StatValue value={`${stats.deliveryRate}/tick`} color="#4AE88A" flashClass="stat-flash-kelp" />
        <MiniBar value={stats.deliveryRate} max={25} color="#4AE88A" />
      </div>

      {/* Revenue */}
      <div className="flex items-center gap-2">
        <span>💰</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Revenue:</span>
        <StatValue value={`${stats.revenue.toLocaleString()} cr`} color="#F4C542" flashClass="stat-flash" />
      </div>

      {/* Margin */}
      <div className="flex items-center gap-2">
        <span>📊</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>Margin:</span>
        <StatValue value={`${stats.margin.toFixed(1)}%`} color="#B8E4F7" flashClass="stat-flash" />
      </div>

      {/* Budget */}
      <div className="flex items-center gap-2">
        <span>🦀</span>
        <span style={{ color: 'rgba(184,228,247,0.4)' }}>
          {stats.budgetUsed > 85 ? 'Mr. Krabs is sweating:' : 'Budget:'}
        </span>
        <StatValue value={`${stats.budgetUsed}%`} color={budgetColor} flashClass={budgetFlash} />
        <MiniBar value={stats.budgetUsed} max={100} color={budgetColor} />
      </div>
    </div>
  );
}
