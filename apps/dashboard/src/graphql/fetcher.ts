import { GraphQLClient } from "graphql-request";
import { demoFetcher } from "../demo/mock-fetcher";
import { sandboxFetcher } from "../demo/sandbox-fetcher";

// Check if we're in demo mode or sandbox mode
// Check both search params and full URL (HashRouter can move params around)
const _href = typeof window !== 'undefined' ? window.location.href : '';
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
export const isDemoMode = urlParams?.get('demo') === 'true' || _href.includes('demo=true') || import.meta.env.VITE_DEMO_MODE === 'true';
export const isSandboxMode = urlParams?.get('sandbox') === 'true' || _href.includes('sandbox=true') || import.meta.env.VITE_SANDBOX_MODE === 'true' || _href.includes('bikinibottom.ai');

if (isDemoMode) {
  console.log("[GraphQL] Demo mode enabled - using mock fetcher (no network requests)");
}
if (isSandboxMode) {
  console.log("[GraphQL] Sandbox mode enabled - fetching from sandbox API (localhost:3333)");
}

// Use the same host as the dashboard, but port 3000 for the API
// This allows LAN access without hardcoding IPs
function getApiUrl(): string {
  // Always derive from current location in browser for LAN compatibility
  // This ensures accessing from 192.168.x.x uses that IP, not localhost
  if (typeof window !== "undefined" && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    const url = `${protocol}//${hostname}:3000/api/v1/graphql`;
    console.log("[GraphQL] Auto-detected API URL:", url);
    return url;
  }

  // Fallback for SSR or non-browser environments
  if (import.meta.env.VITE_API_URL) {
    console.log("[GraphQL] Using VITE_API_URL:", import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
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
  variables?: TVariables
): () => Promise<TData> {
  // Use sandbox fetcher (real LLM agents via Ollama)
  if (isSandboxMode) {
    return sandboxFetcher<TData, TVariables>(query, variables);
  }

  // Use mock fetcher in demo mode (no network requests!)
  if (isDemoMode) {
    return demoFetcher<TData, TVariables>(query, variables);
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
