import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Check,
  X,
  Clock,
  Users,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface PendingAgent {
  id: string;
  agentId: string;
  name: string;
  level: number;
  parentId: string | null;
  createdAt: string;
}

interface CapacityInfo {
  canSpawn: boolean;
  current: number;
  max: number;
  reason?: string;
}

// Mock data for demo
const MOCK_PENDING: PendingAgent[] = [
  {
    id: "pending-1",
    agentId: "analyst-01",
    name: "Data Analyst",
    level: 2,
    parentId: "agent-1",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "pending-2",
    agentId: "writer-03",
    name: "Content Writer",
    level: 1,
    parentId: "agent-2",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const MOCK_CAPACITY: CapacityInfo = {
  canSpawn: true,
  current: 3,
  max: 5,
};

export function AgentOnboarding() {
  const [pending, setPending] = useState<PendingAgent[]>(MOCK_PENDING);
  const [capacity] = useState<CapacityInfo>(MOCK_CAPACITY);
  const [activating, setActivating] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const handleActivate = async (id: string) => {
    setActivating(id);
    // TODO: Implement API call
    await new Promise((r) => setTimeout(r, 1000));
    setPending(pending.filter((p) => p.id !== id));
    setActivating(null);
  };

  const handleReject = async (id: string) => {
    setRejecting(id);
    // TODO: Implement API call
    await new Promise((r) => setTimeout(r, 1000));
    setPending(pending.filter((p) => p.id !== id));
    setRejecting(null);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Capacity Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Spawn Capacity</CardTitle>
            </div>
            <Badge variant={capacity.canSpawn ? "default" : "destructive"}>
              {capacity.current}/{capacity.max}
            </Badge>
          </div>
          <CardDescription>
            {capacity.canSpawn
              ? `You can spawn ${capacity.max - capacity.current} more agents`
              : capacity.reason || "At capacity"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full rounded-full bg-secondary">
            <motion.div
              className="h-2 rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(capacity.current / capacity.max) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Agents */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle>Pending Activation</CardTitle>
          </div>
          <CardDescription>
            {pending.length} agent{pending.length !== 1 ? "s" : ""} awaiting your approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Check className="h-12 w-12 text-emerald-500/50 mb-4" />
              <p className="text-muted-foreground">No pending agents</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pending.map((agent) => (
                  <motion.div
                    key={agent.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                        <UserPlus className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{agent.name}</span>
                          <Badge variant="outline" className="text-xs">
                            L{agent.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {agent.agentId} · {formatTime(agent.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleReject(agent.id)}
                        disabled={rejecting === agent.id || activating === agent.id}
                      >
                        {rejecting === agent.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleActivate(agent.id)}
                        disabled={activating === agent.id || rejecting === agent.id}
                      >
                        {activating === agent.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Activate
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
