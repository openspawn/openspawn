import { useState } from "react";
import {
  Webhook,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Code,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";
import { useNotifications } from "../live-notifications";
import { useDemo } from "../../demo";

enum TaskPriority {
  Low = "LOW",
  Normal = "NORMAL",
  High = "HIGH",
  Urgent = "URGENT",
}

interface InboundWebhookKeyData {
  id: string;
  name: string;
  key: string;
  secret: string;
  defaultAgentId?: string | null;
  defaultPriority?: TaskPriority | null;
  defaultTags: string[];
  enabled: boolean;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AgentData {
  id: string;
  name: string;
  agentId: string;
  status: string;
}

const MOCK_WEBHOOK_KEYS: InboundWebhookKeyData[] = [
  {
    id: "wk-1",
    name: "GitHub Actions",
    key: "whk_abc123def456ghi789",
    secret: "whsec_secret_abc123def456",
    defaultAgentId: "agent-1",
    defaultPriority: TaskPriority.Normal,
    defaultTags: ["webhook", "github-actions"],
    enabled: true,
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "wk-2",
    name: "Zapier Integration",
    key: "whk_xyz789abc123def456",
    secret: "whsec_secret_xyz789abc123",
    defaultAgentId: null,
    defaultPriority: TaskPriority.Low,
    defaultTags: ["zapier", "external"],
    enabled: false,
    lastUsedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const MOCK_AGENTS: AgentData[] = [
  { id: "agent-1", name: "Primary Agent", agentId: "agent-primary", status: "online" },
  { id: "agent-2", name: "Secondary Agent", agentId: "agent-secondary", status: "offline" },
];

interface CreateFormData {
  name: string;
  defaultAgentId?: string;
  defaultPriority?: TaskPriority;
  defaultTags: string;
}

export function InboundWebhooksSettings() {
  const { scenario } = useDemo();
  const { addNotification } = useNotifications();
  const [webhookKeys, setWebhookKeys] = useState<InboundWebhookKeyData[]>(MOCK_WEBHOOK_KEYS);
  const [agents] = useState<AgentData[]>(MOCK_AGENTS);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFormData>({
    name: "",
    defaultAgentId: undefined,
    defaultPriority: undefined,
    defaultTags: "",
  });

  const handleCreate = () => {
    if (!formData.name.trim()) return;

    const tags = formData.defaultTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newKey: InboundWebhookKeyData = {
      id: `wk-${Date.now()}`,
      name: formData.name,
      key: `whk_${Math.random().toString(36).slice(2, 22)}`,
      secret: `whsec_${Math.random().toString(36).slice(2, 22)}`,
      defaultAgentId: formData.defaultAgentId || null,
      defaultPriority: formData.defaultPriority || null,
      defaultTags: tags,
      enabled: true,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWebhookKeys((prev) => [newKey, ...prev]);
    setSelectedKey(newKey.id);

    addNotification({
      type: "success",
      title: "Webhook key created",
      message: `Created webhook key: ${formData.name}`,
    });

    setFormData({
      name: "",
      defaultAgentId: undefined,
      defaultPriority: undefined,
      defaultTags: "",
    });
    setShowCreateDialog(false);
  };

  const handleRotate = (id: string, name: string) => {
    setWebhookKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              key: `whk_${Math.random().toString(36).slice(2, 22)}`,
              secret: `whsec_${Math.random().toString(36).slice(2, 22)}`,
              updatedAt: new Date().toISOString(),
            }
          : k
      )
    );
    addNotification({
      type: "success",
      title: "Key rotated",
      message: `Rotated webhook key: ${name}`,
    });
  };

  const handleDelete = (id: string, name: string) => {
    setWebhookKeys((prev) => prev.filter((k) => k.id !== id));
    if (selectedKey === id) {
      setSelectedKey(null);
    }
    addNotification({
      type: "success",
      title: "Webhook key deleted",
      message: `Deleted webhook key: ${name}`,
    });
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    setWebhookKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, enabled: !enabled, updatedAt: new Date().toISOString() } : k))
    );
    addNotification({
      type: "success",
      title: enabled ? "Webhook key disabled" : "Webhook key enabled",
      message: `Webhook key is now ${enabled ? "disabled" : "enabled"}`,
    });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const selectedWebhookKey = webhookKeys.find((k) => k.id === selectedKey);

  const webhookUrl = selectedWebhookKey
    ? `${window.location.origin}/api/webhooks/inbound/${selectedWebhookKey.key}`
    : "";

  const curlExample = selectedWebhookKey
    ? `curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-OpenSpawn-Signature: YOUR_HMAC_SIGNATURE" \\
  -d '{
    "title": "New task from external system",
    "description": "Task description",
    "priority": "NORMAL",
    "tags": ["external", "webhook"],
    "metadata": {"source": "github"}
  }'`
    : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Inbound Webhooks
            </CardTitle>
            <CardDescription>
              Allow external services to create tasks in BikiniBottom via HTTP POST
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogPopup>
              <DialogHeader>
                <DialogTitle>Create Inbound Webhook Key</DialogTitle>
                <DialogDescription>
                  Create a new webhook key to allow external services to create tasks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="GitHub Actions, Zapier, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="defaultAgent">Default Agent (Optional)</Label>
                  <Select
                    value={formData.defaultAgentId || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, defaultAgentId: value || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No default agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No default agent</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.agentId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="defaultPriority">Default Priority (Optional)</Label>
                  <Select
                    value={formData.defaultPriority || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        defaultPriority: (value as TaskPriority) || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No default priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No default priority</SelectItem>
                      <SelectItem value={TaskPriority.Low}>Low</SelectItem>
                      <SelectItem value={TaskPriority.Normal}>Normal</SelectItem>
                      <SelectItem value={TaskPriority.High}>High</SelectItem>
                      <SelectItem value={TaskPriority.Urgent}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="defaultTags">Default Tags (Optional)</Label>
                  <Input
                    id="defaultTags"
                    value={formData.defaultTags}
                    onChange={(e) => setFormData({ ...formData, defaultTags: e.target.value })}
                    placeholder="webhook, external, automated (comma-separated)"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                  Create Key
                </Button>
              </DialogFooter>
            </DialogPopup>
          </Dialog>
        </CardHeader>
        <CardContent>
          {webhookKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhook keys yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a webhook key to allow external services to create tasks
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {webhookKeys.map((key) => (
                  <motion.div
                    key={key.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={cn(
                      "border rounded-lg p-4 transition-colors",
                      selectedKey === key.id && "border-primary bg-accent/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{key.name}</h4>
                          <Badge variant={key.enabled ? "default" : "secondary"}>
                            {key.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          {key.lastUsedAt && (
                            <span className="text-xs text-muted-foreground">
                              Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {key.defaultAgentId && (
                            <div>Default agent: {key.defaultAgentId}</div>
                          )}
                          {key.defaultPriority && (
                            <div>Default priority: {key.defaultPriority}</div>
                          )}
                          {key.defaultTags.length > 0 && (
                            <div>Default tags: {key.defaultTags.join(", ")}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedKey(selectedKey === key.id ? null : key.id)}
                        >
                          {selectedKey === key.id ? "Hide Details" : "Show Details"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleEnabled(key.id, key.enabled)}
                        >
                          {key.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogPopup>
                            <DialogHeader>
                              <DialogTitle>Rotate Webhook Key</DialogTitle>
                              <DialogDescription>
                                This will generate a new key and secret. The old key will stop working
                                immediately.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleRotate(key.id, key.name)}
                                >
                                  Rotate Key
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogPopup>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogPopup>
                            <DialogHeader>
                              <DialogTitle>Delete Webhook Key</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete "{key.name}"? This action cannot be
                                undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogClose>
                              <DialogClose asChild>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDelete(key.id, key.name)}
                                >
                                  Delete Key
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogPopup>
                        </Dialog>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedKey === key.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 space-y-4"
                        >
                          <div>
                            <Label>Webhook URL</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                value={webhookUrl}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(webhookUrl, `url-${key.id}`)}
                              >
                                {copiedField === `url-${key.id}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>API Key</Label>
                            <div className="flex gap-2 mt-1">
                              <Input value={key.key} readOnly className="font-mono text-sm" />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(key.key, `key-${key.id}`)}
                              >
                                {copiedField === `key-${key.id}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>HMAC Secret (for signature verification)</Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                type={showSecret[key.id] ? "text" : "password"}
                                value={key.secret}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setShowSecret({ ...showSecret, [key.id]: !showSecret[key.id] })
                                }
                              >
                                {showSecret[key.id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(key.secret, `secret-${key.id}`)}
                              >
                                {copiedField === `secret-${key.id}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label>Example cURL Request</Label>
                            <div className="relative mt-1">
                              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                {curlExample}
                              </pre>
                              <Button
                                variant="outline"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(curlExample, `curl-${key.id}`)}
                              >
                                {copiedField === `curl-${key.id}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <Button variant="link" size="sm" asChild>
                              <a
                                href="https://github.com/openspawn/openspawn/blob/main/docs/features/inbound-webhooks.md"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Documentation
                              </a>
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
