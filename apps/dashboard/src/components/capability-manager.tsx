import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Plus,
  Trash2,
  Search,
  TrendingUp,
  Users,
  Loader2,
  Star,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "./ui/dialog";

type Proficiency = "basic" | "standard" | "expert";

interface Capability {
  id: string;
  capability: string;
  proficiency: Proficiency;
  agentId: string;
}

interface OrgCapability {
  capability: string;
  count: number;
}

interface CapabilityMatch {
  agentId: string;
  agentName: string;
  level: number;
  capability: string;
  proficiency: Proficiency;
  score: number;
}

// Mock data
const MOCK_ORG_CAPABILITIES: OrgCapability[] = [
  { capability: "code-review", count: 5 },
  { capability: "data-analysis", count: 4 },
  { capability: "writing", count: 6 },
  { capability: "research", count: 3 },
  { capability: "testing", count: 4 },
  { capability: "debugging", count: 3 },
  { capability: "documentation", count: 2 },
];

const MOCK_AGENT_CAPABILITIES: Capability[] = [
  { id: "cap-1", capability: "code-review", proficiency: "expert", agentId: "agent-1" },
  { id: "cap-2", capability: "debugging", proficiency: "standard", agentId: "agent-1" },
  { id: "cap-3", capability: "testing", proficiency: "basic", agentId: "agent-1" },
];

const MOCK_MATCHES: CapabilityMatch[] = [
  { agentId: "agent-1", agentName: "Code Reviewer", level: 6, capability: "code-review", proficiency: "expert", score: 3 },
  { agentId: "agent-2", agentName: "Senior Dev", level: 5, capability: "code-review", proficiency: "standard", score: 2 },
  { agentId: "agent-3", agentName: "Bug Hunter", level: 4, capability: "code-review", proficiency: "basic", score: 1 },
];

const proficiencyColors: Record<Proficiency, string> = {
  basic: "bg-gray-500",
  standard: "bg-cyan-500",
  expert: "bg-violet-500",
};

const proficiencyLabels: Record<Proficiency, string> = {
  basic: "Basic",
  standard: "Standard",
  expert: "Expert",
};

export function CapabilityManager({ agentId, onAgentClick }: { agentId?: string; onAgentClick?: (id: string) => void }) {
  const [orgCapabilities] = useState<OrgCapability[]>(MOCK_ORG_CAPABILITIES);
  const [agentCapabilities, setAgentCapabilities] = useState<Capability[]>(MOCK_AGENT_CAPABILITIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [newCapability, setNewCapability] = useState("");
  const [newProficiency, setNewProficiency] = useState<Proficiency>("standard");
  const [matchQuery, setMatchQuery] = useState("");
  const [matches, setMatches] = useState<CapabilityMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const filteredOrgCaps = orgCapabilities.filter((c) =>
    c.capability.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCapability = async () => {
    if (!newCapability.trim()) return;
    
    // TODO: Implement API call
    const newCap: Capability = {
      id: `cap-${Date.now()}`,
      capability: newCapability.toLowerCase().trim(),
      proficiency: newProficiency,
      agentId: agentId || "agent-1",
    };
    
    setAgentCapabilities([...agentCapabilities, newCap]);
    setNewCapability("");
    setNewProficiency("standard");
    setShowAddDialog(false);
  };

  const handleRemoveCapability = async (id: string) => {
    setRemoving(id);
    // TODO: Implement API call
    await new Promise((r) => setTimeout(r, 500));
    setAgentCapabilities(agentCapabilities.filter((c) => c.id !== id));
    setRemoving(null);
  };

  const handleSearch = async () => {
    if (!matchQuery.trim()) return;
    
    setSearching(true);
    // TODO: Implement API call
    await new Promise((r) => setTimeout(r, 800));
    setMatches(MOCK_MATCHES);
    setSearching(false);
  };

  return (
    <div className="space-y-6">
      {/* Organization Capabilities Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Organization Capabilities</CardTitle>
            </div>
            <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  Find Agents
                </Button>
              </DialogTrigger>
              <DialogPopup>
                <DialogHeader>
                  <DialogTitle>Find Agents by Capabilities</DialogTitle>
                  <DialogDescription>
                    Search for agents that match required capabilities
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={matchQuery}
                      onChange={(e) => setMatchQuery(e.target.value)}
                      placeholder="e.g., code-review, testing"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <Button onClick={handleSearch} disabled={searching}>
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {matches.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Found {matches.length} matching agent{matches.length !== 1 ? "s" : ""}
                      </p>
                      {matches.map((match) => (
                        <div
                          key={`${match.agentId}-${match.capability}`}
                          className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => onAgentClick?.(match.agentId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-xs font-bold">L{match.level}</span>
                            </div>
                            <div>
                              <p className="font-medium">{match.agentName}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{match.capability}</Badge>
                                <Badge className={proficiencyColors[match.proficiency]}>
                                  {proficiencyLabels[match.proficiency]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: match.score }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMatchDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogPopup>
            </Dialog>
          </div>
          <CardDescription>
            {orgCapabilities.length} unique capabilities across your agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter capabilities..."
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredOrgCaps.map((cap) => (
              <motion.div
                key={cap.capability}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5"
              >
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-sm font-medium">{cap.capability}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {cap.count}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Capabilities (if viewing specific agent) */}
      {agentId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <CardTitle>Agent Capabilities</CardTitle>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Capability
                  </Button>
                </DialogTrigger>
                <DialogPopup>
                  <DialogHeader>
                    <DialogTitle>Add Capability</DialogTitle>
                    <DialogDescription>
                      Add a new capability to this agent
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Capability</label>
                      <input
                        type="text"
                        value={newCapability}
                        onChange={(e) => setNewCapability(e.target.value)}
                        placeholder="e.g., code-review, data-analysis"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Proficiency</label>
                      <div className="flex gap-2">
                        {(["basic", "standard", "expert"] as Proficiency[]).map((p) => (
                          <Button
                            key={p}
                            variant={newProficiency === p ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewProficiency(p)}
                            className="flex-1 capitalize"
                          >
                            {p}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCapability} disabled={!newCapability.trim()}>
                      Add Capability
                    </Button>
                  </DialogFooter>
                </DialogPopup>
              </Dialog>
            </div>
            <CardDescription>
              {agentCapabilities.length} capabilities assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentCapabilities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No capabilities assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {agentCapabilities.map((cap) => (
                    <motion.div
                      key={cap.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{cap.capability}</p>
                          <Badge className={`${proficiencyColors[cap.proficiency]} text-foreground`}>
                            {proficiencyLabels[cap.proficiency]}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveCapability(cap.id)}
                        disabled={removing === cap.id}
                      >
                        {removing === cap.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
