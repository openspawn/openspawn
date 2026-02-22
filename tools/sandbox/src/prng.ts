// ── Seedable PRNG ────────────────────────────────────────────────────────────
// Mulberry32: a simple, fast, seedable 32-bit PRNG.
// Used by the deterministic simulation engine so that:
//   1. Tests are fully reproducible (fixed seed → identical run)
//   2. Demo replays produce consistent "drama" moments
//   3. The name "DeterministicSimulation" actually means something
//
// Default seed is Date.now() so production still feels random.

export interface PRNG {
  /** Returns a float in [0, 1), like Math.random() */
  random(): number;
  /** Returns an integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** Pick a random element from an array */
  pick<T>(arr: T[]): T;
  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean;
  /** Shuffle an array in place (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[];
  /** The seed used to initialize this PRNG */
  readonly seed: number;
}

/**
 * Create a seedable PRNG using the Mulberry32 algorithm.
 * Same seed always produces the same sequence.
 */
export function createPRNG(seed: number = Date.now()): PRNG {
  let state = seed | 0;

  function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    random,
    int(min: number, max: number): number {
      return Math.floor(random() * (max - min + 1)) + min;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(random() * arr.length)];
    },
    chance(probability: number): boolean {
      return random() < probability;
    },
    shuffle<T>(arr: T[]): T[] {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    get seed() {
      return seed;
    },
  };
}
