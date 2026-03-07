import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface ReputationEvent {
  id: string;
  type: string;
  impact: number;
  previousScore: number;
  newScore: number;
  reason: string | null;
  createdAt: string;
}

interface ReputationHistoryProps {
  events: ReputationEvent[];
  title?: string;
}

const EVENT_ICONS: Record<string, string> = {
  TASK_COMPLETED: "✅",
  TASK_FAILED: "❌",
  TASK_REWORK: "🔄",
  ON_TIME_DELIVERY: "⏰",
  LATE_DELIVERY: "⏳",
  QUALITY_BONUS: "⭐",
  QUALITY_PENALTY: "👎",
  LEVEL_UP: "📈",
  LEVEL_DOWN: "📉",
  INACTIVITY_DECAY: "😴",
  MANUAL_ADJUSTMENT: "✏️",
};

const EVENT_LABELS: Record<string, string> = {
  TASK_COMPLETED: "Task Completed",
  TASK_FAILED: "Task Failed",
  TASK_REWORK: "Sent for Rework",
  ON_TIME_DELIVERY: "On-Time Delivery",
  LATE_DELIVERY: "Late Delivery",
  QUALITY_BONUS: "Quality Bonus",
  QUALITY_PENALTY: "Quality Penalty",
  LEVEL_UP: "Promoted",
  LEVEL_DOWN: "Demoted",
  INACTIVITY_DECAY: "Inactivity Decay",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ReputationHistory({
  events,
  title = "Reputation History",
}: ReputationHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📜</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                <div className="text-xl mt-0.5">{EVENT_ICONS[event.type] || "❓"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">
                      {EVENT_LABELS[event.type] || event.type}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        event.impact >= 0 ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {event.impact >= 0 ? "+" : ""}
                      {event.impact}
                    </div>
                  </div>
                  {event.reason && (
                    <div className="text-xs text-muted-foreground truncate">{event.reason}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {event.previousScore} → {event.newScore} · {formatTimeAgo(event.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No reputation events yet</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
