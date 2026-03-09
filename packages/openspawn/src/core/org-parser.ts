// ── ORG.md Parser ────────────────────────────────────────────────────────────
// Ported from tools/sandbox/src/org-parser.ts — simplified for standalone use.
// Zero external deps: uses a simple line-based markdown parser instead of remark.

import { readFileSync } from "node:fs";
import { AgentStatus } from "./types.js";
import type { Agent, ParsedOrg } from "./types.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "")
    .replace(/^-+/, "");
}

function nameFromHeading(heading: string): string {
  const dashIdx = heading.indexOf(" — ");
  return dashIdx > 0 ? heading.slice(0, dashIdx).trim() : heading.trim();
}

function inferLevelAndRole(name: string): { level: number; role: string } {
  const n = name.toLowerCase();
  if (/\b(coo|cto|ceo)\b/.test(n)) return { level: 10, role: "executive" };
  if (/\b(cfo|vp|director|talent)\b/.test(n)) return { level: 9, role: "director" };
  if (/\b(lead|manager)\b/.test(n)) return { level: 7, role: "lead" };
  if (/\b(senior|principal)\b/.test(n)) return { level: 6, role: "senior" };
  if (/\b(junior|intern|assistant)\b/.test(n)) return { level: 1, role: "intern" };
  return { level: 4, role: "worker" };
}

// ── Line-based section parser ────────────────────────────────────────────────

interface Section {
  heading: string;
  level: number;
  lines: string[];
  children: Section[];
}

function parseSections(text: string): Section[] {
  const lines = text.split("\n");
  const root: Section[] = [];
  const stack: Section[] = [];

  for (const line of lines) {
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const heading = hMatch[2].trim();
      const section: Section = { heading, level, lines: [], children: [] };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(section);
      } else {
        root.push(section);
      }
      stack.push(section);
    } else if (stack.length > 0) {
      stack[stack.length - 1].lines.push(line);
    }
  }
  return root;
}

function extractMeta(lines: string[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of lines) {
    // Match "- **Key:** Value" or "- Key: Value"
    const m = line.match(/^[-*]\s+\*{0,2}([^*]+?)\*{0,2}:\*{0,2}\s*(.+)$/);
    if (m) {
      const key = m[1]
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
      meta[key] = m[2].trim();
    }
  }
  return meta;
}

