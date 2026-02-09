/**
 * Debug logging utilities that only output in development mode.
 * In production builds, these are no-ops for zero overhead.
 */

export const debug = {
  demo: import.meta.env.DEV
    ? (...args: unknown[]) => console.log('[Demo]', ...args)
    : () => {},
  mockFetcher: import.meta.env.DEV
    ? (...args: unknown[]) => console.log('[MockFetcher]', ...args)
    : () => {},
};
