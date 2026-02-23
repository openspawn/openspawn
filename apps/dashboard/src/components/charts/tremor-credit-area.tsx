import { AreaChart } from "@tremor/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface CreditAreaChartProps {
  creditHistory: { period: string; earned: number; spent: number }[];
}

export function TremorCreditArea({ creditHistory }: CreditAreaChartProps) {
  const hasData = creditHistory.some((d) => d.earned > 0 || d.spent > 0);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base sm:text-lg">Credit Flow</CardTitle></CardHeader>
      <CardContent>
        {hasData ? (
          <AreaChart
            data={creditHistory}
            index="period"
            categories={["earned", "spent"]}
            colors={["emerald", "amber"]}
            valueFormatter={(v: number) => v.toLocaleString()}
            className="h-[220px] sm:h-[300px] [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-legend-item_span]:!text-foreground"
            showAnimation
            animationDuration={800}
            curveType="monotone"
            showGradient
            showLegend
          />
        ) : (
          <div className="flex items-center justify-center h-[220px] sm:h-[300px] text-sm text-muted-foreground">
            No credit activity yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
