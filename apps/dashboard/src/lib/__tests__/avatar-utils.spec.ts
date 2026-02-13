import { describe, it, expect } from 'vitest';
import { darkenForBackground } from '../avatar-utils';

describe('darkenForBackground', () => {
  it('darkens red (#dc2626) to a very dark red', () => {
    const result = darkenForBackground('#dc2626');
    // 0xdc * 0.15 ≈ 33 = 0x21, 0x26 * 0.15 ≈ 6 = 0x06
    expect(result).toBe('#210606');
  });

  it('darkens cyan (#06b6d4) to dark cyan', () => {
    const result = darkenForBackground('#06b6d4');
    // 0x06*0.15≈1, 0xb6*0.15≈27=0x1b, 0xd4*0.15≈32=0x20
    expect(result).toBe('#011b20');
  });

  it('keeps black (#000000) as black', () => {
    expect(darkenForBackground('#000000')).toBe('#000000');
  });

  it('darkens white (#ffffff) to light gray', () => {
    const result = darkenForBackground('#ffffff');
    // 255 * 0.15 ≈ 38 = 0x26
    expect(result).toBe('#262626');
  });

  it('produces visible contrast for various colors', () => {
    const colors = ['#dc2626', '#06b6d4', '#22c55e', '#f472b6', '#a78bfa'];
    for (const color of colors) {
      const darkened = darkenForBackground(color);
      // All darkened colors should have low RGB values (< 0x40 per channel)
      const r = parseInt(darkened.slice(1, 3), 16);
      const g = parseInt(darkened.slice(3, 5), 16);
      const b = parseInt(darkened.slice(5, 7), 16);
      expect(r).toBeLessThan(64);
      expect(g).toBeLessThan(64);
      expect(b).toBeLessThan(64);
    }
  });
});
