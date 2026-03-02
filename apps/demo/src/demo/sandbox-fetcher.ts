/**
 * Sandbox mode fetcher — connects to the live sandbox API server
 * instead of using the in-memory SimulationEngine.
 *
 * The sandbox server (tools/sandbox) runs real LLM agents via Ollama
 * and exposes a GraphQL-compatible endpoint at localhost:3333/graphql
 */

import { SANDBOX_URL } from '../lib/sandbox-url';

/**
 * TanStack Query fetcher that proxies GraphQL to the sandbox API
 */
export function sandboxFetcher<TData, TVariables extends Record<string, unknown>>(
  query: string,
  variables?: TVariables,
): () => Promise<TData> {
  return async () => {
    const response = await fetch(`${SANDBOX_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Sandbox API error: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors?.length) {
      throw new Error(json.errors[0].message);
    }

    return json.data as TData;
  };
}

/**
 * Check if sandbox server is reachable
 */
export async function isSandboxAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${SANDBOX_URL}/api/state`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get sandbox state summary
 */
export async function getSandboxState(): Promise<{
  tick: number;
  agentCount: number;
  taskCount: number;
  eventCount: number;
  tasksDone: number;
} | null> {
  try {
    const res = await fetch(`${SANDBOX_URL}/api/state`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
