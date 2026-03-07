import { isDemoMode, isSandboxMode } from "../lib/mode";

// Pluggable fetcher overrides — set by the app for demo/sandbox modes
type FetcherFn = <TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables,
) => () => Promise<TData>;

let _demoFetcher: FetcherFn | null = null;
let _sandboxFetcher: FetcherFn | null = null;

/** Register a demo-mode fetcher (called by app at startup). */
export function setDemoFetcher(fn: FetcherFn) {
  _demoFetcher = fn;
}
/** Register a sandbox-mode fetcher (called by app at startup). */
export function setSandboxFetcher(fn: FetcherFn) {
  _sandboxFetcher = fn;
}

/**
 * Legacy GraphQL fetcher — kept for demo/sandbox mock compatibility.
 * Real API calls now go through the REST client in rest/client.ts.
 */
export function fetcher<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  _options?: RequestInit["headers"],
): () => Promise<TData> {
  if (isSandboxMode && _sandboxFetcher) {
    return _sandboxFetcher<TData, TVariables>(query, variables);
  }

  if (isDemoMode && _demoFetcher) {
    return _demoFetcher<TData, TVariables>(query, variables);
  }

  // Fallback: no real GraphQL endpoint exists anymore
  return async () => {
    throw new Error("GraphQL API removed — use REST client instead");
  };
}

// Stub for backward compat — callers should migrate to REST client
export const graphqlClient = {
  request: <TData>(_query: string, _variables?: Record<string, unknown>): Promise<TData> => {
    throw new Error("GraphQL API removed — use REST client instead");
  },
};
