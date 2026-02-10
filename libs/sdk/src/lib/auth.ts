import { createHmac, randomBytes } from 'crypto';
import type { HmacCredentials } from './types';
import { AuthenticationError } from './errors';

export interface AuthHeaders extends Record<string, string | undefined> {
  'Content-Type': string;
  Authorization?: string;
  'X-Agent-Id'?: string;
  'X-Timestamp'?: string;
  'X-Nonce'?: string;
  'X-Signature'?: string;
  'X-Idempotency-Key'?: string;
}

export class AuthHandler {
  private apiKey?: string;
  private hmacCredentials?: HmacCredentials;

  constructor(apiKey?: string, hmacCredentials?: HmacCredentials) {
    if (!apiKey && !hmacCredentials) {
      throw new AuthenticationError(
        'Either apiKey or hmacCredentials must be provided'
      );
    }

    if (apiKey && hmacCredentials) {
      throw new AuthenticationError(
        'Cannot use both apiKey and hmacCredentials. Choose one.'
      );
    }

    this.apiKey = apiKey;
    this.hmacCredentials = hmacCredentials;
  }

  /**
   * Generate authentication headers for a request
   */
  getHeaders(
    method: string,
    path: string,
    body?: string,
    idempotencyKey?: string
  ): AuthHeaders {
    const headers: AuthHeaders = {
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    } else if (this.hmacCredentials) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = randomBytes(16).toString('hex');
      const signature = this.sign(
        method,
        path,
        timestamp,
        nonce,
        body || ''
      );

      headers['X-Agent-Id'] = this.hmacCredentials.agentId;
      headers['X-Timestamp'] = timestamp;
      headers['X-Nonce'] = nonce;
      headers['X-Signature'] = signature;
    }

    return headers;
  }

  /**
   * Sign a request using HMAC-SHA256
   */
  private sign(
    method: string,
    path: string,
    timestamp: string,
    nonce: string,
    body: string
  ): string {
    if (!this.hmacCredentials) {
      throw new AuthenticationError('HMAC credentials not configured');
    }

    const message = `${method}${path}${timestamp}${nonce}${body}`;
    return createHmac('sha256', this.hmacCredentials.secret)
      .update(message)
      .digest('hex');
  }
}
