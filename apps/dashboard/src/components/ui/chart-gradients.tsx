/**
 * Reusable SVG gradient definitions for ocean-themed charts.
 * Drop <OceanGradients /> inside any Recharts <defs> or use as a standalone <defs> block.
 */

export const OCEAN_COLORS = {
  cyan:    { stroke: '#06b6d4', fill: 'url(#ocean-cyan)' },
  emerald: { stroke: '#10b981', fill: 'url(#ocean-emerald)' },
  amber:   { stroke: '#f59e0b', fill: 'url(#ocean-amber)' },
  purple:  { stroke: '#a855f7', fill: 'url(#ocean-purple)' },
  rose:    { stroke: '#f43f5e', fill: 'url(#ocean-rose)' },
  indigo:  { stroke: '#6366f1', fill: 'url(#ocean-indigo)' },
} as const;

export type OceanColorKey = keyof typeof OCEAN_COLORS;

/** Place inside a Recharts <AreaChart> or <LineChart> <defs> block */
export function OceanGradients() {
  return (
    <>
      {Object.entries({
        'ocean-cyan':    '#06b6d4',
        'ocean-emerald': '#10b981',
        'ocean-amber':   '#f59e0b',
        'ocean-purple':  '#a855f7',
        'ocean-rose':    '#f43f5e',
        'ocean-indigo':  '#6366f1',
      }).map(([id, color]) => (
        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      ))}
    </>
  );
}
