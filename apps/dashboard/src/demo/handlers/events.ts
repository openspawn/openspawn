import { graphql, HttpResponse } from 'msw';
import type { DemoEvent } from '@openspawn/demo-data';
import { getAgents } from './agents';

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

// GraphQL type mapping - matches Events query
function mapEvent(event: DemoEvent) {
  const agents = getAgents();
  const actor = event.agentId ? agents.find(a => a.id === event.agentId) : null;

  return {
    id: event.id,
    type: event.type,
    actorId: event.agentId || null,
    actor: actor ? {
      id: actor.id,
      name: actor.name,
    } : null,
    entityType: event.taskId ? 'task' : (event.agentId ? 'agent' : 'system'),
    entityId: event.taskId || event.agentId || null,
    severity: event.severity,
    reasoning: event.message,
    createdAt: event.createdAt,
  };
}

export const eventHandlers = [
  // Events query
  graphql.query('Events', ({ variables }) => {
    const { limit = 50, page = 1 } = variables;
    const offset = (page - 1) * limit;
    
    // Sort by createdAt descending
    const sorted = [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const paginated = sorted.slice(offset, offset + limit);
    
    return HttpResponse.json({
      data: {
        events: paginated.map(mapEvent),
      },
    });
  }),
];
