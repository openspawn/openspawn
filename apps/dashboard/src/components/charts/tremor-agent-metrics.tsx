import { AreaChart, BarChart } from "@tremor/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TasksOverTimeProps {
  data: { date: string; completed: number }[];
}

export function TremorTasksOverTime({ data }: TasksOverTimeProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base sm:text-lg">Tasks Completed Over Time</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">No data yet</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base sm:text-lg">Tasks Completed Over Time</CardTitle></CardHeader>
      <CardContent>
        <AreaChart
          data={data}
          index="date"
          categories={["completed"]}
          colors={["cyan"]}
          valueFormatter={(v: number) => `${v}`}
          className="h-[220px] sm:h-[280px] [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-legend-item_span]:!text-foreground"
          showAnimation
          animationDuration={800}
          curveType="monotone"
          showGradient
        />
      </CardContent>
    </Card>
  );
}

interface CreditsByAgentProps {
  data: { agent: string; earned: number; spent: number }[];
}

export function TremorCreditsByAgent({ data }: CreditsByAgentProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base sm:text-lg">Credits by Agent</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">No data yet</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base sm:text-lg">Credits by Agent</CardTitle></CardHeader>
      <CardContent>
        <BarChart
          data={data}
          index="agent"
          categories={["earned", "spent"]}
          colors={["emerald", "amber"]}
          valueFormatter={(v: number) => v.toLocaleString()}
          className="h-[220px] sm:h-[280px] [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-legend-item_span]:!text-foreground"
          showAnimation
          animationDuration={800}
          showLegend
          stack={false}
        />
      </CardContent>
    </Card>
  );
}
