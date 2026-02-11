// ── ORG.md Parser ────────────────────────────────────────────────────────────
// Parses an ORG.md file into a ParsedOrg structure for the sandbox

import { readFileSync } from 'node:fs';
import type { SandboxAgent, ACPMessage } from './types.js';

export interface ParsedOrg {
  name: string;
  agents: SandboxAgent[];
  culture: {
    preset?: string;
    escalationVelocity?: string;
    progressFrequency?: string;
    ackRequired?: boolean;
    maxEscalationDepth?: number;
  };
  policies: {
    perAgentBudget?: number;
    alertThreshold?: number;
    departmentCaps?: Record<string, number>;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '').replace(/^-+/, '');
}

function inferLevelAndRole(name: string): { level: number; role: SandboxAgent['role'] } {
  const n = name.toLowerCase();
  if (/\b(coo|cto|ceo)\b/.test(n)) return { level: 10, role: 'coo' };
  if (/\b(vp|director|talent)\b/.test(n)) return { level: 9, role: 'talent' };
  if (/\b(lead|manager)\b/.test(n)) return { level: 7, role: 'lead' };
  if (/\b(senior|principal)\b/.test(n)) return { level: 6, role: 'senior' };
  if (/\b(junior|intern|assistant)\b/.test(n)) return { level: 1, role: 'intern' };
  // default: worker
  return { level: 4, role: 'worker' };
}

function extractMeta(lines: string[]): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const line of lines) {
    const m = line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)$/);
    if (m) {
      const key = m[1].trim().toLowerCase().replace(/\s+/g, '_');
      meta[key] = m[2].trim();
    }
  }
  return meta;
}

function extractProse(lines: string[]): string {
  return lines
    .filter(l => !l.match(/^-\s+\*\*.+:\*\*/) && l.trim().length > 0)
    .map(l => l.trim())
    .join(' ')
    .trim();
}

const wakeOnMap: Record<string, ACPMessage['type']> = {
  escalations: 'escalation',
  escalation: 'escalation',
  completions: 'completion',
  completion: 'completion',
  delegations: 'delegation',
  delegation: 'delegation',
  orders: 'delegation',
  progress: 'progress',
  ack: 'ack',
  status: 'status_request',
};

function parseTriggerMeta(meta: Record<string, string>): { trigger?: 'polling' | 'event-driven'; triggerOn?: ACPMessage['type'][] } {
  const result: { trigger?: 'polling' | 'event-driven'; triggerOn?: ACPMessage['type'][] } = {};
  if (meta['trigger']) {
    const t = meta['trigger'].toLowerCase().trim();
    if (t === 'event-driven' || t === 'event_driven') result.trigger = 'event-driven';
    else if (t === 'polling') result.trigger = 'polling';
  }
  if (meta['wake_on']) {
    result.triggerOn = meta['wake_on'].split(',').map(s => s.trim().toLowerCase())
      .map(s => wakeOnMap[s]).filter((s): s is ACPMessage['type'] => !!s);
  }
  return result;
}

function makeAgent(
  id: string,
  name: string,
  role: SandboxAgent['role'],
  level: number,
  domain: string,
  parentId: string | undefined,
  systemPrompt: string,
  triggerConfig?: { trigger?: 'polling' | 'event-driven'; triggerOn?: ACPMessage['type'][] },
): SandboxAgent {
  const canSpawn = level >= 7;
  const roleInstruction = level >= 7
    ? 'You DELEGATE tasks to your direct reports. If you have no reports, SPAWN agents first.'
    : level >= 5
    ? 'You do complex work and can delegate to juniors.'
    : 'You do assigned tasks. Escalate if stuck.';

  const spawnAction = canSpawn
    ? `\n- {"action":"spawn_agent","name":"...","domain":"...","role":"...","reason":"..."}`
    : '';

  const fullPrompt = `You are "${name}", L${level} ${domain}. ${roleInstruction}
${systemPrompt}
Respond with JSON ONLY. Actions:
- {"action":"delegate","taskId":"ID","targetAgentId":"ID","reason":"..."}
- {"action":"work","taskId":"ID","result":"what you did"}
- {"action":"message","to":"agent_id","content":"..."}
- {"action":"escalate","taskId":"ID","reason":"BLOCKED","body":"why stuck"}
- {"action":"create_task","title":"...","description":"...","priority":"normal"}
- {"action":"review","taskId":"ID","verdict":"approve","feedback":"..."}${spawnAction}
- {"action":"idle"}`;

  const defaultTrigger: 'polling' | 'event-driven' = level >= 7 ? 'event-driven' : 'polling';
  const defaultTriggerOn: ACPMessage['type'][] | undefined = level >= 7
    ? ['escalation', 'completion', 'delegation']
    : undefined;

  return {
    id,
    name,
    role,
    level,
    domain,
    parentId,
    status: 'active',
    systemPrompt: fullPrompt,
    taskIds: [],
    recentMessages: [],
    trigger: triggerConfig?.trigger ?? defaultTrigger,
    triggerOn: triggerConfig?.triggerOn ?? defaultTriggerOn,
    inbox: [],
    stats: {
      tasksCompleted: 0,
      tasksFailed: 0,
      messagessSent: 0,
      creditsEarned: 0,
      creditsSpent: 0,
    },
  };
}

