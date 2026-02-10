export interface MockTraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: "OK" | "ERROR" | "UNSET";
  attributes: Record<string, string>;
}

export interface MockMetricPoint {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: Record<string, string>;
}

const baseTime = Date.now() - 60_000;

export const mockTraces: MockTraceSpan[] = [
  {
    traceId: "abc123def456",
    spanId: "span001",
    operationName: "POST /api/tasks",
    serviceName: "bikinibottom-api",
    startTime: baseTime,
    endTime: baseTime + 45,
    durationMs: 45,
    status: "OK",
    attributes: { "http.method": "POST", "http.status_code": "201" },
  },
  {
    traceId: "abc123def456",
    spanId: "span002",
    parentSpanId: "span001",
    operationName: "task.created",
    serviceName: "bikinibottom-api",
    startTime: baseTime + 5,
    endTime: baseTime + 12,
    durationMs: 7,
    status: "OK",
    attributes: { "task.id": "task-001", "task.phase": "created" },
  },
  {
    traceId: "abc123def456",
    spanId: "span003",
    parentSpanId: "span001",
    operationName: "task.assigned",
    serviceName: "bikinibottom-api",
    startTime: baseTime + 12,
    endTime: baseTime + 20,
    durationMs: 8,
    status: "OK",
    attributes: {
      "task.id": "task-001",
      "task.phase": "assigned",
      "agent.id": "agent-spongebob",
    },
  },
  {
    traceId: "def789ghi012",
    spanId: "span004",
    operationName: "GET /api/agents",
    serviceName: "bikinibottom-api",
    startTime: baseTime + 100,
    endTime: baseTime + 118,
    durationMs: 18,
    status: "OK",
    attributes: { "http.method": "GET", "http.status_code": "200" },
  },
  {
    traceId: "ghi345jkl678",
    spanId: "span005",
    operationName: "task.failed",
    serviceName: "bikinibottom-api",
    startTime: baseTime + 200,
    endTime: baseTime + 210,
    durationMs: 10,
    status: "ERROR",
    attributes: { "task.id": "task-002", "task.phase": "failed" },
  },
  {
    traceId: "jkl901mno234",
    spanId: "span006",
    operationName: "agent.heartbeat",
    serviceName: "bikinibottom-api",
    startTime: baseTime + 300,
    endTime: baseTime + 302,
    durationMs: 2,
    status: "OK",
    attributes: { "agent.id": "agent-patrick", "agent.action": "heartbeat" },
  },
  {
    traceId: "mno567pqr890",
    spanId: "span007",
    operationName: "task.completed",
    serviceName: "bikinibottom-api",
    startTime: baseTime + 400,
    endTime: baseTime + 435,
    durationMs: 35,
    status: "OK",
    attributes: { "task.id": "task-003", "task.phase": "completed" },
  },
];

export const mockMetrics: MockMetricPoint[] = [
  {
    name: "http.request.duration",
    value: 45,
    unit: "ms",
    timestamp: baseTime,
    labels: { operation: "POST /api/tasks" },
  },
  {
    name: "http.request.duration",
    value: 18,
    unit: "ms",
    timestamp: baseTime + 100,
    labels: { operation: "GET /api/agents" },
  },
  {
    name: "http.request.count",
    value: 1,
    unit: "count",
    timestamp: baseTime,
    labels: { operation: "POST /api/tasks" },
  },
  {
    name: "http.request.count",
    value: 1,
    unit: "count",
    timestamp: baseTime + 100,
    labels: { operation: "GET /api/agents" },
  },
  {
    name: "http.request.error",
    value: 1,
    unit: "count",
    timestamp: baseTime + 200,
    labels: { operation: "POST /api/tasks", error_type: "HTTP_500" },
  },
  {
    name: "task.lifecycle.duration",
    value: 1200,
    unit: "ms",
    timestamp: baseTime + 400,
    labels: { phase: "completed", task_id: "task-003" },
  },
];
