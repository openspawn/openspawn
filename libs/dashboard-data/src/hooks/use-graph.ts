import { isDemoMode, isSandboxMode } from "../lib/mode";
import {
  useRestGraphEntities,
  useRestGraphRelationships,
  useRestGraphCytoscape,
} from "../rest/hooks/use-graph";
import {
  demoEntities,
  demoRelationships,
  getCytoscapeData,
  type DemoRelationship,
  type DemoEntity,
} from "@openspawn/demo-data";

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

  const raw = rest.data;
  const entities: DemoEntity[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown> | undefined)?.data)
      ? ((raw as Record<string, unknown>).data as DemoEntity[])
      : [];

  return {
    entities,
    loading: rest.isLoading,
    error: rest.error ?? null,
    refetch: rest.refetch,
  };
}

export function useGraphRelationships(entityId?: string) {
  const rest = useRestGraphRelationships(entityId ?? "", {
    enabled: isLiveMode && !!entityId,
  });

  if (!isLiveMode) {
    return {
      relationships: demoRelationships,
      loading: false,
      error: null,
      refetch: () => Promise.resolve(),
    };
  }

  const raw = rest.data;
  const relationships: DemoRelationship[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown> | undefined)?.data)
      ? ((raw as Record<string, unknown>).data as DemoRelationship[])
      : [];

  return {
    relationships,
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
  const raw =
    rest.data && "data" in rest.data ? (rest.data as Record<string, unknown>).data : rest.data;
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
