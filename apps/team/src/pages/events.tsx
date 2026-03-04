import { Activity } from "lucide-react";
import { PageHeader, EmptyState } from "@openspawn/dashboard-ui";
import { useEvents } from "../hooks";

export function EventsPage() {
  const { events, loading } = useEvents();

  return (
    <div className="space-y-6">
      <PageHeader title="Events" description="Real-time activity feed" />

      {loading ? (
        <div className="text-white/40 text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <EmptyState title="No events yet" description="Events appear as agents work." />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              <Activity className="h-4 w-4 text-white/30 mt-0.5 shrink-0" />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-sm text-white truncate">{event.type}</div>
                <div className="text-xs text-white/40 flex flex-wrap gap-x-2 gap-y-0.5">
                  {event.actor && (
                    <span className="truncate max-w-[200px]">Agent: {event.actor.name}</span>
                  )}
                  <span className="shrink-0">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
