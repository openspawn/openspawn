import type { DemoTrace } from '../types';

// Helper to generate trace IDs
function generateTraceId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateSpanId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Base timestamp (30 days ago)
const BASE_TIME = Date.now() - 30 * 24 * 60 * 60 * 1000;

function daysAgo(days: number): number {
  return BASE_TIME + days * 24 * 60 * 60 * 1000;
}

function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

function minutesAgo(minutes: number): number {
  return Date.now() - minutes * 60 * 1000;
}

// Task lifecycle operations
const TASK_OPERATIONS = [
  'task.create',
  'task.assign',
  'task.start',
  'task.execute',
  'task.validate',
  'task.complete',
] as const;

// Generate sample traces
export const traces: DemoTrace[] = [];

// Generate historical traces (last 30 days)
for (let day = 0; day < 30; day++) {
  const tracesPerDay = Math.floor(Math.random() * 20) + 10;
  
  for (let i = 0; i < tracesPerDay; i++) {
    const traceId = generateTraceId();
    const startTime = daysAgo(day) + Math.random() * 24 * 60 * 60 * 1000;
    const duration = Math.random() * 5000 + 100; // 100ms to 5s
    const status = Math.random() > 0.95 ? 'error' : 'ok';
    
    const operation = TASK_OPERATIONS[
      Math.floor(Math.random() * TASK_OPERATIONS.length)
    ];
    
    traces.push({
      traceId,
      spanId: generateSpanId(),
      name: operation,
      startTime,
      endTime: startTime + duration,
      duration,
      status,
      attributes: {
        'task.id': `task-${Math.floor(Math.random() * 1000)}`,
        'task.operation': operation,
        'service.name': 'openspawn-api',
        'agent.id': `agent-${Math.floor(Math.random() * 50)}`,
      },
      events: [
        {
          name: 'operation.started',
          timestamp: startTime,
          attributes: { phase: 'init' },
        },
        {
          name: 'operation.completed',
          timestamp: startTime + duration,
          attributes: { phase: 'done' },
        },
      ],
    });
  }
}

// Generate recent traces (last 2 hours)
for (let i = 0; i < 50; i++) {
  const traceId = generateTraceId();
  const minutesBack = Math.random() * 120;
  const startTime = minutesAgo(minutesBack);
  const duration = Math.random() * 3000 + 50;
  const status = Math.random() > 0.92 ? 'error' : 'ok';
  
  const operation = TASK_OPERATIONS[
    Math.floor(Math.random() * TASK_OPERATIONS.length)
  ];
  
  traces.push({
    traceId,
    spanId: generateSpanId(),
    name: operation,
    startTime,
    endTime: startTime + duration,
    duration,
    status,
    attributes: {
      'task.id': `task-${Math.floor(Math.random() * 100)}`,
      'task.operation': operation,
      'service.name': 'openspawn-api',
      'agent.id': `agent-${Math.floor(Math.random() * 20)}`,
    },
    events: [
      {
        name: 'validation.started',
        timestamp: startTime + duration * 0.1,
        attributes: { validator: 'schema' },
      },
      {
        name: 'validation.passed',
        timestamp: startTime + duration * 0.2,
        attributes: { checks: 5 },
      },
      {
        name: 'processing.started',
        timestamp: startTime + duration * 0.3,
        attributes: { processor: 'main' },
      },
      {
        name: 'processing.completed',
        timestamp: startTime + duration * 0.9,
        attributes: { result: 'success' },
      },
    ],
  });
}

// HTTP request traces
for (let i = 0; i < 30; i++) {
  const traceId = generateTraceId();
  const startTime = minutesAgo(Math.random() * 60);
  const duration = Math.random() * 500 + 50;
  const statusCode = Math.random() > 0.9 ? 500 : 200;
  
  traces.push({
    traceId,
    spanId: generateSpanId(),
    name: 'http.request',
    startTime,
    endTime: startTime + duration,
    duration,
    status: statusCode === 200 ? 'ok' : 'error',
    attributes: {
      'http.method': ['GET', 'POST', 'PUT'][Math.floor(Math.random() * 3)],
      'http.url': ['/api/tasks', '/api/agents', '/api/events'][
        Math.floor(Math.random() * 3)
      ],
      'http.status_code': statusCode,
      'http.duration_ms': duration,
      'service.name': 'openspawn-api',
    },
    events: [],
  });
}

// Export helper functions
export function getTracesByTimeRange(
  startTime?: number,
  endTime?: number,
  limit = 100
): DemoTrace[] {
  let filtered = [...traces];
  
  if (startTime !== undefined) {
    filtered = filtered.filter((t) => t.startTime >= startTime);
  }
  
  if (endTime !== undefined) {
    filtered = filtered.filter((t) => t.startTime <= endTime);
  }
  
  return filtered
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, limit);
}

export function getTracesByStatus(status: 'ok' | 'error'): DemoTrace[] {
  return traces.filter((t) => t.status === status);
}

export function getTracesByOperation(operation: string): DemoTrace[] {
  return traces.filter((t) => t.name === operation);
}

export function getTelemetryMetrics() {
  const totalTraces = new Set(traces.map((t) => t.traceId)).size;
  const totalSpans = traces.length;
  const totalDuration = traces.reduce((sum, t) => sum + (t.duration || 0), 0);
  const errorCount = traces.filter((t) => t.status === 'error').length;
  
  return {
    totalTraces,
    totalSpans,
    averageDuration: totalSpans > 0 ? totalDuration / totalSpans : 0,
    errorRate: totalSpans > 0 ? errorCount / totalSpans : 0,
  };
}
