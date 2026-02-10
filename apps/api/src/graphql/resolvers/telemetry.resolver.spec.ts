import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryResolver } from './telemetry.resolver';
import { TelemetryService } from '../../telemetry';

describe('TelemetryResolver', () => {
  let resolver: TelemetryResolver;
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryResolver,
        TelemetryService,
      ],
    }).compile();

    resolver = module.get<TelemetryResolver>(TelemetryResolver);
    service = module.get<TelemetryService>(TelemetryService);
    service.clearTraces();
  });

  afterEach(() => {
    service.clearTraces();
  });

  describe('traces', () => {
    it('should return empty array when no traces', async () => {
      const result = await resolver.traces();
      expect(result).toEqual([]);
    });

    it('should return traces', async () => {
      service.recordTraceData({
        traceId: 'trace-1',
        spanId: 'span-1',
        name: 'test.trace',
        startTime: Date.now(),
        duration: 100,
        status: 'ok',
        attributes: { key: 'value' },
        events: [],
      });

      const result = await resolver.traces();
      expect(result).toHaveLength(1);
      expect(result[0].traceId).toBe('trace-1');
    });

    it('should filter by start time', async () => {
      const now = Date.now();
      
      service.recordTraceData({
        traceId: 'trace-old',
        spanId: 'span-old',
        name: 'old',
        startTime: now - 10000,
        duration: 100,
        status: 'ok',
        attributes: {},
        events: [],
      });

      service.recordTraceData({
        traceId: 'trace-new',
        spanId: 'span-new',
        name: 'new',
        startTime: now - 1000,
        duration: 100,
        status: 'ok',
        attributes: {},
        events: [],
      });

      const result = await resolver.traces(now - 5000);
      expect(result).toHaveLength(1);
      expect(result[0].traceId).toBe('trace-new');
    });

    it('should limit results', async () => {
      for (let i = 0; i < 10; i++) {
        service.recordTraceData({
          traceId: `trace-${i}`,
          spanId: `span-${i}`,
          name: 'test',
          startTime: Date.now() - i * 1000,
          duration: 100,
          status: 'ok',
          attributes: {},
          events: [],
        });
      }

      const result = await resolver.traces(undefined, undefined, 5);
      expect(result).toHaveLength(5);
    });

    it('should include events in traces', async () => {
      service.recordTraceData({
        traceId: 'trace-1',
        spanId: 'span-1',
        name: 'test',
        startTime: Date.now(),
        duration: 100,
        status: 'ok',
        attributes: {},
        events: [
          {
            name: 'event.1',
            timestamp: Date.now(),
            attributes: { key: 'value' },
          },
        ],
      });

      const result = await resolver.traces();
      expect(result[0].events).toHaveLength(1);
      expect(result[0].events[0].name).toBe('event.1');
    });
  });

  describe('telemetryMetrics', () => {
    it('should return zero metrics when no traces', async () => {
      const result = await resolver.telemetryMetrics();
      expect(result.totalTraces).toBe(0);
      expect(result.totalSpans).toBe(0);
      expect(result.averageDuration).toBe(0);
      expect(result.errorRate).toBe(0);
    });

    it('should return calculated metrics', async () => {
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

      const result = await resolver.telemetryMetrics();
      expect(result.totalTraces).toBe(2);
      expect(result.totalSpans).toBe(2);
      expect(result.averageDuration).toBe(150);
      expect(result.errorRate).toBe(0.5);
    });
  });
});
