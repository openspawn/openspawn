import { GraphQLClient } from "graphql-request";

// Use the same host as the dashboard, but port 3000 for the API
// This allows LAN access without hardcoding IPs
function getApiUrl(): string {
  // Use configured endpoint if set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development, derive from current location
  if (typeof window !== "undefined" && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000/graphql`;
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
