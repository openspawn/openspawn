import { useState } from "react";
import {
  Github,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Link2,
  GitPullRequest,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogPopup,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../../lib/utils";
import { useNotifications } from "../live-notifications";
import { useDemo } from "../../demo";

interface GitHubConnectionData {
  id: string;
  name: string;
  installationId: string;
  webhookSecret: string;
  repoFilter: string[];
  enabled: boolean;
  syncConfig: {
    inbound: {
      createTaskOnIssue: boolean;
      createTaskOnPR: boolean;
      createTaskOnCheckFailure: boolean;
      requiredLabel?: string;
    };
    outbound: {
      closeIssueOnComplete: boolean;
      commentOnStatusChange: boolean;
      updateLabels: boolean;
    };
  };
  lastSyncAt?: string | null;
  lastError?: string | null;
  createdAt: string;
}

interface IntegrationLinkData {
  id: string;
  provider: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const MOCK_CONNECTIONS: GitHubConnectionData[] = [
  {
    id: "ghc-1",
    name: "openspawn/core",
    installationId: "12345678",
    webhookSecret: "whsec_abc123def456",
    repoFilter: ["openspawn/core", "openspawn/dashboard"],
    enabled: true,
    syncConfig: {
      inbound: {
        createTaskOnIssue: true,
        createTaskOnPR: true,
        createTaskOnCheckFailure: true,
        requiredLabel: "agent-work",
      },
      outbound: {
        closeIssueOnComplete: true,
        commentOnStatusChange: true,
        updateLabels: true,
      },
    },
    lastSyncAt: new Date(Date.now() - 300000).toISOString(),
    lastError: null,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "ghc-2",
    name: "openspawn/docs",
    installationId: "87654321",
    webhookSecret: "whsec_xyz789",
    repoFilter: [],
    enabled: false,
    syncConfig: {
      inbound: {
        createTaskOnIssue: true,
        createTaskOnPR: false,
        createTaskOnCheckFailure: false,
      },
      outbound: {
        closeIssueOnComplete: true,
        commentOnStatusChange: false,
        updateLabels: false,
      },
    },
    lastSyncAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    lastError: "Token expired",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];

const MOCK_LINKS: IntegrationLinkData[] = [
  {
    id: "link-1",
    provider: "github",
    sourceType: "github_issue",
    sourceId: "42",
    targetType: "task",
    targetId: "task-abc-123",
    metadata: { title: "Fix authentication bug", url: "https://github.com/openspawn/core/issues/42", repo: "openspawn/core" },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "link-2",
    provider: "github",
    sourceType: "github_pr",
    sourceId: "87",
    targetType: "task",
    targetId: "task-def-456",
    metadata: { title: "Add rate limiting middleware", url: "https://github.com/openspawn/core/pull/87", repo: "openspawn/core" },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "link-3",
    provider: "github",
    sourceType: "github_issue",
    sourceId: "55",
    targetType: "task",
    targetId: "task-ghi-789",
    metadata: { title: "Upgrade TypeORM to v0.4", url: "https://github.com/openspawn/core/issues/55", repo: "openspawn/core" },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function GitHubSettings() {
  const { scenario } = useDemo();
  const { addNotification } = useNotifications();
  const [connections, setConnections] = useState<GitHubConnectionData[]>(MOCK_CONNECTIONS);
  const [links] = useState<IntegrationLinkData[]>(MOCK_LINKS);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState("");
  const [newInstallationId, setNewInstallationId] = useState("");
  const [newRepoFilter, setNewRepoFilter] = useState("");

  const handleCreate = () => {
    if (!newName || !newInstallationId) return;
    setIsCreating(true);
    setTimeout(() => {
      const conn: GitHubConnectionData = {
        id: `ghc-${Date.now()}`,
        name: newName,
        installationId: newInstallationId,
        webhookSecret: `whsec_${Math.random().toString(36).slice(2, 18)}`,
        repoFilter: newRepoFilter ? newRepoFilter.split(",").map((s) => s.trim()) : [],
        enabled: true,
        syncConfig: {
          inbound: {
            createTaskOnIssue: true,
            createTaskOnPR: true,
            createTaskOnCheckFailure: true,
            requiredLabel: "agent-work",
          },
          outbound: {
            closeIssueOnComplete: true,
            commentOnStatusChange: true,
            updateLabels: true,
          },
        },
        createdAt: new Date().toISOString(),
      };
      setConnections((prev) => [conn, ...prev]);
      setNewName("");
      setNewInstallationId("");
      setNewRepoFilter("");
      setIsCreating(false);
      addNotification({
        type: "success",
        title: "GitHub connection created",
        message: `Connected to ${conn.name}`,
      });
    }, 800);
  };

  const handleDelete = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    addNotification({
      type: "info",
      title: "Connection removed",
      message: "GitHub connection has been deleted",
    });
  };

  const handleToggle = (id: string) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/github/webhook`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
                <Github className="h-5 w-5 text-white dark:text-zinc-900" />
              </div>
              <div>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>
                  Bidirectional sync between GitHub issues/PRs and OpenSpawn tasks
                </CardDescription>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Connection
                </Button>
              </DialogTrigger>
              <DialogPopup>
                <DialogHeader>
                  <DialogTitle>New GitHub Connection</DialogTitle>
                  <DialogDescription>
                    Connect a GitHub App installation to sync issues and PRs
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Connection Name</Label>
                    <Input
                      placeholder="e.g., openspawn/core"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Installation ID</Label>
                    <Input
                      placeholder="GitHub App installation ID"
                      value={newInstallationId}
                      onChange={(e) => setNewInstallationId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Repository Filter (optional)</Label>
                    <Input
                      placeholder="owner/repo, owner/repo2"
                      value={newRepoFilter}
                      onChange={(e) => setNewRepoFilter(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated. Leave empty to sync all repos.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex items-center gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(webhookUrl, "webhook-url")}
                      >
                        {copiedId === "webhook-url" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add this URL in your GitHub App webhook settings
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleCreate} disabled={isCreating || !newName || !newInstallationId}>
                      {isCreating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      Create Connection
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogPopup>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Connections */}
      <AnimatePresence mode="popLayout">
        {connections.map((conn, i) => (
          <motion.div
            key={conn.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn(!conn.enabled && "opacity-60")}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      <span className="font-semibold">{conn.name}</span>
                      <Badge variant={conn.enabled ? "default" : "secondary"}>
                        {conn.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {conn.lastError && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Installation: {conn.installationId}</span>
                      <span>•</span>
                      <span>
                        Repos: {conn.repoFilter.length > 0 ? conn.repoFilter.join(", ") : "All"}
                      </span>
                      {conn.lastSyncAt && (
                        <>
                          <span>•</span>
                          <span>Last sync: {new Date(conn.lastSyncAt).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                    {conn.lastError && (
                      <p className="text-xs text-destructive">{conn.lastError}</p>
                    )}

                    {/* Sync config badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {conn.syncConfig.inbound.createTaskOnIssue && (
                        <Badge variant="outline" className="text-xs">
                          Issues → Tasks
                        </Badge>
                      )}
                      {conn.syncConfig.inbound.createTaskOnPR && (
                        <Badge variant="outline" className="text-xs">
                          PRs → Tasks
                        </Badge>
                      )}
                      {conn.syncConfig.outbound.closeIssueOnComplete && (
                        <Badge variant="outline" className="text-xs">
                          Tasks → Close Issues
                        </Badge>
                      )}
                      {conn.syncConfig.outbound.commentOnStatusChange && (
                        <Badge variant="outline" className="text-xs">
                          Status → Comments
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(conn.id)}
                    >
                      {conn.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(conn.webhookSecret, `secret-${conn.id}`)
                      }
                    >
                      {copiedId === `secret-${conn.id}` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogPopup>
                        <DialogHeader>
                          <DialogTitle>Delete Connection</DialogTitle>
                          <DialogDescription>
                            Remove the GitHub connection "{conn.name}"? This will stop all syncing.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={() => handleDelete(conn.id)}
                            >
                              Delete
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogPopup>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {connections.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Github className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No GitHub connections</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add a GitHub App connection to start syncing issues and PRs
            </p>
          </CardContent>
        </Card>
      )}

      {/* Linked Items */}
      {links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Linked Items
            </CardTitle>
            <CardDescription>
              Active links between GitHub and OpenSpawn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {links.map((link, i) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {link.sourceType === "github_pr" ? (
                        <GitPullRequest className="h-4 w-4 text-purple-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {(link.metadata.title as string) || `#${link.sourceId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {link.sourceType === "github_pr" ? "PR" : "Issue"} #{link.sourceId} →{" "}
                          {link.targetType} {link.targetId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {(link.metadata.repo as string) || "unknown"}
                      </Badge>
                      {link.metadata.url && (
                        <a
                          href={link.metadata.url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
