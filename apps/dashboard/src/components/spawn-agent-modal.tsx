import { useState, useEffect } from "react";
import { notify } from "../lib/toast";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { SANDBOX_URL } from "../lib/sandbox-url";

const OCEAN_NAMES = [
  "Coral Reef", "Tide Walker", "Deep Current", "Shell Diver", "Wave Runner",
  "Kelp Dancer", "Sand Dollar", "Starfish", "Moon Jellyfish", "Pearl Fisher",
];

const ROLES = ["lead", "senior", "worker", "intern"] as const;
const DOMAINS = [
  "Engineering", "Finance", "Marketing", "Sales", "Support",
  "HR", "AppSec", "Content Strategy", "Frontend", "Backend", "Infrastructure",
];
const EMOJIS = ["🐡", "🦈", "🐬", "🐢", "🦑", "🐠", "🪸", "🦞", "🐚", "🦭"];
const COLORS = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a78bfa", "#ec4899"];

const ROLE_LEVEL_DEFAULTS: Record<string, number> = { lead: 7, senior: 6, worker: 4, intern: 2 };

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface SpawnAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSpawned?: (agent: { name: string }) => void;
}

export function SpawnAgentModal({ open, onOpenChange, onSpawned }: SpawnAgentModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("worker");
  const [domain, setDomain] = useState("Engineering");
  const [level, setLevel] = useState(4);
  const [avatar, setAvatar] = useState(() => randomFrom(EMOJIS));
  const [avatarColor, setAvatarColor] = useState(() => randomFrom(COLORS));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset defaults when role changes
  useEffect(() => {
    setLevel(ROLE_LEVEL_DEFAULTS[role] ?? 4);
  }, [role]);

  // Randomize on open
  useEffect(() => {
    if (open) {
      setName("");
      setRole("worker");
      setDomain("Engineering");
      setLevel(4);
      setAvatar(randomFrom(EMOJIS));
      setAvatarColor(randomFrom(COLORS));
      setError("");
    }
  }, [open]);

  const placeholder = randomFrom(OCEAN_NAMES);

  async function handleSubmit() {
    const agentName = name.trim() || placeholder;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${SANDBOX_URL}/api/agents/spawn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agentName, role, domain, level, avatar, avatarColor }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Spawn failed");
      onOpenChange(false);
      notify.agent(agentName, "spawned successfully");
      onSpawned?.({ name: agentName });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Spawn failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🐣 Spawn Agent</DialogTitle>
          <DialogDescription>Create a new agent and inject it into the simulation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Role & Domain row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Domain</label>
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Level */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Level: {level}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={level}
              onChange={e => setLevel(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Avatar & Color row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Emoji Avatar</label>
              <div className="flex flex-wrap gap-1">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setAvatar(e)}
                    className={`rounded p-1 text-lg hover:bg-border ${avatar === e ? "bg-border ring-1 ring-cyan-500" : ""}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Color</label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`h-7 w-7 rounded-full border-2 ${avatarColor === c ? "border-white" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Spawning…" : "🐣 Spawn"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
