import { UnprocessableEntityException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { TaskStatus } from "@openspawn/shared-types";

import { TaskTransitionService } from "./task-transition.service";

describe("TaskTransitionService", () => {
  const service = new TaskTransitionService();

  // ---------------------------------------------------------------------------
  // isValidTransition
  // ---------------------------------------------------------------------------
  describe("isValidTransition", () => {
    describe("BACKLOG transitions", () => {
      it("should allow BACKLOG → TODO", () => {
        expect(service.isValidTransition(TaskStatus.BACKLOG, TaskStatus.TODO)).toBe(true);
      });

      it("should allow BACKLOG → CANCELLED", () => {
        expect(service.isValidTransition(TaskStatus.BACKLOG, TaskStatus.CANCELLED)).toBe(true);
      });

      it("should reject BACKLOG → IN_PROGRESS", () => {
        expect(service.isValidTransition(TaskStatus.BACKLOG, TaskStatus.IN_PROGRESS)).toBe(false);
      });

      it("should reject BACKLOG → REVIEW", () => {
        expect(service.isValidTransition(TaskStatus.BACKLOG, TaskStatus.REVIEW)).toBe(false);
      });

      it("should reject BACKLOG → DONE", () => {
        expect(service.isValidTransition(TaskStatus.BACKLOG, TaskStatus.DONE)).toBe(false);
      });

      it("should reject BACKLOG → BLOCKED", () => {
        expect(service.isValidTransition(TaskStatus.BACKLOG, TaskStatus.BLOCKED)).toBe(false);
      });
    });

    describe("TODO transitions", () => {
      it("should allow TODO → IN_PROGRESS", () => {
        expect(service.isValidTransition(TaskStatus.TODO, TaskStatus.IN_PROGRESS)).toBe(true);
      });

      it("should allow TODO → BLOCKED", () => {
        expect(service.isValidTransition(TaskStatus.TODO, TaskStatus.BLOCKED)).toBe(true);
      });

      it("should allow TODO → CANCELLED", () => {
        expect(service.isValidTransition(TaskStatus.TODO, TaskStatus.CANCELLED)).toBe(true);
      });

      it("should reject TODO → BACKLOG", () => {
        expect(service.isValidTransition(TaskStatus.TODO, TaskStatus.BACKLOG)).toBe(false);
      });

      it("should reject TODO → REVIEW", () => {
        expect(service.isValidTransition(TaskStatus.TODO, TaskStatus.REVIEW)).toBe(false);
      });

      it("should reject TODO → DONE", () => {
        expect(service.isValidTransition(TaskStatus.TODO, TaskStatus.DONE)).toBe(false);
      });
    });

    describe("IN_PROGRESS transitions", () => {
      it("should allow IN_PROGRESS → REVIEW", () => {
        expect(service.isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.REVIEW)).toBe(true);
      });

      it("should allow IN_PROGRESS → BLOCKED", () => {
        expect(service.isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED)).toBe(true);
      });

      it("should allow IN_PROGRESS → CANCELLED", () => {
        expect(service.isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED)).toBe(true);
      });

      it("should reject IN_PROGRESS → TODO", () => {
        expect(service.isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.TODO)).toBe(false);
      });

      it("should reject IN_PROGRESS → BACKLOG", () => {
        expect(service.isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.BACKLOG)).toBe(false);
      });

      it("should reject IN_PROGRESS → DONE (must go via REVIEW)", () => {
        expect(service.isValidTransition(TaskStatus.IN_PROGRESS, TaskStatus.DONE)).toBe(false);
      });
    });

    describe("REVIEW transitions", () => {
      it("should allow REVIEW → DONE", () => {
        expect(service.isValidTransition(TaskStatus.REVIEW, TaskStatus.DONE)).toBe(true);
      });

      it("should allow REVIEW → IN_PROGRESS (rework)", () => {
        expect(service.isValidTransition(TaskStatus.REVIEW, TaskStatus.IN_PROGRESS)).toBe(true);
      });

      it("should allow REVIEW → CANCELLED", () => {
        expect(service.isValidTransition(TaskStatus.REVIEW, TaskStatus.CANCELLED)).toBe(true);
      });

      it("should reject REVIEW → TODO", () => {
        expect(service.isValidTransition(TaskStatus.REVIEW, TaskStatus.TODO)).toBe(false);
      });

      it("should reject REVIEW → BACKLOG", () => {
        expect(service.isValidTransition(TaskStatus.REVIEW, TaskStatus.BACKLOG)).toBe(false);
      });

      it("should reject REVIEW → BLOCKED", () => {
        expect(service.isValidTransition(TaskStatus.REVIEW, TaskStatus.BLOCKED)).toBe(false);
      });
    });

    describe("BLOCKED transitions", () => {
      it("should allow BLOCKED → TODO", () => {
        expect(service.isValidTransition(TaskStatus.BLOCKED, TaskStatus.TODO)).toBe(true);
      });

      it("should allow BLOCKED → IN_PROGRESS", () => {
        expect(service.isValidTransition(TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS)).toBe(true);
      });

      it("should allow BLOCKED → CANCELLED", () => {
        expect(service.isValidTransition(TaskStatus.BLOCKED, TaskStatus.CANCELLED)).toBe(true);
      });

      it("should reject BLOCKED → REVIEW", () => {
        expect(service.isValidTransition(TaskStatus.BLOCKED, TaskStatus.REVIEW)).toBe(false);
      });

      it("should reject BLOCKED → DONE", () => {
        expect(service.isValidTransition(TaskStatus.BLOCKED, TaskStatus.DONE)).toBe(false);
      });
    });

    describe("DONE (terminal) transitions", () => {
      it("should reject DONE → any status", () => {
        for (const status of Object.values(TaskStatus)) {
          expect(service.isValidTransition(TaskStatus.DONE, status)).toBe(false);
        }
      });
    });

    describe("CANCELLED (terminal) transitions", () => {
      it("should reject CANCELLED → any status", () => {
        for (const status of Object.values(TaskStatus)) {
          expect(service.isValidTransition(TaskStatus.CANCELLED, status)).toBe(false);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validateTransition
  // ---------------------------------------------------------------------------
  describe("validateTransition", () => {
    it("should not throw for valid transition", () => {
      expect(() => service.validateTransition(TaskStatus.BACKLOG, TaskStatus.TODO)).not.toThrow();
    });

    it("should throw UnprocessableEntityException for invalid transition", () => {
      expect(() => service.validateTransition(TaskStatus.BACKLOG, TaskStatus.IN_PROGRESS)).toThrow(
        UnprocessableEntityException,
      );
    });

    it("should include the from/to statuses in the error message", () => {
      expect(() => service.validateTransition(TaskStatus.DONE, TaskStatus.IN_PROGRESS)).toThrow(
        /done.*in_progress/i,
      );
    });

    it("should throw when trying to leave a terminal CANCELLED state", () => {
      expect(() => service.validateTransition(TaskStatus.CANCELLED, TaskStatus.TODO)).toThrow(
        UnprocessableEntityException,
      );
    });

    it("should throw when trying to leave a terminal DONE state", () => {
      expect(() => service.validateTransition(TaskStatus.DONE, TaskStatus.TODO)).toThrow(
        UnprocessableEntityException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getValidTransitions
  // ---------------------------------------------------------------------------
  describe("getValidTransitions", () => {
    it("should return [TODO, CANCELLED] for BACKLOG", () => {
      const valid = service.getValidTransitions(TaskStatus.BACKLOG);
      expect(valid).toEqual(expect.arrayContaining([TaskStatus.TODO, TaskStatus.CANCELLED]));
      expect(valid).toHaveLength(2);
    });

    it("should return [IN_PROGRESS, BLOCKED, CANCELLED] for TODO", () => {
      const valid = service.getValidTransitions(TaskStatus.TODO);
      expect(valid).toEqual(
        expect.arrayContaining([TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.CANCELLED]),
      );
      expect(valid).toHaveLength(3);
    });

    it("should return [REVIEW, BLOCKED, CANCELLED] for IN_PROGRESS", () => {
      const valid = service.getValidTransitions(TaskStatus.IN_PROGRESS);
      expect(valid).toEqual(
        expect.arrayContaining([TaskStatus.REVIEW, TaskStatus.BLOCKED, TaskStatus.CANCELLED]),
      );
      expect(valid).toHaveLength(3);
    });

    it("should return [DONE, IN_PROGRESS, CANCELLED] for REVIEW", () => {
      const valid = service.getValidTransitions(TaskStatus.REVIEW);
      expect(valid).toEqual(
        expect.arrayContaining([TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED]),
      );
      expect(valid).toHaveLength(3);
    });

    it("should return [TODO, IN_PROGRESS, CANCELLED] for BLOCKED", () => {
      const valid = service.getValidTransitions(TaskStatus.BLOCKED);
      expect(valid).toEqual(
        expect.arrayContaining([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED]),
      );
      expect(valid).toHaveLength(3);
    });

    it("should return empty array for DONE", () => {
      expect(service.getValidTransitions(TaskStatus.DONE)).toEqual([]);
    });

    it("should return empty array for CANCELLED", () => {
      expect(service.getValidTransitions(TaskStatus.CANCELLED)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // isTerminal
  // ---------------------------------------------------------------------------
  describe("isTerminal", () => {
    it("should return true for DONE", () => {
      expect(service.isTerminal(TaskStatus.DONE)).toBe(true);
    });

    it("should return true for CANCELLED", () => {
      expect(service.isTerminal(TaskStatus.CANCELLED)).toBe(true);
    });

    it("should return false for BACKLOG", () => {
      expect(service.isTerminal(TaskStatus.BACKLOG)).toBe(false);
    });

    it("should return false for TODO", () => {
      expect(service.isTerminal(TaskStatus.TODO)).toBe(false);
    });

    it("should return false for IN_PROGRESS", () => {
      expect(service.isTerminal(TaskStatus.IN_PROGRESS)).toBe(false);
    });

    it("should return false for REVIEW", () => {
      expect(service.isTerminal(TaskStatus.REVIEW)).toBe(false);
    });

    it("should return false for BLOCKED", () => {
      expect(service.isTerminal(TaskStatus.BLOCKED)).toBe(false);
    });
  });
});