// ── Section splitter ─────────────────────────────────────────────────────────

interface Section {
  heading: string;
  level: number;
  lines: string[];
  children: Section[];
}

function splitSections(text: string, minLevel = 1): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      if (level >= minLevel) {
        const section: Section = { heading: hMatch[2].trim(), level, lines: [], children: [] };
        if (current && level > current.level) {
          current.children.push(section);
          // Keep collecting into parent too (we'll also collect into child)
        }
        sections.push(section);
        current = section;
        continue;
      }
    }
    if (current) {
      current.lines.push(line);
    }
  }
  return sections;
}

// ── Main parser ──────────────────────────────────────────────────────────────

export function parseOrgMd(filePath: string): ParsedOrg {
  const raw = readFileSync(filePath, 'utf-8');
  return parseOrgMdContent(raw);
}

export function parseOrgMdContent(raw: string): ParsedOrg {
  const allSections = splitSections(raw, 1);

  // Extract org name from first H1
  const h1 = allSections.find(s => s.level === 1);
  const orgName = h1?.heading ?? 'Unnamed Org';

  // Find top-level (H2) sections
  const h2Sections = splitSections(raw, 2).filter(s => s.level === 2);
  const findSection = (name: string) =>
    h2Sections.find(s => s.heading.toLowerCase().includes(name.toLowerCase()));

  // ── Identity ───────────────────────────────────────────────────────────
  const identitySection = findSection('Identity');
  const identityContext = identitySection ? extractProse(identitySection.lines) : '';

  // ── Culture ────────────────────────────────────────────────────────────
  const cultureSection = findSection('Culture');
  const cultureMeta = cultureSection ? extractMeta(cultureSection.lines) : {};
  const cultureText = cultureSection ? cultureSection.lines.join('\n') : '';
  const presetMatch = cultureText.match(/preset:\s*(\w+)/i);
  const culture: ParsedOrg['culture'] = {
    preset: presetMatch?.[1] ?? cultureMeta['preset'],
    escalationVelocity: cultureMeta['escalation'],
    progressFrequency: cultureMeta['progress_updates'] ?? cultureMeta['progress'],
    ackRequired: cultureMeta['ack_required'] ? cultureMeta['ack_required'].toLowerCase() === 'yes' : undefined,
    maxEscalationDepth: cultureMeta['hierarchy_depth']
      ? parseInt(cultureMeta['hierarchy_depth'].replace(/\D/g, '')) || undefined
      : undefined,
  };

  // ── Policies ───────────────────────────────────────────────────────────
  const policiesSection = findSection('Policies');
  const policies: ParsedOrg['policies'] = {};
  if (policiesSection) {
    const allPolicyLines = policiesSection.lines;
    const pMeta = extractMeta(allPolicyLines);
    if (pMeta['per-agent_limit'] || pMeta['per_agent_limit']) {
      policies.perAgentBudget = parseInt((pMeta['per-agent_limit'] ?? pMeta['per_agent_limit']).replace(/\D/g, '')) || undefined;
    }
    if (pMeta['alert_threshold']) {
      policies.alertThreshold = parseInt(pMeta['alert_threshold'].replace(/\D/g, '')) || undefined;
    }
    // Parse department caps
    const caps: Record<string, number> = {};
    for (const line of allPolicyLines) {
      const capMatch = line.match(/^\s*-\s+(\w[\w\s]*?):\s*max\s+(\d+)/i);
      if (capMatch) {
        caps[capMatch[1].trim().toLowerCase()] = parseInt(capMatch[2]);
      }
    }
    if (Object.keys(caps).length > 0) policies.departmentCaps = caps;
  }

  // ── Playbooks ──────────────────────────────────────────────────────────
  const playbooksSection = findSection('Playbooks');
  const playbookText = playbooksSection
    ? playbooksSection.lines.join('\n').trim()
    : '';

  // ── Structure ──────────────────────────────────────────────────────────
  const structureSection = findSection('Structure');
  const agents: SandboxAgent[] = [];

  if (structureSection) {
    // Re-parse just the structure section to get nested headings
    const structStart = raw.indexOf('## Structure');
    if (structStart !== -1) {
      // Find next H2 or end
      const afterStruct = raw.slice(structStart + '## Structure'.length);
      const nextH2 = afterStruct.search(/\n## [^#]/);
      const structText = nextH2 !== -1 ? afterStruct.slice(0, nextH2) : afterStruct;

      const h3Sections: Array<{ heading: string; lines: string[]; h4s: Array<{ heading: string; lines: string[] }> }> = [];
      let curH3: typeof h3Sections[0] | null = null;
      let curH4: { heading: string; lines: string[] } | null = null;

      for (const line of structText.split('\n')) {
        const h3Match = line.match(/^###\s+(.+)$/);
        const h4Match = line.match(/^####\s+(.+)$/);

        if (h3Match) {
          curH3 = { heading: h3Match[1].trim(), lines: [], h4s: [] };
          h3Sections.push(curH3);
          curH4 = null;
        } else if (h4Match && curH3) {
          curH4 = { heading: h4Match[1].trim(), lines: [] };
          curH3.h4s.push(curH4);
        } else if (curH4) {
          curH4.lines.push(line);
        } else if (curH3) {
          curH3.lines.push(line);
        }
      }

      // Find the COO-level agent (if any)
      let cooId: string | undefined;

      for (const dept of h3Sections) {
        const deptMeta = extractMeta(dept.lines);
        const deptProse = extractProse(dept.lines);
        const { level: deptLevel, role: deptRole } = inferLevelAndRole(dept.heading);

        // Is this a C-level role (not a department)?
        const isCLevel = deptLevel >= 10;

        if (isCLevel || dept.h4s.length === 0) {
          // This is a direct agent at ### level
          const id = makeId(deptMeta['id'] ?? dept.heading);
          const domain = deptMeta['domain'] ?? dept.heading;
          const model = deptMeta['model'];
          const count = parseInt(deptMeta['count'] ?? '1') || 1;
          const reportsTo = deptMeta['reports_to'];
          const parentId = reportsTo ? makeId(reportsTo) : undefined;

          const context = [identityContext, deptProse].filter(Boolean).join(' ').slice(0, 300);
          const triggerInfo = parseTriggerMeta(deptMeta);

          for (let i = 0; i < count; i++) {
            const agentName = count > 1 ? `${dept.heading} ${i + 1}` : dept.heading;
            const agentId = count > 1 ? `${id}-${i + 1}` : id;
            const agent = makeAgent(agentId, agentName, deptRole, deptLevel, domain, parentId, context, triggerInfo);
            agents.push(agent);
            if (isCLevel) cooId = agentId;
          }
          continue;
        }

        // This is a department with sub-roles
        let deptLeadId: string | undefined;

        for (let ri = 0; ri < dept.h4s.length; ri++) {
          const sub = dept.h4s[ri];
          const subMeta = extractMeta(sub.lines);
          const subProse = extractProse(sub.lines);
          const { level: subLevel, role: subRole } = inferLevelAndRole(sub.heading);

          const id = makeId(subMeta['id'] ?? sub.heading);
          const domain = subMeta['domain'] ?? dept.heading;
          const count = parseInt(subMeta['count'] ?? '1') || 1;
          const reportsTo = subMeta['reports_to'];

          // Parent inference
          let parentId: string | undefined;
          if (reportsTo) {
            parentId = makeId(reportsTo);
          } else if (ri === 0) {
            // First role = department lead, reports to COO or top-level
            parentId = cooId;
            deptLeadId = count === 1 ? id : `${id}-1`;
          } else {
            // Subsequent roles report to department lead
            parentId = deptLeadId;
          }

          const context = [identityContext, deptProse, subProse].filter(Boolean).join(' ').slice(0, 300);
          const triggerInfo = parseTriggerMeta(subMeta);

          for (let i = 0; i < count; i++) {
            const agentName = count > 1 ? `${sub.heading} ${i + 1}` : sub.heading;
            const agentId = count > 1 ? `${id}-${i + 1}` : id;
            const agent = makeAgent(agentId, agentName, subRole, subLevel, domain, parentId, context, triggerInfo);
            agents.push(agent);
          }
        }
      }
    }
  }

  return { name: orgName, agents, culture, policies };
}
