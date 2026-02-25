import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { AgentMode } from "@openspawn/shared-types";

import { AgentModeGuard } from "./agent-mode.guard";
import { AGENT_MODES_KEY } from "./decorators/requires-mode.decorator";

describe("AgentModeGuard", () => {
  let guard: AgentModeGuard;
  let reflector: Reflector;

  const createMockExecutionContext = (agent?: { mode?: AgentMode }): ExecutionContext => {
    const mockRequest = {
      agent,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AgentModeGuard(reflector);
  });

  describe("when no modes are required", () => {
    it("should allow access for any authenticated agent", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

      const context = createMockExecutionContext({ mode: AgentMode.WORKER });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("should allow access when required modes array is empty", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([]);

      const context = createMockExecutionContext({ mode: AgentMode.OBSERVER });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("when agent is not authenticated", () => {
    it("should throw ForbiddenException", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow("Authentication required");
    });
  });

  describe("WORKER mode", () => {
    it("should allow access when WORKER is required and agent is WORKER", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      const context = createMockExecutionContext({ mode: AgentMode.WORKER });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("should block ORCHESTRATOR when only WORKER is required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      const context = createMockExecutionContext({ mode: AgentMode.ORCHESTRATOR });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/requires Worker mode/);
      expect(() => guard.canActivate(context)).toThrow(/current mode is Orchestrator/);
    });

    it("should block OBSERVER when only WORKER is required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      const context = createMockExecutionContext({ mode: AgentMode.OBSERVER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/current mode is Observer/);
    });
  });

  describe("ORCHESTRATOR mode", () => {
    it("should allow access when ORCHESTRATOR is required and agent is ORCHESTRATOR", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.ORCHESTRATOR]);

      const context = createMockExecutionContext({ mode: AgentMode.ORCHESTRATOR });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("should block WORKER when only ORCHESTRATOR is required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.ORCHESTRATOR]);

      const context = createMockExecutionContext({ mode: AgentMode.WORKER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("OBSERVER mode", () => {
    it("should allow access when OBSERVER is required and agent is OBSERVER", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.OBSERVER]);

      const context = createMockExecutionContext({ mode: AgentMode.OBSERVER });
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe("multiple modes allowed", () => {
    it("should allow WORKER when WORKER or ORCHESTRATOR is required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        AgentMode.WORKER,
        AgentMode.ORCHESTRATOR,
      ]);

      const context = createMockExecutionContext({ mode: AgentMode.WORKER });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("should allow ORCHESTRATOR when WORKER or ORCHESTRATOR is required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        AgentMode.WORKER,
        AgentMode.ORCHESTRATOR,
      ]);

      const context = createMockExecutionContext({ mode: AgentMode.ORCHESTRATOR });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("should block OBSERVER when only WORKER or ORCHESTRATOR is required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        AgentMode.WORKER,
        AgentMode.ORCHESTRATOR,
      ]);

      const context = createMockExecutionContext({ mode: AgentMode.OBSERVER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(/requires Worker or Orchestrator mode/);
    });

    it("should allow any mode when all three are required", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        AgentMode.WORKER,
        AgentMode.ORCHESTRATOR,
        AgentMode.OBSERVER,
      ]);

      expect(
        guard.canActivate(createMockExecutionContext({ mode: AgentMode.WORKER })),
      ).toBe(true);
      expect(
        guard.canActivate(createMockExecutionContext({ mode: AgentMode.ORCHESTRATOR })),
      ).toBe(true);
      expect(
        guard.canActivate(createMockExecutionContext({ mode: AgentMode.OBSERVER })),
      ).toBe(true);
    });
  });

  describe("backwards compatibility", () => {
    it("should default to WORKER mode when agent has no mode set", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      // Agent without mode property (old agents)
      const context = createMockExecutionContext({ mode: undefined });
      expect(guard.canActivate(context)).toBe(true);
    });

    it("should block old agents without mode from ORCHESTRATOR-only endpoints", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.ORCHESTRATOR]);

      const context = createMockExecutionContext({ mode: undefined });
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe("error messages", () => {
    it("should include required mode label in error", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      const context = createMockExecutionContext({ mode: AgentMode.OBSERVER });

      try {
        guard.canActivate(context);
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ForbiddenException).message).toContain("Worker");
      }
    });

    it("should include current mode label in error", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([AgentMode.WORKER]);

      const context = createMockExecutionContext({ mode: AgentMode.ORCHESTRATOR });

      try {
        guard.canActivate(context);
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ForbiddenException).message).toContain("Orchestrator");
      }
    });

    it("should list multiple required modes with 'or'", () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
        AgentMode.WORKER,
        AgentMode.ORCHESTRATOR,
      ]);

      const context = createMockExecutionContext({ mode: AgentMode.OBSERVER });

      try {
        guard.canActivate(context);
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as ForbiddenException).message).toMatch(/Worker or Orchestrator/);
      }
    });
  });
});
