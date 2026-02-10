---
title: OpenTelemetry
layout: default
parent: Features
nav_order: 9
---

# OpenTelemetry Integration

## Overview

BikiniBottom includes built-in OpenTelemetry (OTEL) support for distributed tracing and metrics collection across the API and dashboard.

## Architecture

### API Layer (`apps/api/src/telemetry/`)

- **TelemetryModule** — Global NestJS module providing telemetry across the app
- **TelemetryService** — Core service for recording spans and metrics
  - Task lifecycle tracing: `created → assigned → in_progress → completed/failed`
  - Agent activity metrics (heartbeats, actions)
  - HTTP request latency, throughput, and error rate tracking
- **TelemetryMiddleware** — Automatic HTTP request tracing for all routes
- **TelemetryConfig** — Environment-based configuration

### GraphQL Layer

- `TraceSpanType` / `MetricPointType` — GraphQL object types
- `TelemetryResolver` — Queries: `traces`, `metrics`, `tracesByOperation`, `metricsByName`, `telemetryEnabled`

### Dashboard (`apps/dashboard/src/components/telemetry/`)

- **TraceTimeline** — Animated waterfall view of trace spans with framer-motion
- **MetricsCards** — Responsive metric cards showing latency, throughput, error rate

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `OTEL_SERVICE_NAME` | `bikinibottom-api` | Service name for spans |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | OTLP collector endpoint |
| `OTEL_ENABLED` | `true` | Enable/disable telemetry |
| `OTEL_SAMPLE_RATE` | `1.0` | Sampling rate (0.0–1.0) |

## Usage

### Recording task lifecycle

```typescript
telemetryService.recordTaskLifecycle("task-123", "completed", "agent-456");
```

### Recording custom metrics

```typescript
telemetryService.recordMetric("custom.counter", 1, "count", { env: "prod" });
```

### GraphQL queries

```graphql
query {
  traces(limit: 20) {
    traceId
    operationName
    durationMs
    status
  }
  telemetryEnabled
}
```

## Demo Data

Mock traces and metrics are available in `libs/demo-data/src/fixtures/telemetry.ts` for development and testing.
