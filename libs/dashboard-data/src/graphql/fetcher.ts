import { GraphQLClient } from "graphql-request";

// Check if we're in demo mode or sandbox mode
// Check both search params and full URL (HashRouter can move params around)
const _href = typeof window !== 'undefined' ? (window.location.href ?? '') : '';
const urlParams = typeof window !== 'undefined' && window.location.search ? new URLSearchParams(window.location.search) : null;
const _env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
export const isDemoMode = urlParams?.get('demo') === 'true' || _href.includes('demo=true') || _env.VITE_DEMO_MODE === 'true';
export const isSandboxMode = urlParams?.get('sandbox') === 'true' || _href.includes('sandbox=true') || _env.VITE_SANDBOX_MODE === 'true' || _href.includes('bikinibottom.ai');

if (isDemoMode) {
  console.log("[GraphQL] Demo mode enabled - using mock fetcher (no network requests)");
}
if (isSandboxMode) {
  console.log("[GraphQL] Sandbox mode enabled - fetching from sandbox API (localhost:3333)");
}

// Pluggable fetcher overrides — set by the app for demo/sandbox modes
type FetcherFn = <TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables,
) => () => Promise<TData>;

let _demoFetcher: FetcherFn | null = null;
let _sandboxFetcher: FetcherFn | null = null;

/** Register a demo-mode fetcher (called by app at startup). */
export function setDemoFetcher(fn: FetcherFn) { _demoFetcher = fn; }
/** Register a sandbox-mode fetcher (called by app at startup). */
export function setSandboxFetcher(fn: FetcherFn) { _sandboxFetcher = fn; }

// Use the same host as the dashboard, but port 3000 for the API
// This allows LAN access without hardcoding IPs
function getApiUrl(): string {
  // Explicit API URL takes priority (production deployments)
  if (_env.VITE_API_URL) {
    console.log("[GraphQL] Using VITE_API_URL:", _env.VITE_API_URL);
    return _env.VITE_API_URL;
  }

  // Auto-detect from current location for LAN/dev compatibility
  if (typeof window !== "undefined" && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    const url = `${protocol}//${hostname}:3000/api/v1/graphql`;
    console.log("[GraphQL] Auto-detected API URL:", url);
    return url;
  }

  return "http://localhost:3000/api/v1/graphql";
}

// Lazy initialization to ensure window.location is available
let _client: GraphQLClient | null = null;

function getClient(): GraphQLClient {
  if (!_client) {
    _client = new GraphQLClient(getApiUrl());
  }
  return _client;
}

/**
 * GraphQL fetcher
 * In demo mode: Returns mock data from SimulationEngine (no network)
 * In prod mode: Makes real GraphQL requests to API
 */
export function fetcher<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  _options?: RequestInit['headers']
): () => Promise<TData> {
  // Use sandbox fetcher (real LLM agents via Ollama)
  if (isSandboxMode && _sandboxFetcher) {
    return _sandboxFetcher<TData, TVariables>(query, variables);
  }

  // Use mock fetcher in demo mode (no network requests!)
  if (isDemoMode && _demoFetcher) {
    return _demoFetcher<TData, TVariables>(query, variables);
  }
  
  // Real API request
  return async () => {
    return getClient().request<TData>(query, variables);
  };
}

// For direct access if needed
export const graphqlClient = {
  request: <TData>(query: string, variables?: Record<string, unknown>) => 
    getClient().request<TData>(query, variables),
};
