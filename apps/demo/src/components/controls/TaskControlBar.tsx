/**
 * TaskControlBar — floating action bar at the bottom of the dashboard.
 * Hire Agent, Escalate, View Plan buttons.
 */

import { useState } from "react";
import { DEPARTMENTS, type Department } from "./types";
import { ModalContainer } from "../ui/modal-container";
import { ActionButton } from "../ui/action-button";

interface TaskControlBarProps {
  onHire: (role: string, department: Department, modelTier: "sonnet" | "opus") => void;
  onEscalate: () => void;
  onViewPlan: () => void;
}

function HireModal({
  onHire,
  onClose,
}: {
  onHire: TaskControlBarProps["onHire"];
  onClose: () => void;
}) {
  const [role, setRole] = useState("");
  const [dept, setDept] = useState<Department>("Kitchen Ops");
  const [tier, setTier] = useState<"sonnet" | "opus">("sonnet");

  return (
    <ModalContainer intent="default" size="sm" onClose={onClose}>
      <div className="text-base font-bold mb-4 text-bb-ocean-400 font-display">
        🐟 Hire New Agent
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold mb-1 text-bb-ocean-200/50 font-body">
            ROLE NAME
          </label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Sous Chef, Courier..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-bb-ocean-400/[0.08] border border-bb-ocean-400/20 text-bb-ocean-200 font-body"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold mb-1 text-bb-ocean-200/50 font-body">
            DEPARTMENT
          </label>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value as Department)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer bg-bb-ocean-400/[0.08] border border-bb-ocean-400/20 text-bb-ocean-200 font-body"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold mb-1 text-bb-ocean-200/50 font-body">
            MODEL TIER
          </label>
          <div className="flex gap-2">
            {(["sonnet", "opus"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold font-body transition-all duration-200 border ${
                  tier === t
                    ? "bg-indigo-400/25 border-indigo-400/50 text-indigo-400"
                    : "bg-transparent border-indigo-400/15 text-bb-ocean-200/40"
                }`}
              >
                {t === "sonnet" ? "⚡ Sonnet" : "🧠 Opus"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <ActionButton intent="ocean" size="lg" fullWidth onClick={onClose}>
          Cancel
        </ActionButton>
        <ActionButton
          intent="kelp"
          size="lg"
          fullWidth
          className="font-bold"
          disabled={!role.trim()}
          onClick={() => {
            if (!role.trim()) return;
            console.log(`[TaskControl] hire: role=${role}, dept=${dept}, tier=${tier}`);
            onHire(role, dept, tier);
            onClose();
          }}
        >
          Hire 🐟
        </ActionButton>
      </div>
    </ModalContainer>
  );
}

function PlanModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalContainer intent="default" size="lg" onClose={onClose}>
      <div className="flex items-center justify-between p-4 border-b border-bb-ocean-400/[0.12]">
        <div className="text-base font-bold text-bb-sandy-400 font-display">📋 PLAN.md</div>
        <button
          onClick={onClose}
          className="text-bb-ocean-200/40 hover:text-bb-ocean-200 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="text-xs whitespace-pre-wrap leading-[1.6] text-bb-ocean-200 font-body">
          {`# Operation Krabby Patty — Master Plan

## Phase 1: Kitchen Scale-Up
- [x] Hire 20 sous-chef sub-agents
- [x] Sandy architects the pipeline
- [x] Karen optimizes grill throughput

## Phase 2: Delivery Infrastructure
- [ ] Squidward coordinates delivery routes
- [ ] Barnacle Boy manages overflow queue
- [ ] Scale delivery fleet as needed

## Phase 3: Financial Controls
- [ ] Squilliam monitors burn rate
- [ ] Plankton audits margins
- [ ] Mrs. Puff handles compliance

## Escalation Policy
1. Queue > 1000 → reassign idle agents
2. Queue > 2000 → spawn more sub-agents
3. Budget > 85% → alert Mr. Krabs
4. Agent overwhelmed → auto-redistribute`}
        </pre>
      </div>
    </ModalContainer>
  );
}

export function TaskControlBar({ onHire, onEscalate, onViewPlan }: TaskControlBarProps) {
  const [showHire, setShowHire] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-bb-ocean-900/90 border border-bb-ocean-400/20 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_16px_rgba(74,174,217,0.08)] animate-[slide-up_0.3s_ease-out]">
        <ActionButton
          intent="kelp"
          size="md"
          className="hover:scale-105"
          onClick={() => setShowHire(true)}
        >
          <span>🐟</span> Hire Agent
        </ActionButton>

        <ActionButton
          intent="sandy"
          size="md"
          className="hover:scale-105"
          onClick={() => {
            console.log("[TaskControl] escalate: sending to CEO");
            onEscalate();
          }}
        >
          <span>🚨</span> Escalate
        </ActionButton>

        <ActionButton
          intent="ocean"
          size="md"
          className="hover:scale-105"
          onClick={() => {
            console.log("[TaskControl] view-plan");
            onViewPlan();
            setShowPlan(true);
          }}
        >
          <span>📋</span> View Plan
        </ActionButton>
      </div>

      {showHire && <HireModal onHire={onHire} onClose={() => setShowHire(false)} />}
      {showPlan && <PlanModal onClose={() => setShowPlan(false)} />}
    </>
  );
}
