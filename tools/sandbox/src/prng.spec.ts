import { describe, it, expect } from 'vitest';
import { createPRNG } from './prng.js';

describe('PRNG', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createPRNG(42);
    const b = createPRNG(42);
    for (let i = 0; i < 100; i++) {
      expect(a.random()).toBe(b.random());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = createPRNG(42);
    const b = createPRNG(99);
    const aVals = Array.from({ length: 10 }, () => a.random());
    const bVals = Array.from({ length: 10 }, () => b.random());
    expect(aVals).not.toEqual(bVals);
  });

  it('random() returns values in [0, 1)', () => {
    const rng = createPRNG(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() returns integers in [min, max]', () => {
    const rng = createPRNG(42);
    for (let i = 0; i < 100; i++) {
      const v = rng.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick() returns elements from the array', () => {
    const rng = createPRNG(42);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it('pick() is deterministic', () => {
    const a = createPRNG(42);
    const b = createPRNG(42);
    const arr = ['x', 'y', 'z'];
    for (let i = 0; i < 20; i++) {
      expect(a.pick(arr)).toBe(b.pick(arr));
    }
  });

  it('chance() respects probability', () => {
    const rng = createPRNG(42);
    let hits = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) {
      if (rng.chance(0.3)) hits++;
    }
    // Should be roughly 30% (allow ±5%)
    expect(hits / n).toBeGreaterThan(0.25);
    expect(hits / n).toBeLessThan(0.35);
  });

  it('shuffle() is deterministic', () => {
    const a = createPRNG(42);
    const b = createPRNG(42);
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8];
    a.shuffle(arr1);
    b.shuffle(arr2);
    expect(arr1).toEqual(arr2);
  });

  it('shuffle() actually shuffles', () => {
    const rng = createPRNG(42);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = [...arr];
    rng.shuffle(arr);
    // Extremely unlikely to remain identical
    expect(arr).not.toEqual(original);
    // Same elements
    expect([...arr].sort((a, b) => a - b)).toEqual(original);
  });

  it('exposes the seed', () => {
    const rng = createPRNG(12345);
    expect(rng.seed).toBe(12345);
  });
});
