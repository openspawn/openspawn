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
});