function findSection(sections: Section[], name: string): Section | undefined {
  return sections.find((s) => s.heading.toLowerCase().includes(name.toLowerCase()));
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseOrgMd(filePath: string): ParsedOrg {
  const raw = readFileSync(filePath, "utf-8");
  return parseOrgMdContent(raw);
}

export function parseOrgMdContent(raw: string): ParsedOrg {
  const sections = parseSections(raw);

  const h1 = sections.find((s) => s.level === 1);
  const orgName = h1?.heading ?? "Unnamed Org";

  const h2Sections = h1
    ? h1.children.filter((s) => s.level === 2)
    : sections.filter((s) => s.level === 2);

  // ── Culture ──
  const cultureSection = findSection(h2Sections, "Culture");
  const cultureMeta = cultureSection ? extractMeta(cultureSection.lines) : {};
  const culture: ParsedOrg["culture"] = {
    preset: cultureMeta["preset"],
    escalationVelocity: cultureMeta["escalation"],
    progressFrequency: cultureMeta["progress_updates"] ?? cultureMeta["progress"],
    ackRequired: cultureMeta["ack_required"]
      ? cultureMeta["ack_required"].toLowerCase() === "yes"
      : undefined,
    maxEscalationDepth: cultureMeta["hierarchy_depth"]
      ? parseInt(cultureMeta["hierarchy_depth"].replace(/\D/g, "")) || undefined
      : undefined,
  };

  // ── Policies ──
  const policiesSection = findSection(h2Sections, "Policies");
  const policies: ParsedOrg["policies"] = {};
  if (policiesSection) {
    const pMeta = extractMeta([
      ...policiesSection.lines,
      ...policiesSection.children.flatMap((c) => c.lines),
    ]);
    if (pMeta["per_agent_limit"]) {
      policies.perAgentBudget = parseInt(pMeta["per_agent_limit"].replace(/\D/g, "")) || undefined;
    }
    if (pMeta["alert_threshold"]) {
      policies.alertThreshold = parseInt(pMeta["alert_threshold"].replace(/\D/g, "")) || undefined;
    }
    const caps: Record<string, number> = {};
    for (const child of policiesSection.children) {
      if (child.heading.toLowerCase().includes("department cap")) {
        for (const line of child.lines) {
          const capMatch = line.match(/^[-*]\s+(\w[\w\s]*?):\s*max\s+(\d+)/i);
          if (capMatch) {
            caps[capMatch[1].trim().toLowerCase()] = parseInt(capMatch[2]);
          }
        }
      }
    }
    if (Object.keys(caps).length > 0) policies.departmentCaps = caps;
  }

  // ── Structure ──
  const structureSection = findSection(h2Sections, "Structure");
  const agents: Agent[] = [];

  if (structureSection) {
    let topLevelId: string | undefined;

    for (const dept of structureSection.children) {
      if (dept.level !== 3) continue;

      const deptMeta = extractMeta(dept.lines);
      const inferred = inferLevelAndRole(dept.heading);
      const deptLevel = deptMeta["level"]
        ? parseInt(deptMeta["level"]) || inferred.level
        : inferred.level;

      const isCLevel = deptLevel >= 10;

      if (isCLevel || dept.children.length === 0) {
        const id = makeId(deptMeta["id"] ?? nameFromHeading(dept.heading));
        const domain = deptMeta["domain"] ?? dept.heading;
        const count = parseInt(deptMeta["count"] ?? "1") || 1;
        const reportsTo = deptMeta["reports_to"];
        const parentId = reportsTo ? makeId(reportsTo) : undefined;

        for (let i = 0; i < count; i++) {
          const displayName = nameFromHeading(dept.heading);
          const agentName = count > 1 ? `${displayName} ${i + 1}` : displayName;
          const agentId = count > 1 ? `${id}-${i + 1}` : id;
          agents.push({
            id: agentId,
            name: agentName,
            role: inferred.role,
            level: deptLevel,
            domain,
            parentId,
            model: deptMeta["model"],
            status: AgentStatus.Active,
          });
          if (isCLevel) topLevelId = agentId;
        }
        continue;
      }

      // Department with sub-roles
      let deptLeadId: string | undefined;

      for (let ri = 0; ri < dept.children.length; ri++) {
        const sub = dept.children[ri];
        if (sub.level !== 4) continue;

        const subMeta = extractMeta(sub.lines);
        const subInferred = inferLevelAndRole(sub.heading);
        const subLevel = subMeta["level"]
          ? parseInt(subMeta["level"]) || subInferred.level
          : subInferred.level;

        const id = makeId(subMeta["id"] ?? nameFromHeading(sub.heading));
        const domain = subMeta["domain"] ?? dept.heading;
        const count = parseInt(subMeta["count"] ?? "1") || 1;
        const reportsTo = subMeta["reports_to"];

        let parentId: string | undefined;
        if (reportsTo) {
          parentId = makeId(reportsTo);
        } else if (ri === 0) {
          parentId = topLevelId;
          deptLeadId = count === 1 ? id : `${id}-1`;
        } else {
          parentId = deptLeadId;
        }

        for (let i = 0; i < count; i++) {
          const displayName = nameFromHeading(sub.heading);
          const agentName = count > 1 ? `${displayName} ${i + 1}` : displayName;
          const agentId = count > 1 ? `${id}-${i + 1}` : id;
          agents.push({
            id: agentId,
            name: agentName,
            role: subInferred.role,
            level: subLevel,
            domain,
            parentId,
            model: subMeta["model"],
            status: AgentStatus.Active,
          });
        }
      }
    }
  }

  return { name: orgName, agents, culture, policies };
}

// ── ORG.md Generator ─────────────────────────────────────────────────────────

export function generateOrgMd(org: ParsedOrg): string {
  const lines: string[] = [`# ${org.name}`, ""];

  if (org.culture.preset || org.culture.escalationVelocity) {
    lines.push("## Culture", "");
    if (org.culture.preset) lines.push(`- **Preset:** ${org.culture.preset}`);
    if (org.culture.escalationVelocity)
      lines.push(`- **Escalation:** ${org.culture.escalationVelocity}`);
    if (org.culture.progressFrequency)
      lines.push(`- **Progress Updates:** ${org.culture.progressFrequency}`);
    if (org.culture.ackRequired !== undefined)
      lines.push(`- **Ack Required:** ${org.culture.ackRequired ? "yes" : "no"}`);
    lines.push("");
  }

  if (Object.keys(org.policies).length > 0) {
    lines.push("## Policies", "");
    if (org.policies.perAgentBudget)
      lines.push(`- **Per-Agent Limit:** $${org.policies.perAgentBudget}`);
    if (org.policies.alertThreshold)
      lines.push(`- **Alert Threshold:** ${org.policies.alertThreshold}%`);
    lines.push("");
  }

  if (org.agents.length > 0) {
    lines.push("## Structure", "");
    for (const agent of org.agents) {
      lines.push(`### ${agent.name} — ${agent.role}`, "");
      lines.push(`- **Level:** ${agent.level}`);
      lines.push(`- **Domain:** ${agent.domain}`);
      if (agent.parentId) lines.push(`- **Reports To:** ${agent.parentId}`);
      if (agent.model) lines.push(`- **Model:** ${agent.model}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
