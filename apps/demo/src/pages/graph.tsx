import { useEffect, useMemo, useRef, useState } from "react";
import { Share2, Search, Database, GitBranch, Shield, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import cytoscape from "cytoscape";
import type { Core, EventObject } from "cytoscape";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { PageHeader } from "../components/ui/page-header";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAgents } from "../hooks";
import {
  useGraphEntities,
  useGraphRelationships,
  useGraphCytoscape,
} from "@openspawn/dashboard-data";
import type { DemoEntity } from "@openspawn/demo-data";

const TYPE_COLORS: Record<string, string> = {
  tool: "#06b6d4",
  process: "#a855f7",
  concept: "#f59e0b",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  tool: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  process: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  concept: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{value}%</span>
    </div>
  );
}

export function GraphPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEntity, setSelectedEntity] = useState<DemoEntity | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { agents } = useAgents();
  const { entities } = useGraphEntities();
  const { relationships } = useGraphRelationships();
  const { nodes: cyNodes, edges: cyEdges } = useGraphCytoscape();

  const typedEntities = entities as DemoEntity[];

  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      map.set(agent.id, agent.name);
    }
    return map;
  }, [agents]);

  const entityTypes = useMemo(() => {
    const types = new Set<string>();
    for (const entity of typedEntities) {
      types.add(entity.entityType);
    }
    return Array.from(types).sort();
  }, [typedEntities]);

  const filteredEntityIds = useMemo(() => {
    let result = typedEntities;

    if (typeFilter !== "all") {
      result = result.filter((e) => e.entityType === typeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    return new Set(result.map((e) => e.id));
  }, [typeFilter, searchQuery, typedEntities]);

  const stats = useMemo(() => {
    const totalEntities = typedEntities.length;
    const totalRelationships = relationships.length;
    if (totalEntities === 0)
      return { totalEntities: 0, totalRelationships: 0, avgConfidence: 0, knowledgeGaps: 0 };

    let totalConfidence = 0;
    let knowledgeGaps = 0;

    for (const entity of typedEntities) {
      totalConfidence += entity.confidence;
      if (entity.agentIds.length <= 1) {
        knowledgeGaps++;
      }
    }

    return {
      totalEntities,
      totalRelationships,
      avgConfidence: Math.round(totalConfidence / totalEntities),
      knowledgeGaps,
    };
  }, [typedEntities, relationships]);

  const handleSelectNode = (entity: DemoEntity | null) => {
    setSelectedEntity(entity);
  };

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    if (cyNodes.length === 0) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: [...cyNodes, ...cyEdges],
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-valign": "bottom",
            "text-halign": "center",
            "font-size": "11px",
            color: "#94a3b8",
            "text-margin-y": 6,
            "background-color": "#475569",
            width: 30,
            height: 30,
            "border-width": 2,
            "border-color": "#334155",
            "text-outline-width": 2,
            "text-outline-color": "#0f172a",
          },
        },
        {
          selector: "edge",
          style: {
            label: "data(label)",
            "font-size": "9px",
            color: "#64748b",
            "text-rotation": "autorotate",
            "text-margin-y": -10,
            width: 2,
            "line-color": "#334155",
            "target-arrow-color": "#334155",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "text-outline-width": 2,
            "text-outline-color": "#0f172a",
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 3,
            "border-color": "#06b6d4",
            "background-opacity": 1,
          },
        },
        {
          selector: "node.dimmed",
          style: {
            opacity: 0.25,
          },
        },
        {
          selector: "edge.dimmed",
          style: {
            opacity: 0.15,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        gravity: 0.3,
        padding: 40,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    // Color nodes by type and size by mention_count
    cy.nodes().forEach((node) => {
      const entityType = node.data("type") as string;
      const mentionCount = node.data("mention_count") as number;
      const nodeColor = TYPE_COLORS[entityType] ?? "#475569";
      const size = Math.max(20, Math.min(50, mentionCount * 5));
      node.style({
        "background-color": nodeColor,
        width: size,
        height: size,
      });
    });

    // Node click handler
    cy.on("tap", "node", (evt: EventObject) => {
      const nodeId = evt.target.data("id") as string;
      const entity = typedEntities.find((e) => e.id === nodeId);
      if (entity) {
        handleSelectNode(entity);
      }
    });

    // Background click to deselect
    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        handleSelectNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [cyNodes, cyEdges, typedEntities]);

  // Apply filter highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const showAll = typeFilter === "all" && !searchQuery;

    cy.nodes().forEach((node) => {
      const nodeId = node.data("id") as string;
      if (showAll || filteredEntityIds.has(nodeId)) {
        node.removeClass("dimmed");
      } else {
        node.addClass("dimmed");
      }
    });

    cy.edges().forEach((edge) => {
      const sourceId = edge.data("source") as string;
      const targetId = edge.data("target") as string;
      if (showAll || (filteredEntityIds.has(sourceId) && filteredEntityIds.has(targetId))) {
        edge.removeClass("dimmed");
      } else {
        edge.addClass("dimmed");
      }
    });
  }, [filteredEntityIds, typeFilter, searchQuery]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("highlighted");

    if (selectedEntity) {
      const node = cy.getElementById(selectedEntity.id);
      if (node.length > 0) {
        node.addClass("highlighted");
      }
    }
  }, [selectedEntity]);

  const entityRelationships = useMemo(() => {
    if (!selectedEntity) return [];
    return relationships.filter(
      (r: { sourceEntityId: string; targetEntityId: string }) =>
        r.sourceEntityId === selectedEntity.id || r.targetEntityId === selectedEntity.id,
    );
  }, [selectedEntity, relationships]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Knowledge Graph"
        description="Entity relationship map extracted from agent conversations and task context"
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Entities" value={stats.totalEntities} icon={Database} />
        <StatCard title="Relationships" value={stats.totalRelationships} icon={GitBranch} />
        <StatCard
          title="Avg Confidence"
          value={`${stats.avgConfidence}%`}
          icon={Shield}
          description="Weighted across all entities"
        />
        <StatCard
          title="Knowledge Gaps"
          value={stats.knowledgeGaps}
          icon={AlertTriangle}
          description="Entities known by only 1 agent"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={searchQuery}
            onChange={handleChangeSearch}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Graph canvas */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                ref={containerRef}
                className="h-[500px] w-full bg-background"
                style={{ minHeight: 400 }}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Entity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntity ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedEntity.name}</h3>
                    <Badge
                      variant="outline"
                      className={TYPE_BADGE_COLORS[selectedEntity.entityType]}
                    >
                      {selectedEntity.entityType}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedEntity.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <ConfidenceBar value={selectedEntity.confidence} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mentions</span>
                      <span className="font-medium tabular-nums">
                        {selectedEntity.mentionCount}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Known by
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selectedEntity.agentIds.map((id) => (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {agentMap.get(id) ?? "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {entityRelationships.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Relationships
                      </span>
                      <div className="mt-1.5 space-y-1.5">
                        {entityRelationships.map((rel) => {
                          const isSource = rel.sourceEntityId === selectedEntity.id;
                          const otherId = isSource ? rel.targetEntityId : rel.sourceEntityId;
                          const otherEntity = typedEntities.find((e) => e.id === otherId);
                          return (
                            <div
                              key={rel.id}
                              className="flex items-center gap-2 text-xs rounded-md border border-border p-2"
                            >
                              <Badge variant="outline" className="text-[10px] px-1.5">
                                {rel.relationshipType}
                              </Badge>
                              <span className="text-muted-foreground">
                                {isSource ? "\u2192" : "\u2190"}
                              </span>
                              <span className="font-medium truncate">
                                {otherEntity?.name ?? "Unknown"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Share2 className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Click a node to inspect</p>
                  <p className="text-xs mt-1 opacity-70">
                    {typedEntities.length} entities, {relationships.length} relationships
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
