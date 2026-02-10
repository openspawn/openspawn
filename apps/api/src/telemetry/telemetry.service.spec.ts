import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryService],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    service.clearTraces();
  });

  afterEach(() => {
    service.clearTraces();
  });

  describe('startTaskSpan', () => {
    it('should start a span for task operation', () => {
      const span = service.startTaskSpan('task-123', 'execute', {
        'agent.id': 'agent-1',
      });
      expect(span).toBeDefined();
    });

    it('should include task attributes in span', () => {
      const span = service.startTaskSpan('task-456', 'validate');
      expect(span).toBeDefined();
    });
  });

  describe('startSpan', () => {
    it('should start a generic span', () => {
      const span = service.startSpan('test.operation');
      expect(span).toBeDefined();
    });

    it('should include custom attributes', () => {
      const span = service.startSpan('custom.op', {
        'custom.attr': 'value',
      });
      expect(span).toBeDefined();
    });
  });

  describe('withSpan', () => {
    it('should execute function within span context', async () => {
      const result = await service.withSpan(
        'test.function',
        async () => 'success'
      );
      expect(result).toBe('success');
    });

    it('should handle errors and set error status', async () => {
      await expect(
        service.withSpan('test.error', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should set OK status on success', async () => {
      const result = await service.withSpan(
        'test.success',
        async (span) => {
          expect(span).toBeDefined();
          return 42;
        }
      );
      expect(result).toBe(42);
    });
  });

  describe('endSpan', () => {
    it('should end span with success status', () => {
      const span = service.startSpan('test.end');
      service.endSpan(span, true);
    });

    it('should end span with error status', () => {
      const span = service.startSpan('test.end.error');
      service.endSpan(span, false);
    });
  });

  describe('addSpanEvent', () => {
    it('should add event to span', () => {
      const span = service.startSpan('test.events');
      service.addSpanEvent(span, 'test.event', { key: 'value' });
    });
  });

  describe('recordTraceData', () => {
    it('should record trace data', () => {
      const traceData = {
        traceId: 'trace-1',
        spanId: 'span-1',
        name: 'test.trace',
        startTime: Date.now(),
        status: 'ok' as const,
        attributes: {},
        events: [],
      };
      service.recordTraceData(traceData);
      const traces = service.getTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0].traceId).toBe('trace-1');
    });

    it('should group traces by traceId', () => {
      const traceId = 'trace-group-1';
      service.recordTraceData({
        traceId,
        spanId: 'span-1',
        name: 'span.1',
        startTime: Date.now(),
        status: 'ok',
        attributes: {},
        events: [],
      });
      service.recordTraceData({
        traceId,
        spanId: 'span-2',
        name: 'span.2',
        startTime: Date.now(),
        status: 'ok',
        attributes: {},
        events: [],
      });
      const traces = service.getTraces();
      expect(traces).toHaveLength(2);
      expect(traces.filter(t => t.traceId === traceId)).toHaveLength(2);
    });
  });

  describe('getTraces', () => {
    beforeEach(() => {
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        service.recordTraceData({
          traceId: `trace-${i}`,
          spanId: `span-${i}`,
          name: `test.trace.${i}`,
          startTime: now - (i * 1000),
          duration: 100,
          status: i === 2 ? 'error' : 'ok',
          attributes: {},
          events: [],
        });
      }
    });

    it('should return all traces', () => {
      const traces = service.getTraces();
      expect(traces).toHaveLength(5);
    });

    it('should filter by start time', () => {
      const cutoff = Date.now() - 2500;
      const traces = service.getTraces(cutoff);
      expect(traces.length).toBeLessThan(5);
    });

    it('should filter by end time', () => {
      const cutoff = Date.now() - 2500;
      const traces = service.getTraces(undefined, cutoff);
      expect(traces.length).toBeGreaterThan(0);
    });

    it('should limit results', () => {
      const traces = service.getTraces(undefined, undefined, 2);
      expect(traces).toHaveLength(2);
    });

    it('should sort by most recent first', () => {
      const traces = service.getTraces();
      for (let i = 0; i < traces.length - 1; i++) {
        expect(traces[i].startTime).toBeGreaterThanOrEqual(traces[i + 1].startTime);
      }
    });
  });

  describe('getMetrics', () => {
    it('should return zero metrics when no traces', () => {
      const metrics = service.getMetrics();
      expect(metrics.totalTraces).toBe(0);
      expect(metrics.totalSpans).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });

    it('should calculate metrics correctly', () => {
      service.recordTraceData({
        traceId: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        startTime: Date.now(),
        duration: 100,
        status: 'ok',
        attributes: {},
        events: [],
      });
      service.recordTraceData({
        traceId: 'trace-2',
        spanId: 'span-2',
        name: 'test',
        startTime: Date.now(),
        duration: 200,
        status: 'error',
        attributes: {},
        events: [],
      });
      const metrics = service.getMetrics();
      expect(metrics.totalTraces).toBe(2);
      expect(metrics.totalSpans).toBe(2);
      expect(metrics.averageDuration).toBe(150);
      expect(metrics.errorRate).toBe(0.5);
    });
  });

  describe('clearTraces', () => {
    it('should clear all traces', () => {
      service.recordTraceData({
        traceId: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        startTime: Date.now(),
        status: 'ok',
        attributes: {},
        events: [],
      });
      expect(service.getTraces()).toHaveLength(1);
      service.clearTraces();
      expect(service.getTraces()).toHaveLength(0);
    });
  });
});
