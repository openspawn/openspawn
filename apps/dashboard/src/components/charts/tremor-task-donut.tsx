import { DonutChart, Legend } from "@tremor/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TaskDonutChartProps {
  tasksByStatus: { status: string; count: number; fill: string }[];
}

const statusColorMap: Record<string, string> = {
  Backlog: "slate",
  "To Do": "amber",
  "In Progress": "cyan",
  Review: "violet",
  Done: "emerald",
  Blocked: "rose",
};

export function TremorTaskDonut({ tasksByStatus }: TaskDonutChartProps) {
  const data = tasksByStatus
    .filter((d) => d.count > 0)
    .map((d) => ({ name: d.status, value: d.count }));

  const colors = tasksByStatus
    .filter((d) => d.count > 0)
    .map((d) => statusColorMap[d.status] || "gray");

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base sm:text-lg">Task Distribution</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base sm:text-lg">Task Distribution</CardTitle></CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <DonutChart
            data={data}
            category="value"
            index="name"
            colors={colors}
            variant="donut"
            valueFormatter={(v: number) => `${v} tasks`}
            className="h-52 [&_.tremor-DonutChart-label]:fill-foreground"
            showLabel
            label={`${total} total`}
            showAnimation
            animationDuration={800}
          />
          <Legend
            categories={data.map((d) => d.name)}
            colors={colors}
            className="justify-center [&_span]:text-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
}
