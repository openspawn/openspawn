import { describe, expect, it } from "vitest";

import {
  AgentMode,
  isModeAllowed,
  MODE_ALLOWED_ACTIONS,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
} from "./agent-mode.enum";

describe("AgentMode Enum", () => {
  describe("enum values", () => {
    it("should have WORKER mode", () => {
      expect(AgentMode.WORKER).toBe("worker");
    });

    it("should have ORCHESTRATOR mode", () => {
      expect(AgentMode.ORCHESTRATOR).toBe("orchestrator");
    });

    it("should have OBSERVER mode", () => {
      expect(AgentMode.OBSERVER).toBe("observer");
    });

    it("should have exactly 3 modes", () => {
      const modes = Object.values(AgentMode);
      expect(modes).toHaveLength(3);
      expect(modes).toContain("worker");
      expect(modes).toContain("orchestrator");
      expect(modes).toContain("observer");
    });
  });

  describe("MODE_ALLOWED_ACTIONS", () => {
    it("should give WORKER wildcard access", () => {
      const workerActions = MODE_ALLOWED_ACTIONS[AgentMode.WORKER];
      expect(workerActions).toContain("*");
    });

    it("should give ORCHESTRATOR coordination actions", () => {
      const actions = MODE_ALLOWED_ACTIONS[AgentMode.ORCHESTRATOR];
      expect(actions).toContain("spawn");
      expect(actions).toContain("message");
      expect(actions).toContain("assign");
      expect(actions).toContain("delegate");
      expect(actions).toContain("approve");
      expect(actions).toContain("reject");
      expect(actions).toContain("read");
      expect(actions).toContain("create_task");
      expect(actions).not.toContain("*");
      expect(actions).not.toContain("execute");
    });

    it("should give OBSERVER only read access", () => {
      const actions = MODE_ALLOWED_ACTIONS[AgentMode.OBSERVER];
      expect(actions).toEqual(["read"]);
    });

    it("should define actions for all modes", () => {
      expect(MODE_ALLOWED_ACTIONS).toHaveProperty(AgentMode.WORKER);
      expect(MODE_ALLOWED_ACTIONS).toHaveProperty(AgentMode.ORCHESTRATOR);
      expect(MODE_ALLOWED_ACTIONS).toHaveProperty(AgentMode.OBSERVER);
    });
  });

  describe("isModeAllowed", () => {
    describe("WORKER mode", () => {
      it("should allow any action due to wildcard", () => {
        expect(isModeAllowed(AgentMode.WORKER, "spawn")).toBe(true);
        expect(isModeAllowed(AgentMode.WORKER, "execute")).toBe(true);
        expect(isModeAllowed(AgentMode.WORKER, "read")).toBe(true);
        expect(isModeAllowed(AgentMode.WORKER, "delete")).toBe(true);
        expect(isModeAllowed(AgentMode.WORKER, "anything")).toBe(true);
      });
    });

    describe("ORCHESTRATOR mode", () => {
      it("should allow coordination actions", () => {
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "spawn")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "message")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "assign")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "delegate")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "approve")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "reject")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "read")).toBe(true);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "create_task")).toBe(true);
      });

      it("should block execution actions", () => {
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "execute")).toBe(false);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "complete_task")).toBe(false);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "write")).toBe(false);
        expect(isModeAllowed(AgentMode.ORCHESTRATOR, "delete")).toBe(false);
      });
    });

    describe("OBSERVER mode", () => {
      it("should allow read action", () => {
        expect(isModeAllowed(AgentMode.OBSERVER, "read")).toBe(true);
      });

      it("should block all other actions", () => {
        expect(isModeAllowed(AgentMode.OBSERVER, "spawn")).toBe(false);
        expect(isModeAllowed(AgentMode.OBSERVER, "message")).toBe(false);
        expect(isModeAllowed(AgentMode.OBSERVER, "execute")).toBe(false);
        expect(isModeAllowed(AgentMode.OBSERVER, "write")).toBe(false);
        expect(isModeAllowed(AgentMode.OBSERVER, "assign")).toBe(false);
        expect(isModeAllowed(AgentMode.OBSERVER, "create_task")).toBe(false);
      });
    });
  });

  describe("MODE_LABELS", () => {
    it("should have human-readable labels for all modes", () => {
      expect(MODE_LABELS[AgentMode.WORKER]).toBe("Worker");
      expect(MODE_LABELS[AgentMode.ORCHESTRATOR]).toBe("Orchestrator");
      expect(MODE_LABELS[AgentMode.OBSERVER]).toBe("Observer");
    });
  });

  describe("MODE_DESCRIPTIONS", () => {
    it("should have descriptions for all modes", () => {
      expect(MODE_DESCRIPTIONS[AgentMode.WORKER]).toContain("Full");
      expect(MODE_DESCRIPTIONS[AgentMode.ORCHESTRATOR]).toContain("Coordination");
      expect(MODE_DESCRIPTIONS[AgentMode.OBSERVER]).toContain("Read-only");
    });
  });
});
