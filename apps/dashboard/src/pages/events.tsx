import { EventFeed } from "../components";
import { useEvents } from "../hooks";

const ORG_ID = import.meta.env.VITE_ORG_ID || "default-org-id";

export function EventsPage() {
  const { events, loading, error } = useEvents(ORG_ID);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-700">Error loading events: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <p className="text-gray-500">Real-time event stream</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <EventFeed events={events} />
      </div>
    </div>
  );
}
