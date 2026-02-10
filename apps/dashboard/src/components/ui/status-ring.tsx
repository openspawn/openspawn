/**
 * StatusRing — SVG-based circular ring indicators for agent health.
 *
 * - Outer ring: task completion rate
 * - Inner ring: credit usage
 * - Center: children (avatar)
 * - Colors shift: emerald → amber → rose based on usage thresholds
 * - Animated with framer-motion
 */

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

type RingStatus = 'active' | 'idle' | 'busy' | 'error';

interface StatusRingProps {
  /** Task completion rate 0-1 */
  completionRate: number;
  /** Credit usage 0-1 */
  creditUsage: number;
  /** Agent status */
  status: RingStatus;
  /** Ring size */
  size?: 'sm' | 'md' | 'lg';
  /** Avatar content */
  children: React.ReactNode;
  className?: string;
}

const SIZE_CONFIG = {
  sm: { px: 32, outer: 14, inner: 11, stroke: 2 },
  md: { px: 48, outer: 21, inner: 17, stroke: 2.5 },
  lg: { px: 64, outer: 28, inner: 23, stroke: 3 },
} as const;

/** Returns a semantic color based on a 0-1 value */
function rateColor(value: number): string {
  if (value >= 0.85) return '#f43f5e'; // rose-500
  if (value >= 0.6) return '#f59e0b';  // amber-500
  return '#10b981';                     // emerald-500
}

export function StatusRing({
  completionRate,
  creditUsage,
  status,
  size = 'md',
  children,
  className,
}: StatusRingProps) {
  const cfg = SIZE_CONFIG[size];
  const viewBox = cfg.px;
  const center = viewBox / 2;

  const outerR = cfg.outer;
  const innerR = cfg.inner;

  const outerCircumference = 2 * Math.PI * outerR;
  const innerCircumference = 2 * Math.PI * innerR;

  const outerOffset = outerCircumference * (1 - Math.min(1, Math.max(0, completionRate)));
  const innerOffset = innerCircumference * (1 - Math.min(1, Math.max(0, creditUsage)));

  const outerColor = rateColor(completionRate);
  const innerColor = rateColor(creditUsage);

  const shouldPulse = status === 'active';

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: cfg.px, height: cfg.px }}
    >
      {/* SVG rings */}
      <svg
        className="absolute inset-0"
        width={cfg.px}
        height={cfg.px}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
      >
        {/* Outer track */}
        <circle
          cx={center}
          cy={center}
          r={outerR}
          fill="none"
          stroke="currentColor"
          className="text-white/10"
          strokeWidth={cfg.stroke}
        />
        {/* Outer progress (completion) */}
        <motion.circle
          cx={center}
          cy={center}
          r={outerR}
          fill="none"
          stroke={outerColor}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          initial={{ strokeDashoffset: outerCircumference }}
          animate={{ strokeDashoffset: outerOffset }}
          transition={{ type: 'tween', duration: 0.8, ease: 'easeOut' }}
          transform={`rotate(-90 ${center} ${center})`}
        />

        {/* Inner track */}
        <circle
          cx={center}
          cy={center}
          r={innerR}
          fill="none"
          stroke="currentColor"
          className="text-white/10"
          strokeWidth={cfg.stroke}
        />
        {/* Inner progress (credit usage) */}
        <motion.circle
          cx={center}
          cy={center}
          r={innerR}
          fill="none"
          stroke={innerColor}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeDasharray={innerCircumference}
          initial={{ strokeDashoffset: innerCircumference }}
          animate={{ strokeDashoffset: innerOffset }}
          transition={{ type: 'tween', duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>

      {/* Pulse effect for active agents */}
      {shouldPulse && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 8px ${outerColor}` }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
      )}

      {/* Center avatar */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
