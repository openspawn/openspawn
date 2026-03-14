import type { AgentFieldsFragment } from "@openspawn/dashboard-data";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";

type Agent = AgentFieldsFragment;

export function SettingsTab({ agent }: { agent: Agent }) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState<string>(agent.role);
  const [domain, setDomain] = useState(agent.domain || "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = name !== agent.name || role !== agent.role || domain !== (agent.domain || "");
    setHasChanges(changed);
  }, [name, role, domain, agent]);

  const handleSave = () => {
    // DEFERRED: Agent profile edits are not yet persisted to the backend.
    // Wire to the updateAgent GraphQL mutation when available:
    //   updateAgent({ variables: { id: agent.id, name, role, domain } })
    // and call refetch() or update the Apollo cache on success.
    console.log("Saving changes (local only, not persisted):", {
      name,
      role,
      domain,
    });
    setHasChanges(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g., engineering, marketing"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setName(agent.name);
            setRole(agent.role);
            setDomain(agent.domain || "");
          }}
          disabled={!hasChanges}
        >
          Reset
        </Button>
      </div>

      {/* Read-only settings */}
      <div className="pt-6 border-t border-border space-y-3">
        <h3 className="text-sm font-medium">Read-Only Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Agent ID</p>
            <p className="font-mono">{agent.agentId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Level</p>
            <p className="font-medium">Level {agent.level}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{agent.model}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{agent.status}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
