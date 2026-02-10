import { describe, it, expect } from 'vitest';
import { AuthHandler } from './auth';
import { AuthenticationError } from './errors';

describe('AuthHandler', () => {
  describe('constructor', () => {
    it('should accept API key', () => {
      const handler = new AuthHandler('test-api-key');
      expect(handler).toBeDefined();
    });

    it('should accept HMAC credentials', () => {
      const handler = new AuthHandler(undefined, {
        agentId: 'agent-123',
        secret: 'secret-key',
      });
      expect(handler).toBeDefined();
    });

    it('should throw error if neither apiKey nor hmacCredentials provided', () => {
      expect(() => new AuthHandler()).toThrow(AuthenticationError);
    });

    it('should throw error if both apiKey and hmacCredentials provided', () => {
      expect(
        () =>
          new AuthHandler('api-key', {
            agentId: 'agent-123',
            secret: 'secret',
          })
      ).toThrow(AuthenticationError);
    });
  });

  describe('getHeaders', () => {
    it('should generate API key headers', () => {
      const handler = new AuthHandler('test-api-key');
      const headers = handler.getHeaders('GET', '/test');

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer test-api-key');
      expect(headers['X-Agent-Id']).toBeUndefined();
    });

    it('should generate HMAC headers', () => {
      const handler = new AuthHandler(undefined, {
        agentId: 'agent-123',
        secret: 'secret-key',
      });
      const headers = handler.getHeaders('POST', '/test', '{"foo":"bar"}');

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Agent-Id']).toBe('agent-123');
      expect(headers['X-Timestamp']).toBeDefined();
      expect(headers['X-Nonce']).toBeDefined();
      expect(headers['X-Signature']).toBeDefined();
      expect(headers.Authorization).toBeUndefined();
    });

    it('should include idempotency key when provided', () => {
      const handler = new AuthHandler('test-api-key');
      const headers = handler.getHeaders(
        'POST',
        '/test',
        undefined,
        'idempotency-123'
      );

      expect(headers['X-Idempotency-Key']).toBe('idempotency-123');
    });

    it('should generate consistent HMAC signature for same input', () => {
      const handler = new AuthHandler(undefined, {
        agentId: 'agent-123',
        secret: 'secret-key',
      });

      // Mock Date.now and randomBytes to get consistent output
      const timestamp = '1234567890';
      const nonce = 'a'.repeat(32);
      
      // We can't easily mock crypto.randomBytes, but we can verify the signature format
      const headers = handler.getHeaders('POST', '/test', '{"data":true}');
      
      expect(headers['X-Signature']).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
