import { motion } from "motion/react";

export interface MetricCardData {
  label: string;
  value: string | number;
  unit: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  icon?: React.ReactNode;
}

interface MetricsCardsProps {
  metrics: MetricCardData[];
}

const trendColors = {
  up: "text-emerald-400",
  down: "text-red-400",
  stable: "text-muted-foreground",
};

const trendIcons = {
  up: "↑",
  down: "↓",
  stable: "→",
};

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: i * 0.08,
            duration: 0.4,
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          className="relative overflow-hidden rounded-xl bg-card border border-border p-5 shadow-xl backdrop-blur-sm"
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {metric.label}
              </span>
              {metric.icon && (
                <span className="text-muted-foreground/70">{metric.icon}</span>
              )}
            </div>

            <div className="flex items-baseline gap-1.5">
              <motion.span
                className="text-2xl font-bold text-foreground tabular-nums"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.2 }}
              >
                {metric.value}
              </motion.span>
              <span className="text-sm text-muted-foreground">{metric.unit}</span>
            </div>

            {metric.trend && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.3 }}
                className={`mt-2 flex items-center gap-1 text-xs ${trendColors[metric.trend]}`}
              >
                <span>{trendIcons[metric.trend]}</span>
                <span>{metric.trendValue}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
