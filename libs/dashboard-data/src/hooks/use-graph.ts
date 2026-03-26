import { isDemoMode, isSandboxMode } from "../lib/mode";
import {
  useRestGraphEntities,
  useRestGraphRelationships,
  useRestGraphCytoscape,
} from "../rest/hooks/use-graph";
import { demoEntities, demoRelationships, getCytoscapeData } from "@openspawn/demo-data";

const isLiveMode = !isDemoMode && !isSandboxMode;

export function useGraphEntities() {
  const rest = useRestGraphEntities({ enabled: isLiveMode });

  if (!isLiveMode) {
    return {
      entities: demoEntities,
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return {
    entities: Array.isArray(rest.data) ? rest.data : Array.isArray((rest.data as any)?.data) ? (rest.data as any).data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useGraphRelationships() {
  const rest = useRestGraphRelationships({ enabled: isLiveMode });

  if (!isLiveMode) {
    return {
      relationships: demoRelationships,
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  return {
    relationships: Array.isArray(rest.data) ? rest.data : Array.isArray((rest.data as any)?.data) ? (rest.data as any).data : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useGraphCytoscape() {
  const rest = useRestGraphCytoscape({ enabled: isLiveMode });

  if (!isLiveMode) {
    const data = getCytoscapeData();
    return {
      nodes: data.nodes,
      edges: data.edges,
      loading: false,
      error: null,
    };
  }

  // API returns { data: { nodes, edges } } — unwrap the outer data envelope
  const raw = rest.data && "data" in rest.data ? (rest.data as Record<string, unknown>).data : rest.data;
  const envelope = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nodes = "nodes" in envelope ? envelope.nodes : [];
  const edges = "edges" in envelope ? envelope.edges : [];

  return {
    nodes: Array.isArray(nodes) ? nodes : [],
    edges: Array.isArray(edges) ? edges : [],
    loading: rest.isLoading,
    error: rest.error ?? null,
  };
}
