import type { TooltipProps } from 'recharts';

interface ChartTooltipProps extends TooltipProps<number, string> {
  valueFormatter?: (value: number) => string;
  labelFormatter?: (label: string) => string;
  icon?: React.ReactNode;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v) => v.toLocaleString(),
  labelFormatter = (l) => l,
  icon,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-slate-900/95 px-4 py-3 shadow-xl shadow-cyan-500/5 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-700/50 pb-2">
        {icon}
        <span className="text-xs font-medium text-slate-300">
          {labelFormatter(String(label))}
        </span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-400 capitalize">
                {entry.name ?? entry.dataKey}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-100">
              {valueFormatter(entry.value as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Re-usable contentStyle for inline Recharts <Tooltip> when you don't need a full custom component */
export const oceanTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(6, 182, 212, 0.2)',
  borderRadius: '0.75rem',
  boxShadow: '0 8px 32px rgba(6, 182, 212, 0.08)',
  backdropFilter: 'blur(8px)',
};
