import { GraphQLClient } from "graphql-request";

// Use the same host as the dashboard, but port 3000 for the API
// This allows LAN access without hardcoding IPs
function getApiUrl(): string {
  // In production, use relative URL or configured endpoint
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development, derive from current location
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000/graphql`;
  }

  return "http://localhost:3000/graphql";
}

export const graphqlClient = new GraphQLClient(getApiUrl());

export function fetcher<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables
): () => Promise<TData> {
  return async () => {
    return graphqlClient.request<TData>(query, variables);
  };
}
