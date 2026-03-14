import { motion } from "motion/react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Sparkline } from "./sparkline";
import { cn } from "../../lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  sparklineData,
  sparklineColor = "#06b6d4",
  valueClassName,
  onClick,
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card
      data-testid="stat-card"
      className={onClick ? "cursor-pointer transition-colors hover:bg-accent/50" : undefined}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="flex items-center justify-between gap-2">
          <motion.div
            key={String(value)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={cn("text-2xl sm:text-3xl font-extrabold tracking-tighter", valueClassName)}
          >
            {value}
          </motion.div>
          {sparklineData && (
            <Sparkline
              data={sparklineData}
              width={64}
              height={24}
              color={sparklineColor}
              showDot
              showArea
            />
          )}
        </div>
        {change !== undefined && (
          <p className="flex items-center text-xs text-muted-foreground">
            {isPositive && (
              <>
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
                <span className="text-emerald-500">+{change}%</span>
              </>
            )}
            {isNegative && (
              <>
                <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                <span className="text-red-500">{change}%</span>
              </>
            )}
            {!isPositive && !isNegative && <span>{change}%</span>}
            <span className="ml-1">from last week</span>
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
