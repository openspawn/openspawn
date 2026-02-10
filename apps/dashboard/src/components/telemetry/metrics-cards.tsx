import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, AlertCircle, BarChart3 } from "lucide-react";

interface TelemetryMetrics {
  totalTraces: number;
  totalSpans: number;
  averageDuration: number;
  errorRate: number;
}

export function MetricsCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["telemetryMetrics"],
    queryFn: async () => {
      const response = await fetch("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetTelemetryMetrics {
              telemetryMetrics {
                totalTraces
                totalSpans
                averageDuration
                errorRate
              }
            }
          `,
        }),
      });
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 5000,
  });

  const metrics: TelemetryMetrics | undefined = data?.telemetryMetrics;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-lg border bg-card p-4 text-center text-red-500">
        Error loading metrics
      </div>
    );
  }

  const cards = [
    {
      title: "Total Traces",
      value: metrics.totalTraces.toLocaleString(),
      icon: BarChart3,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Spans",
      value: metrics.totalSpans.toLocaleString(),
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Avg Duration",
      value: formatDuration(metrics.averageDuration),
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Error Rate",
      value: formatPercentage(metrics.errorRate),
      icon: AlertCircle,
      color:
        metrics.errorRate > 0.05 ? "text-red-500" : "text-yellow-500",
      bgColor:
        metrics.errorRate > 0.05 ? "bg-red-500/10" : "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <motion.p
                  className="mt-2 text-3xl font-bold"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {card.value}
                </motion.p>
              </div>
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
