import { useState } from "react";
import {
  Webhook,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  Clock,
  Shield,
  ShieldOff,
  Play,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
} from "../ui/dialog";
import { cn } from "../../lib/utils";
import { useNotifications } from "../live-notifications";

interface WebhookData {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  hookType: "pre" | "post";
  canBlock: boolean;
  timeoutMs: number;
  failureCount: number;
  lastTriggeredAt: string | null;
  lastError: string | null;
  createdAt: string;
}

// Available event types for webhooks
const EVENT_TYPES = [
  { value: "task.transition", label: "Task Transitions", description: "When tasks change status" },
  { value: "task.created", label: "Task Created", description: "When new tasks are created" },
  { value: "task.assigned", label: "Task Assigned", description: "When tasks are assigned" },
  { value: "agent.spawned", label: "Agent Spawned", description: "When new agents are created" },
  { value: "credit.spent", label: "Credit Spent", description: "When credits are spent" },
  { value: "*", label: "All Events", description: "Receive all event types" },
];

// Mock data for demo
const MOCK_WEBHOOKS: WebhookData[] = [
  {
    id: "1",
    name: "Compliance Check",
    url: "https://compliance.example.com/webhook",
    events: ["task.transition"],
    enabled: true,
    hookType: "pre",
    canBlock: true,
    timeoutMs: 5000,
    failureCount: 0,
    lastTriggeredAt: new Date(Date.now() - 3600000).toISOString(),
    lastError: null,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "2",
    name: "Slack Notifications",
    url: "https://hooks.slack.com/services/xxx",
    events: ["task.created", "task.transition"],
    enabled: true,
    hookType: "post",
    canBlock: false,
    timeoutMs: 10000,
    failureCount: 0,
    lastTriggeredAt: new Date(Date.now() - 1800000).toISOString(),
    lastError: null,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "3",
    name: "Budget Guard",
    url: "https://budget.internal/check",
    events: ["credit.spent"],
    enabled: true,
    hookType: "pre",
    canBlock: true,
    timeoutMs: 3000,
    failureCount: 2,
    lastTriggeredAt: new Date(Date.now() - 7200000).toISOString(),
    lastError: "Connection timeout",
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export function WebhooksSettings() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>(MOCK_WEBHOOKS);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
    hookType: "post" as "pre" | "post",
    canBlock: false,
    timeoutMs: 5000,
  });

  const handleCreateWebhook = async () => {
    setIsCreating(true);
    // TODO: Implement actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newWebhook: WebhookData = {
      id: Math.random().toString(36).substring(2),
      name: formData.name,
      url: formData.url,
      events: formData.events,
      enabled: true,
      hookType: formData.hookType,
      canBlock: formData.canBlock,
      timeoutMs: formData.timeoutMs,
      failureCount: 0,
      lastTriggeredAt: null,
      lastError: null,
      createdAt: new Date().toISOString(),
    };

    setWebhooks([newWebhook, ...webhooks]);
    setIsCreating(false);
    handleCloseDialog();

    addNotification({
      type: "success",
      title: "Webhook Created",
      message: `${formData.hookType === "pre" ? "Pre-hook" : "Webhook"} "${formData.name}" created successfully`,
    });
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    setWebhooks(webhooks.filter((w) => w.id !== id));
    addNotification({
      type: "info",
      title: "Webhook Deleted",
    });
  };

  const handleToggleEnabled = async (id: string) => {
    setWebhooks(
      webhooks.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleTestWebhook = async (webhook: WebhookData) => {
    addNotification({
      type: "info",
      title: "Testing Webhook",
      message: `Sending test event to ${webhook.name}...`,
    });

    // Simulate test
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (webhook.hookType === "pre" && webhook.canBlock) {
      // Simulate a blocking response for demo
      addNotification({
        type: "warning",
        title: "Pre-Hook Response",
        message: `${webhook.name} returned: allow=true (would not block)`,
      });
    } else {
      addNotification({
        type: "success",
        title: "Webhook Delivered",
        message: `Test event sent to ${webhook.name} successfully`,
      });
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setFormData({
      name: "",
      url: "",
      events: [],
      hookType: "post",
      canBlock: false,
      timeoutMs: 5000,
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const toggleEvent = (event: string) => {
    if (formData.events.includes(event)) {
      setFormData({ ...formData, events: formData.events.filter((e) => e !== event) });
    } else {
      // If selecting "all", clear others. If selecting specific, remove "all"
      if (event === "*") {
        setFormData({ ...formData, events: ["*"] });
      } else {
        setFormData({
          ...formData,
          events: [...formData.events.filter((e) => e !== "*"), event],
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Configure webhooks and pre-hooks for external integrations
          </CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogPopup className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook to receive events or a pre-hook to approve/block actions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Hook Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hook Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFormData({ ...formData, hookType: "post", canBlock: false })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      formData.hookType === "post"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <Zap className={cn("h-6 w-6", formData.hookType === "post" ? "text-primary" : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="font-medium">Post-Hook</p>
                      <p className="text-xs text-muted-foreground">Fires after action</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, hookType: "pre" })}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      formData.hookType === "pre"
                        ? "border-amber-500 bg-amber-500/5"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <Shield className={cn("h-6 w-6", formData.hookType === "pre" ? "text-amber-500" : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="font-medium">Pre-Hook</p>
                      <p className="text-xs text-muted-foreground">Fires before, can block</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Can Block Toggle (only for pre-hooks) */}
              {formData.hookType === "pre" && (
                <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Blocking Hook</p>
                      <p className="text-xs text-muted-foreground">
                        Can prevent actions if it returns allow: false
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, canBlock: !formData.canBlock })}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      formData.canBlock ? "bg-amber-500" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        formData.canBlock ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="e.g., Compliance Check"
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="https://your-server.com/webhook"
                />
              </div>

              {/* Events */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Events</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((event) => (
                    <button
                      key={event.value}
                      onClick={() => toggleEvent(event.value)}
                      title={event.description}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                        formData.events.includes(event.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {event.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeout (for pre-hooks) */}
              {formData.hookType === "pre" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeout
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1000}
                      max={30000}
                      step={1000}
                      value={formData.timeoutMs}
                      onChange={(e) =>
                        setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })
                      }
                      className="flex-1"
                    />
                    <span className="w-16 text-sm text-muted-foreground tabular-nums">
                      {formData.timeoutMs / 1000}s
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If webhook doesn't respond within timeout, action proceeds (fail-open)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateWebhook}
                disabled={!formData.name || !formData.url || formData.events.length === 0 || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Webhook className="mr-2 h-4 w-4" />
                )}
                Create {formData.hookType === "pre" ? "Pre-Hook" : "Webhook"}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </CardHeader>

      <CardContent>
        {webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Webhook className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No webhooks configured</p>
            <p className="text-sm text-muted-foreground">
              Add a webhook to receive events or block actions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className={cn(
                  "rounded-lg border transition-all",
                  webhook.enabled
                    ? webhook.hookType === "pre"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border"
                    : "border-border bg-muted/30 opacity-60"
                )}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleEnabled(webhook.id)}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors flex-shrink-0",
                        webhook.enabled
                          ? webhook.hookType === "pre"
                            ? "bg-amber-500"
                            : "bg-primary"
                          : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                          webhook.enabled ? "translate-x-4" : "translate-x-0.5"
                        )}
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{webhook.name}</p>
                        <Badge
                          variant={webhook.hookType === "pre" ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            webhook.hookType === "pre" && "bg-amber-500 hover:bg-amber-600"
                          )}
                        >
                          {webhook.hookType === "pre" ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Pre-Hook
                            </>
                          ) : (
                            "Post"
                          )}
                        </Badge>
                        {webhook.hookType === "pre" && webhook.canBlock && (
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                            Blocking
                          </Badge>
                        )}
                        {webhook.failureCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {webhook.failureCount} failures
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span className="font-mono text-xs truncate max-w-[200px]">
                          {webhook.url}
                        </span>
                        {webhook.lastTriggeredAt && (
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDate(webhook.lastTriggeredAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestWebhook(webhook)}
                      title="Send test event"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedId(expandedId === webhook.id ? null : webhook.id)
                      }
                    >
                      {expandedId === webhook.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === webhook.id && (
                  <div className="border-t border-border/50 p-4 space-y-3 bg-background/50">
                    <div className="flex flex-wrap gap-1.5">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event === "*" ? "All Events" : event}
                        </Badge>
                      ))}
                    </div>

                    {webhook.hookType === "pre" && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Timeout: {webhook.timeoutMs / 1000}s
                        </span>
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {webhook.canBlock ? (
                            <>
                              <Shield className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600">Can block actions</span>
                            </>
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4" />
                              Non-blocking
                            </>
                          )}
                        </span>
                      </div>
                    )}

                    {webhook.lastError && (
                      <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-destructive">{webhook.lastError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pre-Hook Info Box */}
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                About Pre-Hooks
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Pre-hooks fire <strong>before</strong> an action occurs. If configured as blocking,
                they can prevent the action by returning <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs">{"{ allow: false, reason: '...' }"}</code>.
                This is useful for compliance checks, budget approvals, or custom business rules.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
