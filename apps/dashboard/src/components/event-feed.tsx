import type { Event } from "../hooks";

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
};

export function EventFeed({ events }: { events: Event[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {idx !== events.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                      severityColors[event.severity] || "bg-gray-100"
                    }`}
                  >
                    {event.severity === "error" ? "⚠️" : event.severity === "warning" ? "⚡" : "📝"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{event.type}</span>
                      {" on "}
                      <span className="font-mono text-xs">
                        {event.entityType}/{event.entityId.slice(0, 8)}
                      </span>
                    </p>
                    {event.reasoning && (
                      <p className="mt-1 text-sm text-gray-500">{event.reasoning}</p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
