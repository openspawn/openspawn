import { useCallback, useMemo, useState } from "react";
import {
  Brain,
  Search,
  Eye,
  EyeOff,
  Users,
  Shield,
  Database,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { StatCard } from "../components/ui/stat-card";
import { PageHeader } from "../components/ui/page-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useAgents } from "../hooks";
import { useMemories, useMemorySearch } from "@openspawn/dashboard-data";
import type { DemoMemory } from "@openspawn/demo-data";
import { formatDate } from "../lib/date-format";

const SOURCE_CONFIDENCE: Record<string, number> = {
  task_completion: 90,
  code_change: 85,
  observation: 60,
  inference: 40,
  unknown: 50,
};

const TYPE_COLORS: Record<string, string> = {
  episodic: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  semantic: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  graph: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const VISIBILITY_ICONS: Record<string, typeof Eye> = {
  shared: Users,
  private: EyeOff,
  targeted: Eye,
};

const SOURCE_COLORS: Record<string, string> = {
  task_completion: "bg-emerald-500/10 text-emerald-500",
  code_change: "bg-cyan-500/10 text-cyan-500",
  observation: "bg-amber-500/10 text-amber-500",
  inference: "bg-rose-500/10 text-rose-500",
  unknown: "bg-gray-500/10 text-gray-500",
};

enum ResolveStrategy {
  KeepNewer = "keep_newer",
  KeepOlder = "keep_older",
  Merge = "merge",
  Flag = "flag",
}

const RESOLVE_LABELS: Record<ResolveStrategy, string> = {
  [ResolveStrategy.KeepNewer]: "Keep Newer",
  [ResolveStrategy.KeepOlder]: "Keep Older",
  [ResolveStrategy.Merge]: "Merge",
  [ResolveStrategy.Flag]: "Flag for Review",
};

interface Contradiction {
  id: string;
  olderMemoryContent: string;
  newerMemoryContent: string;
  olderMemoryId: string;
  newerMemoryId: string;
  detectedAt: string;
}

const DEMO_CONTRADICTIONS: Contradiction[] = [
  {
    id: "contra-001",
    olderMemoryId: "m0000000-0000-0000-0000-000000000004",
    newerMemoryId: "m0000000-0000-0000-0000-000000000001",
    olderMemoryContent:
      "Production deploys require at least one L5+ approval and must happen Mon-Thu 10am-4pm UTC.",
    newerMemoryContent:
      "CI pipeline builds should use nx affected to save build time. Deploy window expanded to include Fridays for hotfixes.",
    detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "contra-002",
    olderMemoryId: "m0000000-0000-0000-0000-000000000002",
    newerMemoryId: "m0000000-0000-0000-0000-000000000007",
    olderMemoryContent:
      "External analytics API rate-limits at 100 req/min. Use 500ms delay between batches.",
    newerMemoryContent:
      "Analytics API upgraded to 500 req/min. Batch delay reduced to 100ms for lead scoring pipeline.",
    detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "contra-003",
    olderMemoryId: "m0000000-0000-0000-0000-000000000010",
    newerMemoryId: "m0000000-0000-0000-0000-000000000006",
    olderMemoryContent:
      "Brand voice should avoid jargon. Max 3 CTAs per page. Headlines must be benefit-driven.",
    newerMemoryContent:
      "Blog posts targeting developers should use technical jargon for credibility. SEO data shows jargon-heavy posts rank 2x higher.",
    detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface FeedbackState {
  helpful: boolean;
  unhelpful: boolean;
}

type FeedbackMap = Map<string, FeedbackState>;

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

function MemoryCard({
  memory,
  agentName,
  feedback,
  onToggleFeedback,
}: {
  memory: DemoMemory;
  agentName: string;
  feedback: FeedbackState;
  onToggleFeedback: (memoryId: string, kind: "helpful" | "unhelpful") => void;
}) {
  const VisIcon = VISIBILITY_ICONS[memory.visibility] ?? Eye;

  const handleClickHelpful = () => {
    onToggleFeedback(memory.id, "helpful");
  };

  const handleClickUnhelpful = () => {
    onToggleFeedback(memory.id, "unhelpful");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={TYPE_COLORS[memory.type]}>
                {memory.type}
              </Badge>
              <Badge variant="outline" className={SOURCE_COLORS[memory.source]}>
                {memory.source.replace("_", " ")}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <VisIcon className="h-3 w-3" />
                {memory.visibility}
              </span>
            </div>
            <ConfidenceBar value={memory.confidence} />
          </div>
          <p className="text-sm leading-relaxed">{memory.content}</p>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {memory.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-1.5 gap-1 ${feedback.helpful ? "text-emerald-500" : "text-muted-foreground hover:text-emerald-500"}`}
                  onClick={handleClickHelpful}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span className="tabular-nums text-[10px]">{feedback.helpful ? 1 : 0}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-1.5 gap-1 ${feedback.unhelpful ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
                  onClick={handleClickUnhelpful}
                >
                  <ThumbsDown className="h-3 w-3" />
                  <span className="tabular-nums text-[10px]">{feedback.unhelpful ? 1 : 0}</span>
                </Button>
              </div>
              <span>{agentName}</span>
              <span>{memory.accessCount} accesses</span>
              <span>{formatDate(memory.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function MemoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [feedbackMap, setFeedbackMap] = useState<FeedbackMap>(new Map());
  const [contradictions, setContradictions] = useState<Contradiction[]>(DEMO_CONTRADICTIONS);
  const { agents } = useAgents();
  const { memories: allMemories } = useMemories();
  const { memories: searchResults } = useMemorySearch(searchQuery);

  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      map.set(agent.id, agent.name);
    }
    return map;
  }, [agents]);

  const filteredMemories = useMemo(() => {
    let result: DemoMemory[] = searchQuery
      ? ([...searchResults] as DemoMemory[])
      : ([...allMemories] as DemoMemory[]);

    if (typeFilter !== "all") {
      result = result.filter((m) => m.type === typeFilter);
    }
    if (sourceFilter !== "all") {
      result = result.filter((m) => m.source === sourceFilter);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [searchQuery, typeFilter, sourceFilter, allMemories, searchResults]);

  const stats = useMemo(() => {
    const memories = allMemories as DemoMemory[];
    const total = memories.length;
    if (total === 0)
      return {
        total: 0,
        byType: { episodic: 0, semantic: 0, graph: 0 },
        bySource: {},
        avgAccess: 0,
        avgConfidence: 0,
      };

    const byType = { episodic: 0, semantic: 0, graph: 0 };
    const bySource: Record<string, number> = {};
    let totalAccess = 0;
    let avgConfidence = 0;

    for (const m of memories) {
      byType[m.type] = (byType[m.type] || 0) + 1;
      bySource[m.source] = (bySource[m.source] || 0) + 1;
      totalAccess += m.accessCount;
      avgConfidence += m.confidence;
    }

    return {
      total,
      byType,
      bySource,
      avgAccess: Math.round(totalAccess / total),
      avgConfidence: Math.round(avgConfidence / total),
    };
  }, [allMemories]);

  const typeSparkline = useMemo(
    () => [stats.byType.episodic, stats.byType.semantic, stats.byType.graph],
    [stats],
  );

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getFeedback = useCallback(
    (memoryId: string): FeedbackState => {
      return feedbackMap.get(memoryId) ?? { helpful: false, unhelpful: false };
    },
    [feedbackMap],
  );

  const handleToggleFeedback = useCallback((memoryId: string, kind: "helpful" | "unhelpful") => {
    setFeedbackMap((prev) => {
      const next = new Map(prev);
      const current = next.get(memoryId) ?? { helpful: false, unhelpful: false };
      if (kind === "helpful") {
        next.set(memoryId, { helpful: !current.helpful, unhelpful: false });
      } else {
        next.set(memoryId, { helpful: false, unhelpful: !current.unhelpful });
      }
      return next;
    });
  }, []);

  const handleResolveContradiction = useCallback(
    (contradictionId: string, _strategy: ResolveStrategy) => {
      setContradictions((prev) => prev.filter((c) => c.id !== contradictionId));
    },
    [],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Memory"
        description="Agent knowledge base — episodic and semantic memories with confidence scoring"
      />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Memories"
          value={stats.total}
          icon={Database}
          sparklineData={typeSparkline}
          sparklineColor="#a855f7"
        />
        <StatCard
          title="Avg Confidence"
          value={`${stats.avgConfidence}%`}
          icon={Shield}
          description={`Source range: ${SOURCE_CONFIDENCE.inference}%-${SOURCE_CONFIDENCE.task_completion}%`}
        />
        <StatCard title="Avg Access Count" value={stats.avgAccess} icon={TrendingUp} />
        <StatCard
          title="Semantic"
          value={stats.byType.semantic}
          icon={Brain}
          description={`${stats.byType.episodic} episodic, ${stats.byType.graph} graph`}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Source Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(stats.bySource).map(([source, count]) => (
              <div
                key={source}
                className="flex items-center justify-between rounded-lg border border-border p-2.5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${SOURCE_COLORS[source]?.split(" ")[0] ?? "bg-gray-500/10"}`}
                  />
                  <span className="text-xs capitalize">{source.replace("_", " ")}</span>
                </div>
                <span className="text-sm font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search memories..."
            value={searchQuery}
            onChange={handleChangeSearch}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="episodic">Episodic</SelectItem>
            <SelectItem value="semantic">Semantic</SelectItem>
            <SelectItem value="graph">Graph</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="task_completion">Task Completion</SelectItem>
            <SelectItem value="code_change">Code Change</SelectItem>
            <SelectItem value="observation">Observation</SelectItem>
            <SelectItem value="inference">Inference</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredMemories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Brain className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No memories match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              agentName={agentMap.get(memory.agentId) ?? "Unknown Agent"}
              feedback={getFeedback(memory.id)}
              onToggleFeedback={handleToggleFeedback}
            />
          ))
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Contradictions</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {contradictions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {contradictions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No contradictions detected
            </p>
          ) : (
            <div className="space-y-3">
              {contradictions.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          older
                        </Badge>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.olderMemoryContent}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 shrink-0 border-amber-500/30 text-amber-500"
                        >
                          newer
                        </Badge>
                        <p className="text-xs truncate">{c.newerMemoryContent}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs gap-1">
                          Resolve
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.values(ResolveStrategy).map((strategy) => (
                          <DropdownMenuItem
                            key={strategy}
                            onClick={() => handleResolveContradiction(c.id, strategy)}
                          >
                            {RESOLVE_LABELS[strategy]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Detected {formatDate(c.detectedAt)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
