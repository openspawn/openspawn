import { useState } from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { EmptyState } from "../components/ui/empty-state";
import { PageHeader } from "../components/ui/page-header";
import { StatCard } from "../components/ui/stat-card";
import { useApprovals, useApproveApproval, useRejectApproval } from "@openspawn/dashboard-data";

function formatTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getRiskBadgeVariant(risk: number) {
  if (risk >= 7) return "destructive" as const;
  if (risk >= 4) return "warning" as const;
  return "secondary" as const;
}

interface ApprovalData {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  risk_level: number;
  autonomy_level: number;
  status: string;
  requested_by: string;
  notes: string | null;
  created_at: string;
}

function ApprovalRow({ approval }: { approval: ApprovalData }) {
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const approveAction = useApproveApproval(approval.id);
  const rejectAction = useRejectApproval(approval.id);

  const isPending = approval.status === "pending";

  function handleApprove() {
    approveAction.mutate(undefined);
  }

  function handleReject() {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (rejectNotes.trim()) {
      rejectAction.mutate(rejectNotes.trim());
      setShowRejectInput(false);
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b border-border hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant={getRiskBadgeVariant(approval.risk_level)} className="text-xs">
            risk {approval.risk_level}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {approval.action_type}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatTime(approval.created_at)}</span>
        </div>
        <p className="text-sm">
          <span className="font-medium">{approval.entity_type}</span>
          <span className="text-muted-foreground"> · autonomy {approval.autonomy_level}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isPending ? (
          <>
            {showRejectInput && (
              <Input
                placeholder="Reason..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-40 h-8 text-xs"
                autoFocus
              />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={rejectAction.isPending || (showRejectInput && !rejectNotes.trim())}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Reject
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={approveAction.isPending}>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approve
            </Button>
          </>
        ) : (
          <Badge variant={approval.status === "approved" ? "success" : "destructive"}>
            {approval.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

export function ApprovalsPage() {
  const [tab, setTab] = useState("pending");
  const statusFilter = tab === "all" ? undefined : tab;
  const { data, isLoading, error } = useApprovals(statusFilter);

  const approvals = ((data as Record<string, unknown>)?.data ?? []) as ApprovalData[];
  const total =
    ((data as Record<string, unknown>)?.meta as Record<string, number> | undefined)?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading approvals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-destructive">Error loading approvals</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" description="Review and approve gated agent actions" />

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={total} icon={ShieldCheck} />
        <StatCard
          title="Pending"
          value={tab === "pending" ? total : "—"}
          icon={Clock}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            {approvals.length === 0 ? (
              <EmptyState
                variant="tasks"
                title="No approvals"
                description={
                  tab === "pending"
                    ? "No actions are waiting for approval. Agents are operating within their autonomy levels."
                    : "No approvals match this filter."
                }
                compact
              />
            ) : (
              approvals.map((approval) => <ApprovalRow key={approval.id} approval={approval} />)
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
