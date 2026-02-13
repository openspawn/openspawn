import { describe, it, expect } from 'vitest';
import { formatTime, formatDate } from '../date-format';

describe('formatTime', () => {
  it('formats an ISO date string to a short time', () => {
    const result = formatTime('2025-01-15T14:30:00Z');
    // Exact output depends on locale/timezone, but should contain digits and colon
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('handles midnight', () => {
    const result = formatTime('2025-06-01T00:00:00Z');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDate', () => {
  it('formats to short month and day', () => {
    const result = formatDate('2025-01-15T14:30:00Z');
    // Should contain month abbreviation and day number
    expect(result).toMatch(/\w{3}\s+\d{1,2}/);
  });

  it('handles year boundaries', () => {
    const result = formatDate('2025-12-31T23:59:59Z');
    expect(result).toBeTruthy();
  });
});
