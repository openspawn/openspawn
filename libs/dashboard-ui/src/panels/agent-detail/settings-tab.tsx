import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Slider } from "../../ui/slider";
import type { AgentDetailAgent } from "./types";

const AUTONOMY_LABELS: Record<number, string> = {
  0: "Full oversight",
  5: "Balanced",
  10: "Full autonomy",
};

function autonomyLabel(level: number): string {
  return AUTONOMY_LABELS[level] ?? `Level ${level}`;
}

interface SettingsTabProps {
  agent: AgentDetailAgent;
  onSaveSettings?: (payload: { default_autonomy_level: number }) => void;
}

export function SettingsTab({ agent, onSaveSettings }: SettingsTabProps) {
  const [name, setName] = useState(agent.name);
  const [role, setRole] = useState<string>(agent.role);
  const [domain, setDomain] = useState(agent.domain || "");
  const [autonomy, setAutonomy] = useState(agent.defaultAutonomyLevel ?? 5);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed =
      name !== agent.name ||
      role !== agent.role ||
      domain !== (agent.domain || "") ||
      autonomy !== (agent.defaultAutonomyLevel ?? 5);
    setHasChanges(changed);
  }, [name, role, domain, autonomy, agent]);

  function handleSave() {
    onSaveSettings?.({ default_autonomy_level: autonomy });
    setHasChanges(false);
  }

  function handleReset() {
    setName(agent.name);
    setRole(agent.role);
    setDomain(agent.domain || "");
    setAutonomy(agent.defaultAutonomyLevel ?? 5);
  }

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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Default Autonomy Level</label>
            <span className="text-sm text-muted-foreground">
              {autonomy} &mdash; {autonomyLabel(autonomy)}
            </span>
          </div>
          <Slider value={autonomy} onValueChange={setAutonomy} min={0} max={10} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Full oversight</span>
            <span>Full autonomy</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
          Save Changes
        </Button>
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
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
