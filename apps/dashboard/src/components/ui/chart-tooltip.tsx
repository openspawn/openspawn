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
    <div className="rounded-xl border border-border bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2 border-b border-border/50 pb-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">
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
              <span className="text-xs text-muted-foreground capitalize">
                {entry.name ?? entry.dataKey}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground">
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
  backgroundColor: 'hsl(var(--popover) / 0.95)',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(8px)',
};
