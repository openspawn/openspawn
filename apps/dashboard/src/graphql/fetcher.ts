import { GraphQLClient } from "graphql-request";

// Use the same host as the dashboard, but port 3000 for the API
// This allows LAN access without hardcoding IPs
function getApiUrl(): string {
  // Always derive from current location in browser for LAN compatibility
  // This ensures accessing from 192.168.x.x uses that IP, not localhost
  if (typeof window !== "undefined" && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    const url = `${protocol}//${hostname}:3000/graphql`;
    console.log("[GraphQL] Auto-detected API URL:", url);
    return url;
  }

  // Fallback for SSR or non-browser environments
  if (import.meta.env.VITE_API_URL) {
    console.log("[GraphQL] Using VITE_API_URL:", import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }

  return "http://localhost:3000/graphql";
}

// Lazy initialization to ensure window.location is available
let _client: GraphQLClient | null = null;

function getClient(): GraphQLClient {
  if (!_client) {
    _client = new GraphQLClient(getApiUrl());
  }
  return _client;
}

export function fetcher<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables
): () => Promise<TData> {
  return async () => {
    return getClient().request<TData>(query, variables);
  };
}

// For direct access if needed
export const graphqlClient = {
  request: <TData>(query: string, variables?: Record<string, unknown>) => 
    getClient().request<TData>(query, variables),
};
