import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from './http-client';
import { AuthHandler } from './auth';
import {
  ApiError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  ValidationError,
} from './errors';

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let authHandler: AuthHandler;

  beforeEach(() => {
    authHandler = new AuthHandler('test-api-key');
    httpClient = new HttpClient('https://api.test.com', authHandler, {
      maxRetries: 2,
      retryDelay: 100,
    });
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockData = { data: { id: '1', name: 'Test' } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await httpClient.get('/test');
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should make successful POST request', async () => {
      const mockData = { data: { id: '1', created: true } };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockData,
      });

      const body = { name: 'Test' };
      const result = await httpClient.post('/test', body);
      
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should handle 404 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(httpClient.get('/test')).rejects.toThrow(NotFoundError);
    });

    it('should handle 401 errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(httpClient.get('/test')).rejects.toThrow(
        UnauthorizedError
      );
    });

    it('should handle 429 rate limit errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => ({ message: 'Rate limited' }),
      });

      try {
        await httpClient.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it('should handle 400 validation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Validation failed',
          errors: { field1: ['required'] },
        }),
      });

      await expect(httpClient.get('/test')).rejects.toThrow(ValidationError);
    });

    it('should retry on 500 errors', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Server error' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: 'success' }),
        });
      });

      const result = await httpClient.get('/test');
      expect(result).toEqual({ data: 'success' });
      expect(callCount).toBe(3);
    });

    it('should not retry on skipRetry option', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(
        httpClient.get('/test', { skipRetry: true })
      ).rejects.toThrow(ApiError);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle 204 No Content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await httpClient.delete('/test');
      expect(result).toBeUndefined();
    });

    it('should include idempotency key in headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      });

      await httpClient.post('/test', { data: 'test' }, {
        idempotencyKey: 'key-123',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Idempotency-Key': 'key-123',
          }),
        })
      );
    });
  });

  describe('convenience methods', () => {
    it('should support GET', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await httpClient.get('/test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should support POST', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await httpClient.post('/test', { data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should support PATCH', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await httpClient.patch('/test', { data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should support DELETE', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      await httpClient.delete('/test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
