import { describe, it, expect } from "vitest";
import { parseOrgMdContent, generateOrgMd } from "./org-parser.js";

const SAMPLE_ORG = `# Acme Corp

## Culture

- **Preset:** balanced
- **Escalation:** fast
- **Ack Required:** yes

## Policies

- **Per-Agent Limit:** $50
- **Alert Threshold:** 80%

## Structure

### CEO — executive

- **Level:** 10
- **Domain:** operations

### Engineering

#### Lead Engineer — Engineering Lead

- **Level:** 7
- **Domain:** engineering
- **Reports To:** CEO

#### Developer — worker

- **Level:** 4
- **Domain:** engineering
- **Count:** 2
`;

describe("org-parser", () => {
  it("parses org name", () => {
    const org = parseOrgMdContent(SAMPLE_ORG);
    expect(org.name).toBe("Acme Corp");
  });

  it("parses culture", () => {
    const org = parseOrgMdContent(SAMPLE_ORG);
    expect(org.culture.preset).toBe("balanced");
    expect(org.culture.escalationVelocity).toBe("fast");
    expect(org.culture.ackRequired).toBe(true);
  });

  it("parses policies", () => {
    const org = parseOrgMdContent(SAMPLE_ORG);
    expect(org.policies.perAgentBudget).toBe(50);
    expect(org.policies.alertThreshold).toBe(80);
  });

  it("parses agents from structure", () => {
    const org = parseOrgMdContent(SAMPLE_ORG);
    expect(org.agents.length).toBe(4); // CEO + Lead + 2 devs
    expect(org.agents[0].name).toBe("CEO");
    expect(org.agents[0].level).toBe(10);
  });

  it("handles count for multiple agents", () => {
    const org = parseOrgMdContent(SAMPLE_ORG);
    const devs = org.agents.filter((a) => a.name.startsWith("Developer"));
    expect(devs.length).toBe(2);
    expect(devs[0].id).toBe("developer-1");
    expect(devs[1].id).toBe("developer-2");
  });

  it("roundtrips via generateOrgMd", () => {
    const org = parseOrgMdContent(SAMPLE_ORG);
    const md = generateOrgMd(org);
    const org2 = parseOrgMdContent(md);
    expect(org2.name).toBe(org.name);
    expect(org2.agents.length).toBe(org.agents.length);
  });

  it("parses defaultAutonomy from culture", () => {
    const md = `# TestOrg

## Culture

- **Preset:** balanced
- **Default Autonomy:** 5

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** ops
`;
    const org = parseOrgMdContent(md);
    expect(org.culture.defaultAutonomy).toBe(5);
  });

  it("parses risk overrides from policies", () => {
    const md = `# TestOrg

## Policies

- **Per-Agent Limit:** $100

### Risk Overrides

- artifact_publish/migration: 9
- artifact_publish/component: 4

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** ops
`;
    const org = parseOrgMdContent(md);
    expect(org.policies.riskOverrides).toEqual({
      "artifact_publish/migration": 9,
      "artifact_publish/component": 4,
    });
  });

  it("parses guardrails section", () => {
    const md = `# TestOrg

## Guardrails

### no-friday-deploys

- **Trigger:** task.transition
- **Condition:** day_of_week != friday
- **Action:** block
- **Message:** Deploys are not allowed on Fridays.

### billing-escalation

- **Trigger:** task.created
- **Match:** billing|invoice|pricing
- **Action:** escalate
- **Escalate To:** cfo
- **Message:** Billing-related tasks require CFO review.

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** ops
`;
    const org = parseOrgMdContent(md);
    expect(org.guardrails).toBeDefined();
    expect(org.guardrails?.length).toBe(2);
    expect(org.guardrails?.[0].name).toBe("no-friday-deploys");
    expect(org.guardrails?.[0].action).toBe("block");
    expect(org.guardrails?.[0].condition).toBe("day_of_week != friday");
    expect(org.guardrails?.[1].name).toBe("billing-escalation");
    expect(org.guardrails?.[1].action).toBe("escalate");
    expect(org.guardrails?.[1].escalate_to).toBe("cfo");
    expect(org.guardrails?.[1].match).toBe("billing|invoice|pricing");
  });

  it("roundtrips guardrails via generateOrgMd", () => {
    const md = `# TestOrg

## Guardrails

### deploy-block

- **Trigger:** task.transition
- **Action:** block
- **Message:** No deploys allowed.

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** ops
`;
    const org = parseOrgMdContent(md);
    const generated = generateOrgMd(org);
    const org2 = parseOrgMdContent(generated);
    expect(org2.guardrails).toBeDefined();
    expect(org2.guardrails?.length).toBe(1);
    expect(org2.guardrails?.[0].name).toBe("deploy-block");
    expect(org2.guardrails?.[0].action).toBe("block");
  });

  it("returns undefined guardrails when section is absent", () => {
    const md = `# TestOrg

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** ops
`;
    const org = parseOrgMdContent(md);
    expect(org.guardrails).toBeUndefined();
  });

  it("roundtrips autonomy and risk overrides", () => {
    const md = `# TestOrg

## Culture

- **Preset:** balanced
- **Default Autonomy:** 7

## Policies

- **Per-Agent Limit:** $100

### Risk Overrides

- task_transition/done: 1

## Structure

### Worker — worker

- **Level:** 4
- **Domain:** ops
`;
    const org = parseOrgMdContent(md);
    const generated = generateOrgMd(org);
    const org2 = parseOrgMdContent(generated);
    expect(org2.culture.defaultAutonomy).toBe(7);
    expect(org2.policies.riskOverrides).toEqual({ "task_transition/done": 1 });
  });
});
