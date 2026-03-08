import { isDemoMode, isSandboxMode } from "../lib/mode";
import {
  useRestMemories,
  useRestMemorySearch,
  useRestContradictions,
} from "../rest/hooks/use-memory";
import { demoMemories, searchMemories } from "@openspawn/demo-data";

const isLiveMode = !isDemoMode && !isSandboxMode;

export function useMemories() {
  const rest = useRestMemories({ enabled: isLiveMode });

  if (!isLiveMode) {
    return {
      memories: demoMemories,
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return {
    memories: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useMemorySearch(query: string) {
  const rest = useRestMemorySearch(query, { enabled: isLiveMode });

  if (!isLiveMode) {
    return {
      memories: query ? searchMemories(query) : demoMemories,
      loading: false,
      error: null,
    };
  }

  return {
    memories: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}

export function useContradictions() {
  const rest = useRestContradictions({ enabled: isLiveMode });

  // Demo contradictions are handled in the page component itself
  if (!isLiveMode) {
    return {
      contradictions: [],
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return {
    contradictions: Array.isArray(rest.data) ? rest.data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}
