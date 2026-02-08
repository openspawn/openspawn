import { useState } from "react";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogPopup, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// Mock data for demo
const MOCK_API_KEYS: ApiKey[] = [
  {
    id: "1",
    name: "Production API",
    keyPrefix: "osp_a1b2c3d4",
    scopes: ["read", "write"],
    lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
    expiresAt: null,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "2",
    name: "Development",
    keyPrefix: "osp_e5f6g7h8",
    scopes: ["read"],
    lastUsedAt: null,
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export function ApiKeySettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(MOCK_API_KEYS);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCreateKey = async () => {
    setIsCreating(true);
    // TODO: Implement actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockSecret = `osp_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    setNewKeySecret(mockSecret);
    
    const newKey: ApiKey = {
      id: Math.random().toString(),
      name: newKeyName,
      keyPrefix: mockSecret.substring(0, 12),
      scopes: newKeyScopes,
      lastUsedAt: null,
      expiresAt: null,
      createdAt: new Date().toISOString(),
    };
    
    setApiKeys([newKey, ...apiKeys]);
    setIsCreating(false);
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }
    setApiKeys(apiKeys.filter((k) => k.id !== id));
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setNewKeyName("");
    setNewKeyScopes(["read"]);
    setNewKeySecret(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage API keys for programmatic access
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
            {newKeySecret ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy your API key now. You won't be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                <div className="my-4 rounded-lg bg-muted p-4">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm break-all">{newKeySecret}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyKey(newKeySecret)}
                    >
                      {copiedKey === newKeySecret ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseDialog}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for programmatic access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholder="e.g., Production API"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scopes</label>
                    <div className="flex flex-wrap gap-2">
                      {["read", "write", "admin"].map((scope) => (
                        <button
                          key={scope}
                          onClick={() => {
                            if (newKeyScopes.includes(scope)) {
                              setNewKeyScopes(newKeyScopes.filter((s) => s !== scope));
                            } else {
                              setNewKeyScopes([...newKeyScopes, scope]);
                            }
                          }}
                          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                            newKeyScopes.includes(scope)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {scope}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      read = view data, write = modify data, admin = full access
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={!newKeyName || newKeyScopes.length === 0 || isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="mr-2 h-4 w-4" />
                    )}
                    Create Key
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogPopup>
        </Dialog>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Key className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No API keys yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first API key to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{key.name}</p>
                    <div className="flex gap-1">
                      {key.scopes.map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">{key.keyPrefix}...</span>
                    <span>Created {formatDate(key.createdAt)}</span>
                    {key.lastUsedAt && (
                      <span>Last used {formatDate(key.lastUsedAt)}</span>
                    )}
                    {key.expiresAt && (
                      <span className="text-amber-500">
                        Expires {formatDate(key.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRevokeKey(key.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
