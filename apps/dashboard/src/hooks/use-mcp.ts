/**
 * useMcpOrgStatus — polls MCP org_status every 5 seconds.
 * Returns { data, error, connected }.
 */

import { useState, useEffect, useCallback } from 'react';
import { orgStatus, McpError } from '../services/mcp-client';

export interface McpOrgData {
  agents?: unknown[];
  tasks?: unknown[];
  [key: string]: unknown;
}

export function useMcpOrgStatus(intervalMs = 5000) {
  const [data, setData] = useState<McpOrgData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await orgStatus();
      setData(result as McpOrgData);
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err instanceof McpError ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { data, connected, error, refresh };
}
