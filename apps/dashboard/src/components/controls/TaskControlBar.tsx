/**
 * TaskControlBar — floating action bar at the bottom of the dashboard.
 * Hire Agent, Escalate, View Plan buttons.
 */

import { useState } from "react";
import { DEPARTMENTS, type Department } from "./types";

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ animation: "fade-in 0.15s ease-out" }}
    >
      <div className="absolute inset-0 bg-[rgba(3,14,26,0.6)]" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "linear-gradient(180deg, rgba(6,42,69,0.98) 0%, rgba(3,14,26,0.99) 100%)",
          border: "1px solid rgba(74,174,217,0.25)",
          boxShadow: "0 0 40px rgba(74,174,217,0.1)",
          animation: "scale-in 0.2s ease-out",
        }}
      >
        <div
          className="text-base font-bold mb-4"
          style={{ color: "#4AAED9", fontFamily: '"Baloo 2", cursive' }}
        >
          🐟 Hire New Agent
        </div>

        <div className="space-y-3">
          <div>
            <label
              className="block text-[11px] font-semibold mb-1"
              style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
            >
              ROLE NAME
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Sous Chef, Courier..."
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "rgba(74,174,217,0.08)",
                border: "1px solid rgba(74,174,217,0.2)",
                color: "#B8E4F7",
                fontFamily: "Nunito, sans-serif",
              }}
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold mb-1"
              style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
            >
              DEPARTMENT
            </label>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as Department)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{
                background: "rgba(74,174,217,0.08)",
                border: "1px solid rgba(74,174,217,0.2)",
                color: "#B8E4F7",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold mb-1"
              style={{ color: "rgba(184,228,247,0.5)", fontFamily: "Nunito, sans-serif" }}
            >
              MODEL TIER
            </label>
            <div className="flex gap-2">
              {(["sonnet", "opus"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    background: tier === t ? "rgba(99,102,241,0.25)" : "transparent",
                    border: `1px solid ${tier === t ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.15)"}`,
                    color: tier === t ? "#818CF8" : "rgba(184,228,247,0.4)",
                    fontFamily: "Nunito, sans-serif",
                  }}
                >
                  {t === "sonnet" ? "⚡ Sonnet" : "🧠 Opus"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: "rgba(74,174,217,0.1)",
              border: "1px solid rgba(74,174,217,0.2)",
              color: "#B8E4F7",
              fontFamily: "Nunito, sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!role.trim()) return;
              console.log(`[TaskControl] hire: role=${role}, dept=${dept}, tier=${tier}`);
              onHire(role, dept, tier);
              onClose();
            }}
            disabled={!role.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
            style={{
              background: "rgba(74,232,138,0.15)",
              border: "1px solid rgba(74,232,138,0.3)",
              color: "#4AE88A",
              fontFamily: "Nunito, sans-serif",
            }}
          >
            Hire 🐟
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ animation: "fade-in 0.15s ease-out" }}
    >
      <div className="absolute inset-0 bg-[rgba(3,14,26,0.6)]" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[80vh] rounded-2xl flex flex-col"
        style={{
          background: "linear-gradient(180deg, rgba(6,42,69,0.98) 0%, rgba(3,14,26,0.99) 100%)",
          border: "1px solid rgba(74,174,217,0.25)",
          boxShadow: "0 0 40px rgba(74,174,217,0.1)",
          animation: "scale-in 0.2s ease-out",
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[rgba(74,174,217,0.12)]">
          <div
            className="text-base font-bold"
            style={{ color: "#F4C542", fontFamily: '"Baloo 2", cursive' }}
          >
            📋 PLAN.md
          </div>
          <button
            onClick={onClose}
            className="text-[rgba(184,228,247,0.4)] hover:text-[#B8E4F7] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <pre
            className="text-xs whitespace-pre-wrap"
            style={{ color: "#B8E4F7", fontFamily: "Nunito, sans-serif", lineHeight: 1.6 }}
          >
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
      </div>
    </div>
  );
}

export function TaskControlBar({ onHire, onEscalate, onViewPlan }: TaskControlBarProps) {
  const [showHire, setShowHire] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  return (
    <>
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
        style={{
          background: "rgba(6,42,69,0.9)",
          border: "1px solid rgba(74,174,217,0.2)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 16px rgba(74,174,217,0.08)",
          animation: "slide-up 0.3s ease-out",
        }}
      >
        <button
          onClick={() => setShowHire(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
          style={{
            background: "rgba(74,232,138,0.12)",
            border: "1px solid rgba(74,232,138,0.25)",
            color: "#4AE88A",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          <span>🐟</span> Hire Agent
        </button>

        <button
          onClick={() => {
            console.log("[TaskControl] escalate: sending to CEO");
            onEscalate();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
          style={{
            background: "rgba(244,197,66,0.12)",
            border: "1px solid rgba(244,197,66,0.25)",
            color: "#F4C542",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          <span>🚨</span> Escalate
        </button>

        <button
          onClick={() => {
            console.log("[TaskControl] view-plan");
            onViewPlan();
            setShowPlan(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
          style={{
            background: "rgba(74,174,217,0.12)",
            border: "1px solid rgba(74,174,217,0.25)",
            color: "#4AAED9",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          <span>📋</span> View Plan
        </button>
      </div>

      {showHire && <HireModal onHire={onHire} onClose={() => setShowHire(false)} />}
      {showPlan && <PlanModal onClose={() => setShowPlan(false)} />}
    </>
  );
}
