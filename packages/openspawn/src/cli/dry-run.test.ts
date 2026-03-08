import { describe, it, expect } from "vitest";
import { simulateDryRun } from "./dry-run.js";

// H3 = department, H4 = agents within department
const SAMPLE_ORG = `# Test Org

## Structure

### Operations

#### Boss — CEO
- **Level:** 10
- **Domain:** operations

#### Worker — Engineer
- **Level:** 4
- **Domain:** engineering
`;

describe("dry-run", () => {
  it("returns simulation result with agent count", () => {
    const result = simulateDryRun(SAMPLE_ORG);
    expect(result.agentCount).toBe(2);
    expect(result.departments).toBeGreaterThan(0);
  });

  it("simulates sample task creation", () => {
    const result = simulateDryRun(SAMPLE_ORG);
    expect(result.sampleTask).toBeDefined();
    expect(result.sampleTask.assignee).toBe("Boss");
  });

  it("simulates delegation chain", () => {
    const result = simulateDryRun(SAMPLE_ORG);
    expect(result.delegationChain.length).toBeGreaterThan(0);
    expect(result.delegationChain[0]).toContain("Boss");
  });
});
