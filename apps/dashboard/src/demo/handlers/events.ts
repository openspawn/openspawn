import { graphql, HttpResponse } from 'msw';
import type { DemoEvent } from '@openspawn/demo-data';

let events: DemoEvent[] = [];

export function setEvents(newEvents: DemoEvent[]) {
  events = [...newEvents];
}

export function getEvents() {
  return events;
}

export function addEvent(event: DemoEvent) {
  events.push(event);
}

// GraphQL type mapping
function mapEvent(event: DemoEvent) {
  return {
    id: event.id,
    type: event.type,
    severity: event.severity,
    message: event.message,
    metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    createdAt: event.createdAt,
    agentId: event.agentId || null,
    taskId: event.taskId || null,
  };
}

export const eventHandlers = [
  // GetEvents query
  graphql.query('GetEvents', () => {
    // Sort by date descending
    const sorted = [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return HttpResponse.json({
      data: {
        events: sorted.map(mapEvent),
      },
    });
  }),
];
